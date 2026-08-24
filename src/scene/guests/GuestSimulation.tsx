import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { createReactAPI, useEntities } from 'miniplex-react'
import { guestWorld, spawnGuest } from '../../game/ecs/world'
import { useGameStore } from '../../game/state/store'
import { GUEST_SPAWN_CHANCE_PER_SEC } from '../../game/data/roomTypes'
import { useQualityTier } from '../qualityTier'
import { GuestAgent } from './GuestAgent'

const GuestECS = createReactAPI(guestWorld)

function GuestSpawnerAndReaper() {
  const claimCheckAccumulator = useRef(0)
  // A hard ceiling on simultaneous visible guests. Income never depends on
  // literal guest count (see economyTick.ts's closed-form occupancy math),
  // so this only bounds render/outline-pass cost — it doesn't change
  // earnings at all. Scaled down under the low quality tier (see
  // rendererCapabilities.ts) since that's also the one path this project can
  // reach without real GPU passthrough.
  const { maxConcurrentGuests } = useQualityTier()

  useFrame((_, delta) => {
    // Reap guests whose journey/stay finished this frame. `guestWorld` (a
    // miniplex Bucket) ships a reverse-order iterator specifically so it's
    // safe to `remove()` while iterating it directly — no defensive copy
    // needed (and a copy wouldn't even be enough on its own: remove() is a
    // swap-pop, which a plain forward copy doesn't protect against).
    for (const entity of guestWorld) {
      if (entity.phase === 'done') {
        guestWorld.remove(entity)
      }
    }

    // Throttle spawn rolls to ~5/sec instead of every render frame.
    claimCheckAccumulator.current += delta
    if (claimCheckAccumulator.current < 0.2) return
    const stepSeconds = claimCheckAccumulator.current
    claimCheckAccumulator.current = 0

    const liveEntities = guestWorld.entities.filter((e) => e.phase !== 'done')
    if (liveEntities.length >= maxConcurrentGuests) return

    const { floors, rooms } = useGameStore.getState().activeLocation()
    const claimedRoomIds = new Set(liveEntities.map((e) => e.roomId))

    for (const floor of floors) {
      for (const roomId of floor.roomIds) {
        const room = rooms[roomId]
        if (!room || room.status === 'occupied' || claimedRoomIds.has(roomId)) continue
        const chance = GUEST_SPAWN_CHANCE_PER_SEC * stepSeconds
        if (Math.random() < chance) {
          spawnGuest(room.floorIndex, room.slotIndex, room.id)
        }
      }
    }
  })

  return null
}

export function GuestSimulation() {
  const entities = useEntities(guestWorld)
  const activeLocationId = useGameStore((s) => s.activeLocationId)

  // Guests belong to whichever location's grid they were spawned against —
  // clear them on switch rather than letting stale guests from the
  // previous hotel wander through the newly-shown one.
  useEffect(() => {
    for (const entity of guestWorld) {
      guestWorld.remove(entity)
    }
  }, [activeLocationId])

  return (
    <>
      <GuestSpawnerAndReaper />
      <GuestECS.Entities in={entities}>
        {(entity) => <GuestAgent entity={entity} />}
      </GuestECS.Entities>
    </>
  )
}
