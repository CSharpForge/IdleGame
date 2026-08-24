import type { AchievementDef } from '../../game/data/achievementDefs'
import { PLAY_GAMES_ACHIEVEMENT_IDS } from '../../game/data/playGamesIds'
import { reportAchievementUnlock } from './playGamesClient'

/**
 * The single "also tell Play Games" hook, called from both places that
 * already call getNewlyUnlockedAchievements (the live checkAchievements()
 * closure and rehydration in store.ts) — no duplicated unlock-checking
 * logic, matching this codebase's existing pattern for that function.
 * Fire-and-forget: playGamesClient swallows its own failures.
 */
export function reportAchievementUnlocks(newly: AchievementDef[]): void {
  for (const achievement of newly) {
    const playGamesId = PLAY_GAMES_ACHIEVEMENT_IDS[achievement.id]
    if (playGamesId) void reportAchievementUnlock(playGamesId)
  }
}
