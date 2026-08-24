import {
  MANAGER_EFFECTIVENESS_BONUS_PER_UNIT,
  MAX_EFFECTIVE_MANAGERS,
  MAX_EFFECTIVE_RECEPTIONISTS,
  RECEPTIONIST_INCOME_BONUS_PER_UNIT,
  ROOMS_COVERED_PER_HOUSEKEEPER,
} from '../data/staffDefs'

const BASELINE_SATISFACTION = 0.5
const MIN_INCOME_MULTIPLIER = 0.6
const MAX_SATISFACTION_BONUS = 0.4

// Threshold for the "five-star streak" achievement (see achievementDefs.ts)
// — high enough that it takes real staffing investment to sustain, not just
// the 0.5 baseline.
export const HIGH_SATISFACTION_THRESHOLD = 0.9

/**
 * Satisfaction is a 0..1 score with a 0.5 floor even at zero housekeeping
 * coverage — an unstaffed hotel should feel suboptimal, not broken.
 * Coverage scales it up toward 1 as housekeepers approach one-per-N-rooms.
 */
export function computeSatisfaction(totalRooms: number, housekeeperCount: number): number {
  if (totalRooms <= 0) return 1
  const coverage = housekeeperCount * ROOMS_COVERED_PER_HOUSEKEEPER
  const coverageRatio = Math.min(1, coverage / totalRooms)
  return BASELINE_SATISFACTION + coverageRatio * (1 - BASELINE_SATISFACTION)
}

export function incomeMultiplierFromSatisfaction(satisfaction: number): number {
  const clamped = Math.max(0, Math.min(1, satisfaction))
  return MIN_INCOME_MULTIPLIER + clamped * MAX_SATISFACTION_BONUS
}

export function receptionistIncomeMultiplier(receptionistCount: number): number {
  const effectiveCount = Math.min(receptionistCount, MAX_EFFECTIVE_RECEPTIONISTS)
  return 1 + effectiveCount * RECEPTIONIST_INCOME_BONUS_PER_UNIT
}

/**
 * Managers don't touch income or satisfaction directly — they scale up how
 * many receptionists/housekeepers a location "effectively" has (see
 * store.ts's buildLocationSnapshots/locationSatisfaction). This keeps the
 * economy tick itself (economyTick.ts) fully agnostic of the manager role:
 * it only ever sees an already-scaled receptionistCount/housekeeperCount,
 * which preserves the closed-form linearity guarantee for free.
 */
export function managerEffectivenessMultiplier(managerCount: number): number {
  const effectiveCount = Math.min(managerCount, MAX_EFFECTIVE_MANAGERS)
  return 1 + effectiveCount * MANAGER_EFFECTIVENESS_BONUS_PER_UNIT
}
