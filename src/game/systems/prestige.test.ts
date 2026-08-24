import { describe, expect, it } from 'vitest'
import {
  canPrestige,
  MIN_TOTAL_EARNED_TO_PRESTIGE,
  prestigeIncomeMultiplier,
  prestigePointsForTotalEarned,
} from './prestige'

describe('prestigePointsForTotalEarned', () => {
  it('is zero below the minimum threshold', () => {
    expect(prestigePointsForTotalEarned(0)).toBe(0)
    expect(prestigePointsForTotalEarned(MIN_TOTAL_EARNED_TO_PRESTIGE - 1)).toBe(0)
  })

  it('increases monotonically with total earned', () => {
    let previous = -Infinity
    for (const earned of [0, 1_000, 10_000, 50_000, 200_000, 1_000_000]) {
      const points = prestigePointsForTotalEarned(earned)
      expect(points).toBeGreaterThanOrEqual(previous)
      previous = points
    }
  })

  it('never returns a negative or non-integer value', () => {
    for (const earned of [-100, 0, 12345.67, 1e9]) {
      const points = prestigePointsForTotalEarned(earned)
      expect(points).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(points)).toBe(true)
    }
  })
})

describe('canPrestige', () => {
  it('is false below the minimum and true at/above it', () => {
    expect(canPrestige(MIN_TOTAL_EARNED_TO_PRESTIGE - 1)).toBe(false)
    expect(canPrestige(MIN_TOTAL_EARNED_TO_PRESTIGE)).toBe(true)
  })
})

describe('prestigeIncomeMultiplier', () => {
  it('is 1.0x with zero prestige points', () => {
    expect(prestigeIncomeMultiplier(0)).toBe(1)
  })

  it('increases linearly with prestige points', () => {
    expect(prestigeIncomeMultiplier(5)).toBeCloseTo(prestigeIncomeMultiplier(0) + 5 * 0.02, 10)
  })
})
