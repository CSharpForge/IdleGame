import { World } from 'miniplex'
import type { CatmullRomCurve3 } from 'three'
import type { GuestEntity } from '../../types/entities'
import { buildArrivalPath, pathLength } from '../../scene/guests/waypoints'

export interface GuestRuntime extends GuestEntity {
  curve: CatmullRomCurve3
  curveLength: number
  seed: number
}

export const guestWorld = new World<GuestRuntime>()

let nextGuestId = 0
let nextSeed = 1

const GUEST_COLORS = ['#e07a5f', '#3d5a80', '#81b29a', '#f2cc8f', '#9b5de5', '#5e60ce']

export function spawnGuest(floorIndex: number, slotIndex: number, roomId: string): GuestRuntime {
  nextGuestId += 1
  nextSeed += 1
  const curve = buildArrivalPath(floorIndex, slotIndex, nextSeed)
  return guestWorld.add({
    id: `guest-${nextGuestId}`,
    phase: 'arriving',
    roomId,
    floorIndex,
    slotIndex,
    pathT: 0,
    stayTimer: 0,
    color: GUEST_COLORS[nextGuestId % GUEST_COLORS.length],
    curve,
    curveLength: pathLength(curve),
    seed: nextSeed,
  })
}
