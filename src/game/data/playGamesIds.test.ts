import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from './achievementDefs'
import { LIFETIME_EARNINGS_LEADERBOARD_ID, PLAY_GAMES_ACHIEVEMENT_IDS } from './playGamesIds'

describe('playGamesIds', () => {
  it('has a non-empty Play Games id for every achievement in ACHIEVEMENTS', () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(PLAY_GAMES_ACHIEVEMENT_IDS[achievement.id], `missing mapping for "${achievement.id}"`).toBeTruthy()
    }
  })

  it('has no stale mappings for achievement ids that no longer exist', () => {
    const validIds = new Set(ACHIEVEMENTS.map((a) => a.id))
    for (const id of Object.keys(PLAY_GAMES_ACHIEVEMENT_IDS)) {
      expect(validIds.has(id), `mapping "${id}" has no matching achievement`).toBe(true)
    }
  })

  it('defines a leaderboard id', () => {
    expect(LIFETIME_EARNINGS_LEADERBOARD_ID).toBeTruthy()
  })
})
