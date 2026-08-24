import { describe, expect, it } from 'vitest'
import { floorCost, roomCost } from './roomTypes'

describe('roomCost', () => {
  it('is monotonically non-decreasing as more rooms are built', () => {
    let previous = -Infinity
    for (let n = 0; n < 500; n++) {
      const cost = roomCost(n)
      expect(cost).toBeGreaterThanOrEqual(previous)
      previous = cost
    }
  })

  it('is always a positive, finite integer', () => {
    for (const n of [0, 1, 10, 100, 1000]) {
      const cost = roomCost(n)
      expect(cost).toBeGreaterThan(0)
      expect(Number.isInteger(cost)).toBe(true)
      expect(Number.isFinite(cost)).toBe(true)
    }
  })
})

describe('floorCost', () => {
  it('is monotonically non-decreasing as more floors are unlocked', () => {
    let previous = -Infinity
    for (let n = 0; n < 100; n++) {
      const cost = floorCost(n)
      expect(cost).toBeGreaterThanOrEqual(previous)
      previous = cost
    }
  })

  it('is always a positive, finite integer', () => {
    for (const n of [0, 1, 5, 20]) {
      const cost = floorCost(n)
      expect(cost).toBeGreaterThan(0)
      expect(Number.isInteger(cost)).toBe(true)
      expect(Number.isFinite(cost)).toBe(true)
    }
  })
})
