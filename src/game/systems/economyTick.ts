import { GUEST_SPAWN_CHANCE_PER_SEC, GUEST_STAY_SECONDS, ROOM_INCOME_PER_SEC } from '../data/roomTypes'

export interface EconomySnapshot {
  totalRooms: number
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

export function simulateEconomy(snapshot: EconomySnapshot, deltaSeconds: number): EconomyResult {
  if (deltaSeconds <= 0 || snapshot.totalRooms <= 0) {
    return { incomeEarned: 0 }
  }
  const effectiveOccupiedRooms = snapshot.totalRooms * STEADY_STATE_OCCUPANCY
  const incomeEarned = effectiveOccupiedRooms * ROOM_INCOME_PER_SEC * deltaSeconds
  return { incomeEarned }
}
