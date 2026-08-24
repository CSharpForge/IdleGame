import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, getNewlyUnlockedAchievements } from './achievementDefs'

const emptySnapshot = {
  totalRoomsBuilt: 0,
  totalFloors: 1,
  lifetimeEarned: 0,
  staffCount: 0,
  staffCountByRole: {},
  locationsUnlocked: 1,
  prestigeCount: 0,
  totalUpgradeLevels: 0,
  wingExpansionsTotal: 0,
  eventsExperienced: 0,
  bestSatisfactionStreakSeconds: 0,
  totalPlaytimeSeconds: 0,
}

describe('ACHIEVEMENTS', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('nothing is unlocked from a fresh-start snapshot', () => {
    const unlocked = ACHIEVEMENTS.filter((a) => a.isUnlocked(emptySnapshot))
    expect(unlocked).toEqual([])
  })
})

describe('getNewlyUnlockedAchievements', () => {
  it('returns achievements whose condition is met and not already recorded', () => {
    const snapshot = { ...emptySnapshot, totalRoomsBuilt: 1 }
    const newly = getNewlyUnlockedAchievements(snapshot, [])
    expect(newly.map((a) => a.id)).toContain('first-room')
  })

  it('does not return an achievement already recorded as unlocked', () => {
    const snapshot = { ...emptySnapshot, totalRoomsBuilt: 1 }
    const newly = getNewlyUnlockedAchievements(snapshot, ['first-room'])
    expect(newly.map((a) => a.id)).not.toContain('first-room')
  })

  it('returns multiple newly-met achievements at once', () => {
    const snapshot = {
      totalRoomsBuilt: 10,
      totalFloors: 2,
      lifetimeEarned: 1000,
      staffCount: 1,
      staffCountByRole: { manager: 1 },
      locationsUnlocked: 2,
      prestigeCount: 1,
      totalUpgradeLevels: 1,
      wingExpansionsTotal: 1,
      eventsExperienced: 5,
      bestSatisfactionStreakSeconds: 300,
      totalPlaytimeSeconds: 3600,
    }
    const newly = getNewlyUnlockedAchievements(snapshot, [])
    const ids = newly.map((a) => a.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'first-room',
        'five-rooms',
        'ten-rooms',
        'second-floor',
        'first-staff',
        'earn-1000',
        'first-upgrade',
        'second-location',
        'first-prestige',
        'hire-a-manager',
        'wing-expander',
        'party-goer',
        'five-star-streak',
        'dedicated-owner',
      ]),
    )
  })

  it('unlocks the all-locations achievement only once every location is unlocked', () => {
    expect(getNewlyUnlockedAchievements({ ...emptySnapshot, locationsUnlocked: 3 }, []).map((a) => a.id)).not.toContain(
      'all-locations',
    )
    expect(getNewlyUnlockedAchievements({ ...emptySnapshot, locationsUnlocked: 4 }, []).map((a) => a.id)).toContain(
      'all-locations',
    )
  })

  it('returns nothing once everything achievable has already been recorded', () => {
    const snapshot = {
      totalRoomsBuilt: 999,
      totalFloors: 99,
      lifetimeEarned: 1_000_000,
      staffCount: 99,
      staffCountByRole: { manager: 99 },
      locationsUnlocked: 4,
      prestigeCount: 99,
      totalUpgradeLevels: 99,
      wingExpansionsTotal: 99,
      eventsExperienced: 999,
      bestSatisfactionStreakSeconds: 99_999,
      totalPlaytimeSeconds: 999_999,
    }
    const allIds = ACHIEVEMENTS.map((a) => a.id)
    expect(getNewlyUnlockedAchievements(snapshot, allIds)).toEqual([])
  })
})
