import {
  CONCIERGE_SATISFACTION_BONUS_PER_LEVEL,
  MARKETING_BONUS_PER_LEVEL,
  STAFF_TRAINING_BONUS_PER_LEVEL,
} from '../data/upgradeDefs'

export function upgradeIncomeMultiplier(marketingLevel: number, staffTrainingLevel: number): number {
  const marketingFactor = 1 + marketingLevel * MARKETING_BONUS_PER_LEVEL
  const staffTrainingFactor = 1 + staffTrainingLevel * STAFF_TRAINING_BONUS_PER_LEVEL
  return marketingFactor * staffTrainingFactor
}

export function upgradeSatisfactionBonus(conciergeLevel: number): number {
  return conciergeLevel * CONCIERGE_SATISFACTION_BONUS_PER_LEVEL
}
