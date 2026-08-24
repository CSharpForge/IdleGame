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
