import { describe, expect, it } from 'vitest'
import {
  computeSatisfaction,
  incomeMultiplierFromSatisfaction,
  receptionistIncomeMultiplier,
} from './satisfaction'
import { MAX_EFFECTIVE_RECEPTIONISTS, ROOMS_COVERED_PER_HOUSEKEEPER } from '../data/staffDefs'

describe('computeSatisfaction', () => {
  it('is perfect with no rooms built yet', () => {
    expect(computeSatisfaction(0, 0)).toBe(1)
  })

  it('has a floor of 0.5 with zero housekeepers', () => {
    expect(computeSatisfaction(20, 0)).toBe(0.5)
  })

  it('reaches 1.0 once housekeeper coverage meets or exceeds room count', () => {
    const totalRooms = 9
    const housekeepersNeeded = totalRooms / ROOMS_COVERED_PER_HOUSEKEEPER
    expect(computeSatisfaction(totalRooms, housekeepersNeeded)).toBeCloseTo(1, 10)
  })

  it('never exceeds 1.0 with excess housekeepers', () => {
    expect(computeSatisfaction(4, 100)).toBe(1)
  })

  it('increases monotonically with more housekeepers', () => {
    let previous = -Infinity
    for (let h = 0; h <= 10; h++) {
      const satisfaction = computeSatisfaction(30, h)
      expect(satisfaction).toBeGreaterThanOrEqual(previous)
      previous = satisfaction
    }
  })
})

describe('incomeMultiplierFromSatisfaction', () => {
  it('is 0.6x at zero satisfaction and 1.0x at full satisfaction', () => {
    expect(incomeMultiplierFromSatisfaction(0)).toBeCloseTo(0.6, 10)
    expect(incomeMultiplierFromSatisfaction(1)).toBeCloseTo(1.0, 10)
  })

  it('clamps out-of-range input instead of producing an invalid multiplier', () => {
    expect(incomeMultiplierFromSatisfaction(-5)).toBeCloseTo(0.6, 10)
    expect(incomeMultiplierFromSatisfaction(5)).toBeCloseTo(1.0, 10)
  })
})

describe('receptionistIncomeMultiplier', () => {
  it('is 1.0x with no receptionists', () => {
    expect(receptionistIncomeMultiplier(0)).toBe(1)
  })

  it('increases with each receptionist up to the cap', () => {
    let previous = -Infinity
    for (let n = 0; n <= MAX_EFFECTIVE_RECEPTIONISTS + 5; n++) {
      const multiplier = receptionistIncomeMultiplier(n)
      expect(multiplier).toBeGreaterThanOrEqual(previous)
      previous = multiplier
    }
  })

  it('stops increasing past the diminishing-returns cap', () => {
    const atCap = receptionistIncomeMultiplier(MAX_EFFECTIVE_RECEPTIONISTS)
    const wayOverCap = receptionistIncomeMultiplier(MAX_EFFECTIVE_RECEPTIONISTS + 50)
    expect(wayOverCap).toBe(atCap)
  })
})
