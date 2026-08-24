import { Capacitor } from '@capacitor/core'
import { LIFETIME_EARNINGS_LEADERBOARD_ID } from '../../game/data/playGamesIds'
import { CURRENT_SAVE_VERSION, migrateSave } from '../../game/systems/migrations'
import { persistedStateSchema, type PersistedState } from '../../game/systems/saveLoad'
import { PlayGames } from './PlayGamesPlugin'

const SNAPSHOT_NAME = 'grand-stay-tycoon-save'

function isAndroidNative(): boolean {
  return Capacitor.getPlatform() === 'android'
}

/**
 * Every export below is platform-gated (no-ops off Android) and never
 * throws — a cloud-sync failure must never surface into or block gameplay,
 * matching saveLoad.ts's createValidatedStorage "never throw" philosophy.
 */

export async function signInSilently(): Promise<boolean> {
  if (!isAndroidNative()) return false
  try {
    const { signedIn } = await PlayGames.signInSilently()
    return signedIn
  } catch (err) {
    console.warn('Play Games silent sign-in failed.', err)
    return false
  }
}

export async function saveCloudSnapshot(state: PersistedState): Promise<void> {
  if (!isAndroidNative()) return
  try {
    const envelope = { state, version: CURRENT_SAVE_VERSION }
    await PlayGames.saveSnapshot({ snapshotName: SNAPSHOT_NAME, dataJson: JSON.stringify(envelope) })
  } catch (err) {
    console.warn('Failed to save Play Games cloud snapshot.', err)
  }
}

/**
 * Runs the loaded blob through the exact same migrateSave/persistedStateSchema
 * machinery local saves use, so a cloud snapshot older than the app's current
 * save version is upgraded in place rather than rejected. Returns null (never
 * throws) on any missing/malformed/unfixable data — treated as "no cloud save".
 */
export async function loadCloudSnapshot(): Promise<PersistedState | null> {
  if (!isAndroidNative()) return null
  try {
    const { dataJson } = await PlayGames.loadSnapshot({ snapshotName: SNAPSHOT_NAME })
    if (!dataJson) return null
    const parsed = JSON.parse(dataJson) as { state: unknown; version: number }
    const migrated = migrateSave(parsed.state, parsed.version)
    const result = persistedStateSchema.safeParse(migrated)
    return result.success ? result.data : null
  } catch (err) {
    console.warn('Failed to load Play Games cloud snapshot.', err)
    return null
  }
}

export async function reportAchievementUnlock(playGamesAchievementId: string): Promise<void> {
  if (!isAndroidNative()) return
  try {
    await PlayGames.unlockAchievement({ achievementId: playGamesAchievementId })
  } catch (err) {
    console.warn('Failed to report Play Games achievement unlock.', err)
  }
}

export async function submitLifetimeEarningsScore(value: number): Promise<void> {
  if (!isAndroidNative()) return
  try {
    await PlayGames.submitScore({ leaderboardId: LIFETIME_EARNINGS_LEADERBOARD_ID, score: Math.round(value) })
  } catch (err) {
    console.warn('Failed to submit Play Games leaderboard score.', err)
  }
}

export async function showAchievementsUI(): Promise<void> {
  if (!isAndroidNative()) return
  try {
    await PlayGames.showAchievementsUI()
  } catch (err) {
    console.warn('Failed to show Play Games achievements UI.', err)
  }
}

export async function showLeaderboardUI(): Promise<void> {
  if (!isAndroidNative()) return
  try {
    await PlayGames.showLeaderboardUI({ leaderboardId: LIFETIME_EARNINGS_LEADERBOARD_ID })
  } catch (err) {
    console.warn('Failed to show Play Games leaderboard UI.', err)
  }
}
