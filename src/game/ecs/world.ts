import { World } from 'miniplex'
import type { CatmullRomCurve3 } from 'three'
import type { GuestEntity } from '../../types/entities'
import { buildArrivalPath, pathLength } from '../../scene/guests/waypoints'
import { GUEST_ARCHETYPES } from '../data/guestArchetypeDefs'

export interface GuestRuntime extends GuestEntity {
  curve: CatmullRomCurve3
  curveLength: number
  seed: number
}

export const guestWorld = new World<GuestRuntime>()

let nextGuestId = 0
let nextSeed = 1

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
    archetypeId: GUEST_ARCHETYPES[nextGuestId % GUEST_ARCHETYPES.length].id,
    curve,
    curveLength: pathLength(curve),
    seed: nextSeed,
  })
}
