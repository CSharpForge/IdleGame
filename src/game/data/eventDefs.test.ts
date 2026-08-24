import { describe, expect, it } from 'vitest'
import { EVENTS, getEventDef } from './eventDefs'

describe('EVENTS', () => {
  for (const def of EVENTS) {
    describe(def.id, () => {
      it('has a positive, finite duration', () => {
        expect(def.durationSeconds).toBeGreaterThan(0)
        expect(Number.isFinite(def.durationSeconds)).toBe(true)
      })

      it('has a positive, finite effect value', () => {
        expect(def.effect.value).toBeGreaterThan(0)
        expect(Number.isFinite(def.effect.value)).toBe(true)
      })

      it('a roomCostDiscount effect is less than 1 (an actual discount)', () => {
        if (def.effect.type === 'roomCostDiscount') {
          expect(def.effect.value).toBeLessThan(1)
        }
      })
    })
  }

  it('covers more than one effect type (not just incomeMultiplier)', () => {
    const types = new Set(EVENTS.map((e) => e.effect.type))
    expect(types.size).toBeGreaterThan(1)
  })
})

describe('getEventDef', () => {
  it('throws for an unknown event id', () => {
    // @ts-expect-error deliberately invalid id for the test
    expect(() => getEventDef('made_up_event')).toThrow()
  })
})
