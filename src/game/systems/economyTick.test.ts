import { describe, expect, it } from 'vitest'
import { simulateEconomy } from './economyTick'

const baseSnapshot = { roomCounts: { standard: 7 }, satisfaction: 1, receptionistCount: 0 }

describe('simulateEconomy', () => {
  it('earns nothing with no rooms', () => {
    expect(simulateEconomy({ roomCounts: {}, satisfaction: 1, receptionistCount: 0 }, 10).incomeEarned).toBe(0)
  })

  it('earns nothing for zero or negative delta', () => {
    expect(simulateEconomy(baseSnapshot, 0).incomeEarned).toBe(0)
    expect(simulateEconomy(baseSnapshot, -1).incomeEarned).toBe(0)
  })

  it('is linear in delta: N small ticks sum to one big tick', () => {
    const bigTick = simulateEconomy(baseSnapshot, 10).incomeEarned

    let summed = 0
    for (let i = 0; i < 100; i++) {
      summed += simulateEconomy(baseSnapshot, 0.1).incomeEarned
    }

    expect(summed).toBeCloseTo(bigTick, 10)
  })

  it('scales linearly with room count of a single type', () => {
    const oneRoom = simulateEconomy({ ...baseSnapshot, roomCounts: { standard: 1 } }, 5).incomeEarned
    const tenRooms = simulateEconomy({ ...baseSnapshot, roomCounts: { standard: 10 } }, 5).incomeEarned
    expect(tenRooms).toBeCloseTo(oneRoom * 10, 10)
  })

  it('sums income across multiple room types', () => {
    const standardOnly = simulateEconomy({ ...baseSnapshot, roomCounts: { standard: 2 } }, 5).incomeEarned
    const deluxeOnly = simulateEconomy({ ...baseSnapshot, roomCounts: { deluxe: 3 } }, 5).incomeEarned
    const both = simulateEconomy({ ...baseSnapshot, roomCounts: { standard: 2, deluxe: 3 } }, 5).incomeEarned
    expect(both).toBeCloseTo(standardOnly + deluxeOnly, 10)
  })

  it('a higher tier room earns more per unit time than a lower tier', () => {
    const standard = simulateEconomy({ ...baseSnapshot, roomCounts: { standard: 1 } }, 5).incomeEarned
    const deluxe = simulateEconomy({ ...baseSnapshot, roomCounts: { deluxe: 1 } }, 5).incomeEarned
    const suite = simulateEconomy({ ...baseSnapshot, roomCounts: { suite: 1 } }, 5).incomeEarned
    expect(deluxe).toBeGreaterThan(standard)
    expect(suite).toBeGreaterThan(deluxe)
  })

  it('lower satisfaction reduces income, never below the 0.6x floor', () => {
    const fullSatisfaction = simulateEconomy({ ...baseSnapshot, satisfaction: 1 }, 5).incomeEarned
    const zeroSatisfaction = simulateEconomy({ ...baseSnapshot, satisfaction: 0 }, 5).incomeEarned
    expect(zeroSatisfaction).toBeLessThan(fullSatisfaction)
    expect(zeroSatisfaction).toBeCloseTo(fullSatisfaction * 0.6, 10)
  })

  it('receptionists increase income', () => {
    const noStaff = simulateEconomy({ ...baseSnapshot, receptionistCount: 0 }, 5).incomeEarned
    const withStaff = simulateEconomy({ ...baseSnapshot, receptionistCount: 3 }, 5).incomeEarned
    expect(withStaff).toBeGreaterThan(noStaff)
  })

  it('never returns negative or NaN income across a range of inputs', () => {
    for (const rooms of [0, 1, 50, 1000]) {
      for (const delta of [0, 0.01, 1, 3600]) {
        for (const satisfaction of [0, 0.5, 1]) {
          const { incomeEarned } = simulateEconomy(
            { roomCounts: { standard: rooms }, satisfaction, receptionistCount: 2 },
            delta,
          )
          expect(incomeEarned).toBeGreaterThanOrEqual(0)
          expect(Number.isNaN(incomeEarned)).toBe(false)
        }
      }
    }
  })
})
