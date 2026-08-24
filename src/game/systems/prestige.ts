import {
  CHEAPER_ROOMS_DISCOUNT_PER_LEVEL,
  HEAD_START_CASH_PER_LEVEL,
  SATISFACTION_FLOOR_BONUS_PER_LEVEL,
  STAFF_SYNERGY_BONUS_PER_LEVEL,
} from '../data/prestigeUpgradeDefs'

export const PRESTIGE_EARN_DIVISOR = 10_000
export const PRESTIGE_MULTIPLIER_PER_POINT = 0.02
export const MIN_TOTAL_EARNED_TO_PRESTIGE = PRESTIGE_EARN_DIVISOR

/** Prestige points awarded for resetting now, given lifetime earnings this run. */
export function prestigePointsForTotalEarned(totalEarned: number): number {
  if (totalEarned <= 0) return 0
  return Math.floor(Math.sqrt(totalEarned / PRESTIGE_EARN_DIVISOR))
}

export function canPrestige(totalEarned: number): boolean {
  return prestigePointsForTotalEarned(totalEarned) >= 1
}

/** Permanent income multiplier from all prestige points ever earned. */
export function prestigeIncomeMultiplier(totalPrestigePoints: number): number {
  return 1 + totalPrestigePoints * PRESTIGE_MULTIPLIER_PER_POINT
}

// Prestige perk shop (see data/prestigeUpgradeDefs.ts). `prestigePoints`
// itself is never decremented when a perk is bought — it also drives
// prestigeIncomeMultiplier above, so spending it directly would silently
// shrink that permanent multiplier. Perk levels are tracked separately
// (state.prestigeUpgradeLevels in store.ts) and "available balance" is
// derived by the store from prestigePoints minus what's already been spent.

/** Multiplies room cost — a discount, so this is always <= 1. */
export function prestigeRoomCostMultiplier(cheaperRoomsLevel: number): number {
  return 1 - cheaperRoomsLevel * CHEAPER_ROOMS_DISCOUNT_PER_LEVEL
}

/** Extra starting cash granted by the `prestige()` action. */
export function prestigeHeadStartBonus(headStartLevel: number): number {
  return headStartLevel * HEAD_START_CASH_PER_LEVEL
}

/** Multiplies effective receptionist/housekeeper counts. */
export function prestigeStaffEffectivenessBonus(staffSynergyLevel: number): number {
  return 1 + staffSynergyLevel * STAFF_SYNERGY_BONUS_PER_LEVEL
}

/** Added directly to a location's satisfaction score, same as the concierge upgrade. */
export function prestigeSatisfactionFloorBonus(satisfactionFloorLevel: number): number {
  return satisfactionFloorLevel * SATISFACTION_FLOOR_BONUS_PER_LEVEL
}
