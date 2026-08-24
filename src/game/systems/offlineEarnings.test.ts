import { describe, expect, it } from 'vitest'
import { computeOfflineEarnings } from './offlineEarnings'
import { simulateEconomy } from './economyTick'

const HOUR = 60 * 60 * 1000
const snapshot = { roomCounts: { standard: 10 }, satisfaction: 1, receptionistCount: 0 }

describe('computeOfflineEarnings', () => {
  it('matches simulateEconomy for a normal elapsed gap (shared math, no drift)', () => {
    const now = Date.now()
    const lastTick = now - 2 * HOUR
    const result = computeOfflineEarnings(snapshot, lastTick, now)
    const expected = simulateEconomy(snapshot, 2 * 60 * 60)

    expect(result.elapsedSeconds).toBeCloseTo(2 * 60 * 60, 1)
    expect(result.incomeEarned).toBeCloseTo(expected.incomeEarned, 6)
  })

  it('clamps elapsed time to 24 hours', () => {
    const now = Date.now()
    const lastTick = now - 100 * HOUR
    const result = computeOfflineEarnings(snapshot, lastTick, now)
    expect(result.elapsedSeconds).toBe(24 * 60 * 60)
  })

  it('returns zero for a future or identical timestamp (never negative)', () => {
    const now = Date.now()
    expect(computeOfflineEarnings(snapshot, now, now).elapsedSeconds).toBe(0)
    expect(computeOfflineEarnings(snapshot, now + HOUR, now).elapsedSeconds).toBe(0)
    expect(computeOfflineEarnings(snapshot, now + HOUR, now).incomeEarned).toBe(0)
  })

  it('earns nothing when there are no rooms yet', () => {
    const now = Date.now()
    const result = computeOfflineEarnings({ roomCounts: {}, satisfaction: 1, receptionistCount: 0 }, now - HOUR, now)
    expect(result.incomeEarned).toBe(0)
  })
})
