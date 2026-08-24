export type UpgradeId = 'marketing' | 'staffTraining' | 'concierge'

export interface UpgradeDef {
  id: UpgradeId
  label: string
  description: string
  baseCost: number
  costGrowth: number
  effectPerLevel: number
  maxLevel: number
}

export const MARKETING_BONUS_PER_LEVEL = 0.1
export const STAFF_TRAINING_BONUS_PER_LEVEL = 0.05
export const CONCIERGE_SATISFACTION_BONUS_PER_LEVEL = 0.03

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'marketing',
    label: 'Marketing Campaign',
    description: '+10% income per level',
    baseCost: 500,
    costGrowth: 1.8,
    effectPerLevel: MARKETING_BONUS_PER_LEVEL,
    maxLevel: 10,
  },
  {
    id: 'staffTraining',
    label: 'Staff Training',
    description: '+5% income per level (amplifies staff bonus)',
    baseCost: 800,
    costGrowth: 1.9,
    effectPerLevel: STAFF_TRAINING_BONUS_PER_LEVEL,
    maxLevel: 5,
  },
  {
    id: 'concierge',
    label: 'Concierge Service',
    description: '+3% guest satisfaction per level',
    baseCost: 1200,
    costGrowth: 2.0,
    effectPerLevel: CONCIERGE_SATISFACTION_BONUS_PER_LEVEL,
    maxLevel: 5,
  },
]

export function getUpgradeDef(id: UpgradeId): UpgradeDef {
  const def = UPGRADES.find((u) => u.id === id)
  if (!def) throw new Error(`Unknown upgrade: ${id}`)
  return def
}

export function upgradeCost(id: UpgradeId, currentLevel: number): number {
  const def = getUpgradeDef(id)
  return Math.round(def.baseCost * Math.pow(def.costGrowth, currentLevel))
}

export function isUpgradeMaxed(id: UpgradeId, currentLevel: number): boolean {
  return currentLevel >= getUpgradeDef(id).maxLevel
}
