import type { RoomTypeId } from '../../types/entities'
import { GUEST_SPAWN_CHANCE_PER_SEC, GUEST_STAY_SECONDS, getRoomTypeDef } from '../data/roomTypes'
import { incomeMultiplierFromSatisfaction, receptionistIncomeMultiplier } from './satisfaction'

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
 * Satisfaction and staffing are read at the moment this is called and
 * treated as constant over deltaSeconds — including across an offline-catch-up
 * gap. That's a deliberate simplification (current staffing retroactively
 * applies to the whole away period) rather than modeling historical staffing
 * changes, and it's what keeps this function closed-form/linear in delta.
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

  const incomeEarned =
    baseIncomePerSec * STEADY_STATE_OCCUPANCY * satisfactionMultiplier * staffMultiplier * deltaSeconds

  return { incomeEarned }
}
