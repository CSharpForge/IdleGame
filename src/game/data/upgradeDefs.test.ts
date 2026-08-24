import { describe, expect, it } from 'vitest'
import { UPGRADES, isUpgradeMaxed, upgradeCost } from './upgradeDefs'

describe('upgradeCost', () => {
  for (const def of UPGRADES) {
    describe(def.id, () => {
      it('costs exactly baseCost at level 0', () => {
        expect(upgradeCost(def.id, 0)).toBe(def.baseCost)
      })

      it('is monotonically increasing with level', () => {
        let previous = -Infinity
        for (let level = 0; level < def.maxLevel + 2; level++) {
          const cost = upgradeCost(def.id, level)
          expect(cost).toBeGreaterThan(previous)
          previous = cost
        }
      })

      it('is always a positive, finite integer', () => {
        for (const level of [0, 1, def.maxLevel]) {
          const cost = upgradeCost(def.id, level)
          expect(cost).toBeGreaterThan(0)
          expect(Number.isInteger(cost)).toBe(true)
          expect(Number.isFinite(cost)).toBe(true)
        }
      })
    })
  }

  it('throws for an unknown upgrade id', () => {
    // @ts-expect-error deliberately invalid id for the test
    expect(() => upgradeCost('spa', 0)).toThrow()
  })
})

describe('isUpgradeMaxed', () => {
  it('is false below maxLevel and true at/above it', () => {
    const def = UPGRADES[0]
    expect(isUpgradeMaxed(def.id, def.maxLevel - 1)).toBe(false)
    expect(isUpgradeMaxed(def.id, def.maxLevel)).toBe(true)
    expect(isUpgradeMaxed(def.id, def.maxLevel + 1)).toBe(true)
  })
})
