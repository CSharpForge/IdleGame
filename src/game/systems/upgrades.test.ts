import { describe, expect, it } from 'vitest'
import { upgradeIncomeMultiplier, upgradeSatisfactionBonus } from './upgrades'

describe('upgradeIncomeMultiplier', () => {
  it('is 1.0x with no upgrades', () => {
    expect(upgradeIncomeMultiplier(0, 0)).toBe(1)
  })

  it('increases with marketing level alone', () => {
    expect(upgradeIncomeMultiplier(1, 0)).toBeGreaterThan(upgradeIncomeMultiplier(0, 0))
  })

  it('increases with staff training level alone', () => {
    expect(upgradeIncomeMultiplier(0, 1)).toBeGreaterThan(upgradeIncomeMultiplier(0, 0))
  })

  it('compounds multiplicatively rather than adding', () => {
    const bothLevel1 = upgradeIncomeMultiplier(1, 1)
    const marketingOnly = upgradeIncomeMultiplier(1, 0)
    const trainingOnly = upgradeIncomeMultiplier(0, 1)
    expect(bothLevel1).toBeCloseTo(marketingOnly * trainingOnly, 10)
  })
})

describe('upgradeSatisfactionBonus', () => {
  it('is zero with no concierge levels', () => {
    expect(upgradeSatisfactionBonus(0)).toBe(0)
  })

  it('increases linearly with concierge level', () => {
    expect(upgradeSatisfactionBonus(2)).toBeCloseTo(upgradeSatisfactionBonus(1) * 2, 10)
  })
})
