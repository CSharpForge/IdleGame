import { describe, expect, it } from 'vitest'
import { PRESTIGE_UPGRADES, isPrestigeUpgradeMaxed, prestigeUpgradeCost } from './prestigeUpgradeDefs'

describe('prestigeUpgradeCost', () => {
  for (const def of PRESTIGE_UPGRADES) {
    describe(def.id, () => {
      it('costs exactly baseCost at level 0', () => {
        expect(prestigeUpgradeCost(def.id, 0)).toBe(def.baseCost)
      })

      it('is monotonically increasing with level', () => {
        let previous = -Infinity
        for (let level = 0; level < def.maxLevel + 2; level++) {
          const cost = prestigeUpgradeCost(def.id, level)
          expect(cost).toBeGreaterThan(previous)
          previous = cost
        }
      })

      it('is always a positive, finite integer', () => {
        for (const level of [0, 1, def.maxLevel]) {
          const cost = prestigeUpgradeCost(def.id, level)
          expect(cost).toBeGreaterThan(0)
          expect(Number.isInteger(cost)).toBe(true)
          expect(Number.isFinite(cost)).toBe(true)
        }
      })
    })
  }

  it('throws for an unknown prestige upgrade id', () => {
    // @ts-expect-error deliberately invalid id for the test
    expect(() => prestigeUpgradeCost('spa', 0)).toThrow()
  })
})

describe('isPrestigeUpgradeMaxed', () => {
  it('is false below maxLevel and true at/above it', () => {
    const def = PRESTIGE_UPGRADES[0]
    expect(isPrestigeUpgradeMaxed(def.id, def.maxLevel - 1)).toBe(false)
    expect(isPrestigeUpgradeMaxed(def.id, def.maxLevel)).toBe(true)
    expect(isPrestigeUpgradeMaxed(def.id, def.maxLevel + 1)).toBe(true)
  })
})
