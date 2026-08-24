import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, getNewlyUnlockedAchievements } from './achievementDefs'

const emptySnapshot = { totalRoomsBuilt: 0, totalFloors: 1, totalEarned: 0, staffCount: 0 }

describe('ACHIEVEMENTS', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('nothing is unlocked from a fresh-start snapshot except what fresh-start already satisfies', () => {
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
    const snapshot = { totalRoomsBuilt: 10, totalFloors: 2, totalEarned: 1000, staffCount: 1 }
    const newly = getNewlyUnlockedAchievements(snapshot, [])
    const ids = newly.map((a) => a.id)
    expect(ids).toEqual(
      expect.arrayContaining(['first-room', 'five-rooms', 'ten-rooms', 'second-floor', 'first-staff', 'earn-1000']),
    )
  })

  it('returns nothing once everything achievable has already been recorded', () => {
    const snapshot = { totalRoomsBuilt: 999, totalFloors: 99, totalEarned: 1_000_000, staffCount: 99 }
    const allIds = ACHIEVEMENTS.map((a) => a.id)
    expect(getNewlyUnlockedAchievements(snapshot, allIds)).toEqual([])
  })
})
