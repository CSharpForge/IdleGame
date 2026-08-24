import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AchievementDef } from '../../game/data/achievementDefs'

const reportAchievementUnlock = vi.fn()

vi.mock('./playGamesClient', () => ({
  reportAchievementUnlock,
}))

const { reportAchievementUnlocks } = await import('./achievementReporting')

function makeAchievement(id: string): AchievementDef {
  return { id, label: id, description: id, isUnlocked: () => true }
}

describe('reportAchievementUnlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports one call per achievement id that has a Play Games mapping', () => {
    reportAchievementUnlocks([makeAchievement('first-room'), makeAchievement('five-rooms')])

    expect(reportAchievementUnlock).toHaveBeenCalledTimes(2)
    expect(reportAchievementUnlock).toHaveBeenCalledWith('PLACEHOLDER_first-room')
    expect(reportAchievementUnlock).toHaveBeenCalledWith('PLACEHOLDER_five-rooms')
  })

  it('silently skips an id with no Play Games mapping', () => {
    reportAchievementUnlocks([makeAchievement('not-a-real-achievement-id')])

    expect(reportAchievementUnlock).not.toHaveBeenCalled()
  })

  it('does nothing for an empty list', () => {
    reportAchievementUnlocks([])

    expect(reportAchievementUnlock).not.toHaveBeenCalled()
  })
})
