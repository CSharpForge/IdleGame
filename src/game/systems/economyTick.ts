import type { RoomTypeId } from '../../types/entities'
import { GUEST_SPAWN_CHANCE_PER_SEC, GUEST_STAY_SECONDS, getRoomTypeDef } from '../data/roomTypes'
import { incomeMultiplierFromSatisfaction, receptionistIncomeMultiplier } from './satisfaction'

/** Describes one hotel location's room mix and staffing for a single tick. */
export interface EconomySnapshot {
  roomCounts: Partial<Record<RoomTypeId, number>>
  satisfaction: number
  receptionistCount: number
}

export interface EconomyResult {
  incomeEarned: number
}

// Steady-state occupancy fraction per room (M/M/∞-style approximation): the
// fraction of time a room is expected to be occupied given how often guests
// arrive and how long they stay. Deliberately closed-form (no per-room
// randomness) so this function is linear in deltaSeconds — that's what
// guarantees live ticking and offline catch-up can never diverge: N calls
// with small deltas sum to exactly one call with the total delta.
const STEADY_STATE_OCCUPANCY = Math.min(1, GUEST_SPAWN_CHANCE_PER_SEC * GUEST_STAY_SECONDS)

/**
 * Income for ONE hotel location. Satisfaction/staffing are read once per
 * call and treated as constant over deltaSeconds — including across an
 * offline gap — which is what keeps this closed-form/linear in delta.
 */
export function simulateEconomy(snapshot: EconomySnapshot, deltaSeconds: number): EconomyResult {
  if (deltaSeconds <= 0) {
    return { incomeEarned: 0 }
  }

  let baseIncomePerSec = 0
  for (const [typeId, count] of Object.entries(snapshot.roomCounts) as [RoomTypeId, number][]) {
    if (!count) continue
    baseIncomePerSec += count * getRoomTypeDef(typeId).incomePerSec
  }
  if (baseIncomePerSec <= 0) {
    return { incomeEarned: 0 }
  }

  const satisfactionMultiplier = incomeMultiplierFromSatisfaction(snapshot.satisfaction)
  const staffMultiplier = receptionistIncomeMultiplier(snapshot.receptionistCount)

  const incomeEarned = baseIncomePerSec * STEADY_STATE_OCCUPANCY * satisfactionMultiplier * staffMultiplier * deltaSeconds

  return { incomeEarned }
}

/**
 * All owned hotel locations earn simultaneously (idle-game convention — an
 * empire keeps running, not just the location you're currently viewing).
 * Each location has its own room mix/satisfaction/staff, summed here, then
 * scaled once by empire-wide multipliers (upgrades, prestige, active event).
 * Still linear in deltaSeconds: a sum of linear functions times a constant.
 */
export function simulateEconomyAcrossLocations(
  locationSnapshots: EconomySnapshot[],
  globalIncomeMultiplier: number,
  deltaSeconds: number,
): EconomyResult {
  let total = 0
  for (const snapshot of locationSnapshots) {
    total += simulateEconomy(snapshot, deltaSeconds).incomeEarned
  }
  return { incomeEarned: total * globalIncomeMultiplier }
}
