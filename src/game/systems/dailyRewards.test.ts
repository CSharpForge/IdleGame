import { describe, expect, it } from 'vitest'
import { computeLoginStreak, utcDateKey } from './dailyRewards'

const DAY = 24 * 60 * 60 * 1000
// A fixed UTC noon timestamp, well clear of any date-boundary edge case.
const NOW = Date.UTC(2026, 7, 24, 12, 0, 0)

describe('utcDateKey', () => {
  it('formats as YYYY-MM-DD in UTC', () => {
    expect(utcDateKey(NOW)).toBe('2026-08-24')
  })

  it('is stable across different times on the same UTC day', () => {
    expect(utcDateKey(Date.UTC(2026, 7, 24, 0, 0, 1))).toBe(utcDateKey(Date.UTC(2026, 7, 24, 23, 59, 59)))
  })
})

describe('computeLoginStreak', () => {
  it('first-ever login (lastLoginDate null) starts the streak at 1', () => {
    const result = computeLoginStreak(null, 0, NOW)
    expect(result).toEqual({ isNewDay: true, newStreakDay: 1, streakContinued: false })
  })

  it('same UTC day as lastLoginDate is not a new day and leaves the streak unchanged', () => {
    const result = computeLoginStreak(utcDateKey(NOW), 4, NOW)
    expect(result).toEqual({ isNewDay: false, newStreakDay: 4, streakContinued: true })
  })

  it('exactly one day later continues the streak', () => {
    const result = computeLoginStreak(utcDateKey(NOW - DAY), 4, NOW)
    expect(result).toEqual({ isNewDay: true, newStreakDay: 5, streakContinued: true })
  })

  it('missing a day (gap > 1 day) resets the streak to 1', () => {
    const result = computeLoginStreak(utcDateKey(NOW - 3 * DAY), 6, NOW)
    expect(result).toEqual({ isNewDay: true, newStreakDay: 1, streakContinued: false })
  })

  it('is a pure function of its inputs (no hidden dependency on real wall-clock time)', () => {
    const a = computeLoginStreak(utcDateKey(NOW - DAY), 2, NOW)
    const b = computeLoginStreak(utcDateKey(NOW - DAY), 2, NOW)
    expect(a).toEqual(b)
  })
})
