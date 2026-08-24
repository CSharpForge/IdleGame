import type { AchievementDef } from '../data/achievementDefs'
import { getNewlyUnlockedAchievements } from '../data/achievementDefs'
import { buildAchievementSnapshot, buildLocationSnapshots } from './locationStats'
import { computeOfflineEarnings } from './offlineEarnings'
import { eventIncomeMultiplier, isEventActive, type ActiveEvent } from './events'
import { prestigeIncomeMultiplier } from './prestige'
import { upgradeIncomeMultiplier } from './upgrades'
import type { PersistedState } from './saveLoad'

export interface RehydrationResult {
  activeEvent: ActiveEvent | null
  lastTickTimestamp: number
  cash: number
  totalEarned: number
  lifetimeEarned: number
  pendingOfflineEarnings: { incomeEarned: number; elapsedSeconds: number } | null
  unlockedAchievementIds: string[]
  newlyUnlockedAchievements: AchievementDef[]
}

/**
 * The pure logic behind loading a save: clears an expired timed event,
 * grants offline catch-up income, and re-checks achievements — all as of
 * `now`, without mutating anything. Shared by the live store's
 * `onRehydrateStorage` (loading the local save) and Play Games cloud-save
 * conflict resolution (evaluating a candidate cloud save without touching
 * the live store), so both paths stay consistent with exactly one
 * implementation of "what does loading this save produce right now."
 */
export function computeRehydratedState(saved: PersistedState, now: number = Date.now()): RehydrationResult {
  let activeEvent = saved.activeEvent
  if (activeEvent && !isEventActive(activeEvent, now)) activeEvent = null

  const snapshots = buildLocationSnapshots(saved, activeEvent, now)
  const multiplier =
    upgradeIncomeMultiplier(saved.upgradeLevels.marketing, saved.upgradeLevels.staffTraining) *
    prestigeIncomeMultiplier(saved.prestigePoints) *
    eventIncomeMultiplier(activeEvent, now)

  const { incomeEarned, elapsedSeconds } = computeOfflineEarnings(snapshots, multiplier, saved.lastTickTimestamp, now)

  let cash = saved.cash
  let totalEarned = saved.totalEarned
  let lifetimeEarned = saved.lifetimeEarned
  let pendingOfflineEarnings: RehydrationResult['pendingOfflineEarnings'] = null
  if (incomeEarned > 0 && elapsedSeconds > 5) {
    cash += incomeEarned
    totalEarned += incomeEarned
    lifetimeEarned += incomeEarned
    pendingOfflineEarnings = { incomeEarned, elapsedSeconds }
  }

  const newlyUnlockedAchievements = getNewlyUnlockedAchievements(
    buildAchievementSnapshot({ ...saved, lifetimeEarned }),
    saved.unlockedAchievementIds,
  )
  const unlockedAchievementIds =
    newlyUnlockedAchievements.length > 0
      ? [...saved.unlockedAchievementIds, ...newlyUnlockedAchievements.map((a) => a.id)]
      : saved.unlockedAchievementIds

  return {
    activeEvent,
    lastTickTimestamp: now,
    cash,
    totalEarned,
    lifetimeEarned,
    pendingOfflineEarnings,
    unlockedAchievementIds,
    newlyUnlockedAchievements,
  }
}
