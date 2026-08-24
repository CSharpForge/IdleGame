import { describe, expect, it } from 'vitest'
import { floorCost, getRoomTypeDef, isRoomTypeUnlocked, ROOM_TYPES, roomCost } from './roomTypes'

describe('roomCost', () => {
  for (const def of ROOM_TYPES) {
    describe(def.id, () => {
      it('is monotonically non-decreasing as more of this type are built', () => {
        let previous = -Infinity
        for (let n = 0; n < 200; n++) {
          const cost = roomCost(def.id, n)
          expect(cost).toBeGreaterThanOrEqual(previous)
          previous = cost
        }
      })

      it('is always a positive, finite integer', () => {
        for (const n of [0, 1, 10, 100]) {
          const cost = roomCost(def.id, n)
          expect(cost).toBeGreaterThan(0)
          expect(Number.isInteger(cost)).toBe(true)
          expect(Number.isFinite(cost)).toBe(true)
        }
      })

      it('costs exactly baseCost when none are built yet', () => {
        expect(roomCost(def.id, 0)).toBe(def.baseCost)
      })
    })
  }

  it('throws for an unknown room type id', () => {
    // @ts-expect-error deliberately invalid id for the test
    expect(() => roomCost('penthouse', 0)).toThrow()
  })
})

describe('isRoomTypeUnlocked / unlock thresholds', () => {
  it('standard is unlocked from the very first room', () => {
    expect(isRoomTypeUnlocked('standard', 0)).toBe(true)
  })

  it('higher tiers are locked until enough rooms are built', () => {
    const deluxe = getRoomTypeDef('deluxe')
    expect(isRoomTypeUnlocked('deluxe', deluxe.unlockAtRoomCount - 1)).toBe(false)
    expect(isRoomTypeUnlocked('deluxe', deluxe.unlockAtRoomCount)).toBe(true)
  })

  it('unlock thresholds strictly increase with tier (higher tiers unlock later)', () => {
    const thresholds = ROOM_TYPES.map((t) => t.unlockAtRoomCount)
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1])
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
