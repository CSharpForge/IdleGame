export type PrestigeUpgradeId = 'cheaperRooms' | 'headStart' | 'staffSynergy' | 'satisfactionFloor'

export interface PrestigeUpgradeDef {
  id: PrestigeUpgradeId
  label: string
  description: string
  baseCost: number
  costGrowth: number
  effectPerLevel: number
  maxLevel: number
}

export const CHEAPER_ROOMS_DISCOUNT_PER_LEVEL = 0.03
export const HEAD_START_CASH_PER_LEVEL = 50
export const STAFF_SYNERGY_BONUS_PER_LEVEL = 0.05
export const SATISFACTION_FLOOR_BONUS_PER_LEVEL = 0.02

// Costs are in prestige points, not cash — see prestige.ts's
// prestigeRoomCostMultiplier/prestigeHeadStartBonus/etc for how each
// perk's effect is actually applied.
export const PRESTIGE_UPGRADES: PrestigeUpgradeDef[] = [
  {
    id: 'cheaperRooms',
    label: 'Bulk Discounts',
    description: '-3% room cost per level',
    baseCost: 3,
    costGrowth: 1.6,
    effectPerLevel: CHEAPER_ROOMS_DISCOUNT_PER_LEVEL,
    maxLevel: 5,
  },
  {
    id: 'headStart',
    label: 'Head Start',
    description: '+$50 starting cash per level (after prestige)',
    baseCost: 2,
    costGrowth: 1.5,
    effectPerLevel: HEAD_START_CASH_PER_LEVEL,
    maxLevel: 10,
  },
  {
    id: 'staffSynergy',
    label: 'Staff Synergy',
    description: '+5% staff effectiveness per level',
    baseCost: 4,
    costGrowth: 1.7,
    effectPerLevel: STAFF_SYNERGY_BONUS_PER_LEVEL,
    maxLevel: 5,
  },
  {
    id: 'satisfactionFloor',
    label: 'Guest Loyalty',
    description: '+2% satisfaction floor per level',
    baseCost: 5,
    costGrowth: 1.8,
    effectPerLevel: SATISFACTION_FLOOR_BONUS_PER_LEVEL,
    maxLevel: 5,
  },
]

export function getPrestigeUpgradeDef(id: PrestigeUpgradeId): PrestigeUpgradeDef {
  const def = PRESTIGE_UPGRADES.find((u) => u.id === id)
  if (!def) throw new Error(`Unknown prestige upgrade: ${id}`)
  return def
}

export function prestigeUpgradeCost(id: PrestigeUpgradeId, currentLevel: number): number {
  const def = getPrestigeUpgradeDef(id)
  return Math.round(def.baseCost * Math.pow(def.costGrowth, currentLevel))
}

export function isPrestigeUpgradeMaxed(id: PrestigeUpgradeId, currentLevel: number): boolean {
  return currentLevel >= getPrestigeUpgradeDef(id).maxLevel
}
