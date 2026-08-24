import { describe, expect, it } from 'vitest'
import { STAFF_ROLES, staffCost } from './staffDefs'

describe('staffCost', () => {
  for (const def of STAFF_ROLES) {
    describe(def.id, () => {
      it('is monotonically non-decreasing as more of this role are hired', () => {
        let previous = -Infinity
        for (let n = 0; n < 100; n++) {
          const cost = staffCost(def.id, n)
          expect(cost).toBeGreaterThanOrEqual(previous)
          previous = cost
        }
      })

      it('costs exactly baseCost for the first hire', () => {
        expect(staffCost(def.id, 0)).toBe(def.baseCost)
      })

      it('is always a positive, finite integer', () => {
        for (const n of [0, 1, 5, 20]) {
          const cost = staffCost(def.id, n)
          expect(cost).toBeGreaterThan(0)
          expect(Number.isInteger(cost)).toBe(true)
          expect(Number.isFinite(cost)).toBe(true)
        }
      })
    })
  }

  it('throws for an unknown staff role', () => {
    // @ts-expect-error deliberately invalid role for the test
    expect(() => staffCost('concierge', 0)).toThrow()
  })
})
