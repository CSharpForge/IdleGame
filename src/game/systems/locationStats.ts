import type { HotelLocation, Room, StaffMember, StaffRole, RoomTypeId } from '../../types/entities'
import type { AchievementSnapshot } from '../data/achievementDefs'
import { timesFloorExpanded } from '../data/roomTypes'
import type { EconomySnapshot } from './economyTick'
import { eventSatisfactionBonus, type ActiveEvent } from './events'
import { prestigeSatisfactionFloorBonus, prestigeStaffEffectivenessBonus } from './prestige'
import { computeSatisfaction, managerEffectivenessMultiplier } from './satisfaction'
import { upgradeSatisfactionBonus } from './upgrades'

/**
 * The subset of persisted game fields these pure derivations need. Both the
 * live `GameState` (store.ts) and a rehydrated `PersistedState` (saveLoad.ts)
 * satisfy this shape structurally, so these functions work identically
 * whether driven by the live store or a save blob being evaluated offline
 * (rehydration, cloud-save conflict resolution).
 */
export interface StatsSourceState {
  locations: Record<string, HotelLocation>
  upgradeLevels: { marketing: number; staffTraining: number; concierge: number }
  prestigeUpgradeLevels: { cheaperRooms: number; headStart: number; staffSynergy: number; satisfactionFloor: number }
  lifetimeEarned: number
  prestigeCount: number
  eventsExperienced: number
  bestSatisfactionStreakSeconds: number
  totalPlaytimeSeconds: number
  requestsFulfilledTotal: number
  longestLoginStreakDays: number
}

export function countByType(rooms: Record<string, Room>): Partial<Record<RoomTypeId, number>> {
  const counts: Partial<Record<RoomTypeId, number>> = {}
  for (const room of Object.values(rooms)) {
    counts[room.typeId] = (counts[room.typeId] ?? 0) + 1
  }
  return counts
}

export function countByRole(staff: Record<string, StaffMember>, role: StaffRole): number {
  let count = 0
  for (const member of Object.values(staff)) {
    if (member.role === role) count++
  }
  return count
}

export function locationSatisfaction(
  location: HotelLocation,
  conciergeBonus: number,
  staffSynergyBonus: number,
  satisfactionFloorBonus: number,
  eventBonus: number,
): number {
  const totalRooms = Object.keys(location.rooms).length
  const managerBoost = managerEffectivenessMultiplier(countByRole(location.staff, 'manager'))
  const effectiveHousekeepers = countByRole(location.staff, 'housekeeper') * managerBoost * staffSynergyBonus
  const base = computeSatisfaction(totalRooms, effectiveHousekeepers)
  return Math.min(1, base + conciergeBonus + satisfactionFloorBonus + eventBonus)
}

export function buildLocationSnapshots(
  state: StatsSourceState,
  activeEvent: ActiveEvent | null,
  now: number,
): EconomySnapshot[] {
  const conciergeBonus = upgradeSatisfactionBonus(state.upgradeLevels.concierge)
  const staffSynergyBonus = prestigeStaffEffectivenessBonus(state.prestigeUpgradeLevels.staffSynergy)
  const satisfactionFloorBonus = prestigeSatisfactionFloorBonus(state.prestigeUpgradeLevels.satisfactionFloor)
  const eventBonus = eventSatisfactionBonus(activeEvent, now)
  return Object.values(state.locations).map((location) => {
    const managerBoost = managerEffectivenessMultiplier(countByRole(location.staff, 'manager'))
    return {
      roomCounts: countByType(location.rooms),
      satisfaction: locationSatisfaction(
        location,
        conciergeBonus,
        staffSynergyBonus,
        satisfactionFloorBonus,
        eventBonus,
      ),
      receptionistCount: countByRole(location.staff, 'receptionist') * managerBoost * staffSynergyBonus,
    }
  })
}

export function buildAchievementSnapshot(state: StatsSourceState): AchievementSnapshot {
  const totalUpgradeLevels = Object.values(state.upgradeLevels).reduce((a, b) => a + b, 0)
  const staffCountByRole: Partial<Record<StaffRole, number>> = {}
  let totalStaff = 0
  let totalFloors = 0
  let wingExpansionsTotal = 0
  let totalRoomsBuilt = 0
  for (const location of Object.values(state.locations)) {
    totalRoomsBuilt += Object.keys(location.rooms).length
    totalFloors += location.floors.length
    for (const floor of location.floors) {
      wingExpansionsTotal += timesFloorExpanded(floor.slotCount)
    }
    for (const member of Object.values(location.staff)) {
      totalStaff += 1
      staffCountByRole[member.role] = (staffCountByRole[member.role] ?? 0) + 1
    }
  }

  return {
    totalRoomsBuilt,
    totalFloors,
    lifetimeEarned: state.lifetimeEarned,
    staffCount: totalStaff,
    staffCountByRole,
    locationsUnlocked: Object.keys(state.locations).length,
    prestigeCount: state.prestigeCount,
    totalUpgradeLevels,
    wingExpansionsTotal,
    eventsExperienced: state.eventsExperienced,
    bestSatisfactionStreakSeconds: state.bestSatisfactionStreakSeconds,
    totalPlaytimeSeconds: state.totalPlaytimeSeconds,
    requestsFulfilledTotal: state.requestsFulfilledTotal,
    longestLoginStreakDays: state.longestLoginStreakDays,
  }
}
