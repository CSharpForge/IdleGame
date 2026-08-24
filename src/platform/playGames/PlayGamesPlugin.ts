import { registerPlugin } from '@capacitor/core'

/**
 * Bridge to the native `PlayGamesPlugin.java` (Android-only, see
 * android/app/src/main/java/com/grandstay/tycoon/PlayGamesPlugin.java).
 * Every method is a no-op-returning stub on any platform without the native
 * plugin registered — callers should still gate through playGamesClient.ts
 * rather than calling this directly, so web/non-native behavior stays a
 * deliberate, testable no-op instead of relying on Capacitor's fallback.
 */
export interface PlayGamesPlugin {
  signInSilently(): Promise<{ signedIn: boolean }>
  isSignedIn(): Promise<{ signedIn: boolean }>
  saveSnapshot(options: { snapshotName: string; dataJson: string }): Promise<void>
  loadSnapshot(options: { snapshotName: string }): Promise<{ dataJson: string | null }>
  unlockAchievement(options: { achievementId: string }): Promise<void>
  submitScore(options: { leaderboardId: string; score: number }): Promise<void>
  showAchievementsUI(): Promise<void>
  showLeaderboardUI(options: { leaderboardId: string }): Promise<void>
}

export const PlayGames = registerPlugin<PlayGamesPlugin>('PlayGames')
