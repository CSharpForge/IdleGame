import type { RoomTypeId } from '../../types/entities'

export interface RoomTypeDef {
  id: RoomTypeId
  label: string
  baseCost: number
  costGrowth: number
  incomePerSec: number
  color: string
  windowColor: string
  heightScale: number
  unlockAtRoomCount: number
}

export const ROOM_TYPES: RoomTypeDef[] = [
  {
    id: 'standard',
    label: 'Standard Room',
    baseCost: 10,
    costGrowth: 1.15,
    incomePerSec: 0.4,
    color: '#f2a65a',
    windowColor: '#ffe066',
    heightScale: 1,
    unlockAtRoomCount: 0,
  },
  {
    id: 'deluxe',
    label: 'Deluxe Room',
    baseCost: 60,
    costGrowth: 1.17,
    incomePerSec: 1.6,
    color: '#4d908e',
    windowColor: '#90e0ef',
    heightScale: 1.15,
    unlockAtRoomCount: 4,
  },
  {
    id: 'suite',
    label: 'Suite',
    baseCost: 300,
    costGrowth: 1.19,
    incomePerSec: 5.5,
    color: '#9b5de5',
    windowColor: '#f8f9fa',
    heightScale: 1.3,
    unlockAtRoomCount: 12,
  },
]

export function getRoomTypeDef(id: RoomTypeId): RoomTypeDef {
  const def = ROOM_TYPES.find((t) => t.id === id)
  if (!def) throw new Error(`Unknown room type: ${id}`)
  return def
}

export function isRoomTypeUnlocked(id: RoomTypeId, totalRoomsBuilt: number): boolean {
  return totalRoomsBuilt >= getRoomTypeDef(id).unlockAtRoomCount
}

export function roomCost(typeId: RoomTypeId, countOfTypeBuilt: number): number {
  const def = getRoomTypeDef(typeId)
  return Math.round(def.baseCost * Math.pow(def.costGrowth, countOfTypeBuilt))
}

export const FLOOR_BASE_COST = 150
export const FLOOR_COST_GROWTH = 1.6
export const ROOMS_PER_FLOOR = 4

export const GUEST_STAY_SECONDS = 14
export const GUEST_TRAVEL_SPEED = 3.2
export const GUEST_SPAWN_CHANCE_PER_SEC = 0.35

export function floorCost(floorsUnlocked: number): number {
  return Math.round(FLOOR_BASE_COST * Math.pow(FLOOR_COST_GROWTH, floorsUnlocked))
}
