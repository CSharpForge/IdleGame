import { describe, expect, it } from 'vitest'
import { computeOfflineEarnings } from './offlineEarnings'
import { simulateEconomyAcrossLocations } from './economyTick'

const HOUR = 60 * 60 * 1000
const snapshots = [{ roomCounts: { standard: 10 }, satisfaction: 1, receptionistCount: 0 }]

describe('computeOfflineEarnings', () => {
  it('matches simulateEconomyAcrossLocations for a normal elapsed gap (shared math, no drift)', () => {
    const now = Date.now()
    const lastTick = now - 2 * HOUR
    const result = computeOfflineEarnings(snapshots, 1, lastTick, now)
    const expected = simulateEconomyAcrossLocations(snapshots, 1, 2 * 60 * 60)

    expect(result.elapsedSeconds).toBeCloseTo(2 * 60 * 60, 1)
    expect(result.incomeEarned).toBeCloseTo(expected.incomeEarned, 6)
  })

  it('clamps elapsed time to 24 hours', () => {
    const now = Date.now()
    const lastTick = now - 100 * HOUR
    const result = computeOfflineEarnings(snapshots, 1, lastTick, now)
    expect(result.elapsedSeconds).toBe(24 * 60 * 60)
  })

  it('returns zero for a future or identical timestamp (never negative)', () => {
    const now = Date.now()
    expect(computeOfflineEarnings(snapshots, 1, now, now).elapsedSeconds).toBe(0)
    expect(computeOfflineEarnings(snapshots, 1, now + HOUR, now).elapsedSeconds).toBe(0)
    expect(computeOfflineEarnings(snapshots, 1, now + HOUR, now).incomeEarned).toBe(0)
  })

  it('earns nothing when there are no rooms yet', () => {
    const now = Date.now()
    const result = computeOfflineEarnings([{ roomCounts: {}, satisfaction: 1, receptionistCount: 0 }], 1, now - HOUR, now)
    expect(result.incomeEarned).toBe(0)
  })

  it('applies the global multiplier (upgrades/prestige/event) to offline earnings too', () => {
    const now = Date.now()
    const lastTick = now - HOUR
    const withoutMultiplier = computeOfflineEarnings(snapshots, 1, lastTick, now).incomeEarned
    const withMultiplier = computeOfflineEarnings(snapshots, 2, lastTick, now).incomeEarned
    expect(withMultiplier).toBeCloseTo(withoutMultiplier * 2, 8)
  })
})
