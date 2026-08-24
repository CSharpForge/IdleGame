import { describe, expect, it } from 'vitest'
import { DAILY_REWARDS, dailyRewardForStreakDay } from './dailyRewardDefs'

describe('DAILY_REWARDS', () => {
  it('is monotonically increasing across the cycle', () => {
    let previous = -Infinity
    for (const def of DAILY_REWARDS) {
      expect(def.cashAmount).toBeGreaterThan(previous)
      previous = def.cashAmount
    }
  })

  it('every amount is a positive integer', () => {
    for (const def of DAILY_REWARDS) {
      expect(def.cashAmount).toBeGreaterThan(0)
      expect(Number.isInteger(def.cashAmount)).toBe(true)
    }
  })
})

describe('dailyRewardForStreakDay', () => {
  it('maps day 1 through the cycle length directly', () => {
    for (const def of DAILY_REWARDS) {
      expect(dailyRewardForStreakDay(def.day)).toEqual(def)
    }
  })

  it('wraps a streak day past the cycle length back to the start', () => {
    expect(dailyRewardForStreakDay(DAILY_REWARDS.length + 1)).toEqual(DAILY_REWARDS[0])
    expect(dailyRewardForStreakDay(DAILY_REWARDS.length + 2)).toEqual(DAILY_REWARDS[1])
  })

  it('a very long streak keeps resolving to a valid reward', () => {
    expect(() => dailyRewardForStreakDay(365)).not.toThrow()
  })
})
