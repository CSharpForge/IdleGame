import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'
import { ACHIEVEMENTS } from '../../game/data/achievementDefs'
import { toPersistedState, useGameStore } from '../../game/state/store'
import { resolveConflict } from './conflictResolution'
import { loadCloudSnapshot, saveCloudSnapshot, signInSilently, submitLifetimeEarningsScore } from './playGamesClient'
import { reportAchievementUnlocks } from './achievementReporting'

const SYNC_INTERVAL_MS = 5 * 60 * 1000

async function pushToCloud(): Promise<void> {
  const persisted = toPersistedState(useGameStore.getState())
  await saveCloudSnapshot(persisted)
  await submitLifetimeEarningsScore(persisted.lifetimeEarned)
}

/**
 * Reports every currently-unlocked achievement, once per successful sign-in.
 * Play Games' unlockAchievement call is documented as idempotent (already-
 * unlocked achievements just no-op), so this is safe to call repeatedly
 * across sessions — and it's what covers two real gaps a plain "report only
 * what's newly unlocked this tick" hook would miss: an achievement unlocked
 * before Play Games was ever signed in on this device, and one unlocked on
 * a different device that this device's local save doesn't know it needs
 * to (re-)report.
 */
function reportAllUnlockedAchievements(unlockedIds: string[]): void {
  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id))
  if (unlocked.length > 0) reportAchievementUnlocks(unlocked)
}

async function reconcileWithCloud(): Promise<void> {
  const signedIn = await signInSilently()
  if (!signedIn) return

  const localPersisted = toPersistedState(useGameStore.getState())
  const cloudPersisted = await loadCloudSnapshot()
  const resolution = resolveConflict(localPersisted, cloudPersisted, Date.now())

  if (resolution.winner === 'cloud' && resolution.cloudResult && cloudPersisted) {
    const cloudResult = resolution.cloudResult
    useGameStore.setState({
      cash: cloudResult.cash,
      totalEarned: cloudResult.totalEarned,
      lifetimeEarned: cloudResult.lifetimeEarned,
      lastTickTimestamp: cloudResult.lastTickTimestamp,
      activeEvent: cloudResult.activeEvent,
      unlockedAchievementIds: cloudResult.unlockedAchievementIds,
      locations: cloudPersisted.locations,
      activeLocationId: cloudPersisted.activeLocationId,
      upgradeLevels: cloudPersisted.upgradeLevels,
      prestigePoints: cloudPersisted.prestigePoints,
      prestigeCount: cloudPersisted.prestigeCount,
      prestigeUpgradeLevels: cloudPersisted.prestigeUpgradeLevels,
      eventsExperienced: cloudPersisted.eventsExperienced,
      currentSatisfactionStreakSeconds: cloudPersisted.currentSatisfactionStreakSeconds,
      bestSatisfactionStreakSeconds: cloudPersisted.bestSatisfactionStreakSeconds,
      totalPlaytimeSeconds: cloudPersisted.totalPlaytimeSeconds,
      muted: cloudPersisted.muted ?? localPersisted.muted,
    })
    reportAllUnlockedAchievements(cloudResult.unlockedAchievementIds)
  } else {
    reportAllUnlockedAchievements(localPersisted.unlockedAchievementIds)
  }

  await pushToCloud()
}

/**
 * Wires automatic, silent Play Games sync into the app lifecycle
 * (Android-only, no-op elsewhere): reconcile once on mount, then push to
 * the cloud on backgrounding and on a periodic backstop interval. Not on
 * every economy tick — Snapshots has write-quota limits.
 */
export function usePlayGamesSync(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return

    void reconcileWithCloud()

    const pauseHandle = CapacitorApp.addListener('pause', () => {
      void pushToCloud()
    })
    const intervalId = setInterval(() => {
      void pushToCloud()
    }, SYNC_INTERVAL_MS)

    return () => {
      void pauseHandle.then((handle) => handle.remove())
      clearInterval(intervalId)
    }
  }, [])
}
