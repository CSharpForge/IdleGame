export const ROOM_WIDTH = 2.2
export const ROOM_DEPTH = 2.2
export const ROOM_HEIGHT = 1.7
export const FLOOR_HEIGHT = 2.0
export const SLOTS_PER_FLOOR = 4
export const CORRIDOR_Z = 0
// Rooms recede AWAY from the camera (-Z) so the corridor/lobby side, where
// guests are visible walking, faces the viewer instead of being hidden
// behind the building.
export const ROOM_Z = -ROOM_DEPTH
export const ELEVATOR_X = -((SLOTS_PER_FLOOR - 1) / 2) * ROOM_WIDTH - ROOM_WIDTH
export const LOBBY_Z = CORRIDOR_Z + 3.5

type Vec3 = [number, number, number]

export function slotX(slotIndex: number): number {
  return (slotIndex - (SLOTS_PER_FLOOR - 1) / 2) * ROOM_WIDTH
}

export function floorBaseY(floorIndex: number): number {
  return floorIndex * FLOOR_HEIGHT
}

export function roomCenterPosition(floorIndex: number, slotIndex: number): Vec3 {
  return [slotX(slotIndex), floorBaseY(floorIndex) + ROOM_HEIGHT / 2, ROOM_Z]
}

export function roomDoorPosition(floorIndex: number, slotIndex: number): Vec3 {
  return [slotX(slotIndex), floorBaseY(floorIndex), CORRIDOR_Z]
}

export function elevatorPosition(floorIndex: number): Vec3 {
  return [ELEVATOR_X, floorBaseY(floorIndex), CORRIDOR_Z]
}

export function lobbyPosition(): Vec3 {
  return [ELEVATOR_X, 0, LOBBY_Z]
}

const SLAB_FRONT_MARGIN = 0.9
const SLAB_BACK_MARGIN = 0.3

export function floorSlabPosition(floorIndex: number): Vec3 {
  const backEdge = ROOM_Z - ROOM_DEPTH / 2 - SLAB_BACK_MARGIN
  const frontEdge = CORRIDOR_Z + SLAB_FRONT_MARGIN
  return [0, floorBaseY(floorIndex) - 0.1, (backEdge + frontEdge) / 2]
}

export function floorSlabSize(): [number, number] {
  const backEdge = ROOM_Z - ROOM_DEPTH / 2 - SLAB_BACK_MARGIN
  const frontEdge = CORRIDOR_Z + SLAB_FRONT_MARGIN
  return [SLOTS_PER_FLOOR * ROOM_WIDTH + 1, frontEdge - backEdge]
}
