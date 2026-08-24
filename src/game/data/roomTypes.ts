export const ROOM_BASE_COST = 10
export const ROOM_COST_GROWTH = 1.15
export const ROOM_INCOME_PER_SEC = 0.4

export const FLOOR_BASE_COST = 150
export const FLOOR_COST_GROWTH = 1.6
export const ROOMS_PER_FLOOR = 4

export const GUEST_STAY_SECONDS = 14
export const GUEST_TRAVEL_SPEED = 3.2
export const GUEST_SPAWN_CHANCE_PER_SEC = 0.35

export function roomCost(roomsBuilt: number): number {
  return Math.round(ROOM_BASE_COST * Math.pow(ROOM_COST_GROWTH, roomsBuilt))
}

export function floorCost(floorsUnlocked: number): number {
  return Math.round(FLOOR_BASE_COST * Math.pow(FLOOR_COST_GROWTH, floorsUnlocked))
}
