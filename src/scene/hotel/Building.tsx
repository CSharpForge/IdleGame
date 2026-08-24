import { Instance, Instances } from '@react-three/drei'
import { useGameStore } from '../../game/state/store'
import { getLocationThemeDef } from '../../game/data/locationThemes'
import { ROOMS_PER_FLOOR } from '../../game/data/roomTypes'
import { ELEVATOR_X, FLOOR_HEIGHT, floorBaseY, floorSlabPosition, floorSlabSize } from './layout'
import { Floor } from './Floor'
import type { Floor as FloorData } from '../../types/entities'

// A generous fixed cap rather than reactively sizing to floors.length —
// resizing an <Instances> instancedMesh's capacity is more disruptive than
// just over-provisioning a bit, and no real hotel needs more floors than this.
const MAX_INSTANCED_FLOORS = 100

// Floor slabs and the corridor guard-rail are uniform-material, never
// `<Select>`-wrapped (no outline), and never a CashBurst anchor — unlike
// individual Room meshes, they're a safe instancing target. Each floor
// differs only in size/position (wing expansions change slab width), and
// <Instance> supports an arbitrary per-instance scale/position on a single
// shared unit-box geometry, so this renders every floor's slab (and every
// floor's rail) in one draw call each instead of one pair of draw calls
// per floor.
function FloorSlabsAndRails({ floors }: { floors: FloorData[] }) {
  return (
    <>
      <Instances limit={MAX_INSTANCED_FLOORS} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#d9c9a3" />
        {floors.map((floor) => {
          const [slabW, slabD] = floorSlabSize(floor.slotCount)
          const [slabX, slabY, slabZ] = floorSlabPosition(floor.index, floor.slotCount)
          return <Instance key={floor.index} position={[slabX, slabY, slabZ]} scale={[slabW, 0.2, slabD]} />
        })}
      </Instances>
      <Instances limit={MAX_INSTANCED_FLOORS} receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#c2b28f" />
        {floors.map((floor) => {
          const [slabW] = floorSlabSize(floor.slotCount)
          const [slabX] = floorSlabPosition(floor.index, floor.slotCount)
          return (
            <Instance
              key={floor.index}
              position={[slabX, floorBaseY(floor.index) + 0.35, 1.15]}
              scale={[slabW, 0.7, 0.08]}
            />
          )
        })}
      </Instances>
    </>
  )
}

function ElevatorCore({ floorCount }: { floorCount: number }) {
  const height = floorCount * FLOOR_HEIGHT + 0.6
  return (
    <group position={[ELEVATOR_X, 0, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, height, 1.4]} />
        <meshStandardMaterial color="#c2b28f" />
      </mesh>
      <mesh position={[0, 1.0, 0.71]}>
        <planeGeometry args={[0.9, 1.8]} />
        <meshStandardMaterial color="#5c4a3a" />
      </mesh>
    </group>
  )
}

export function Building() {
  // Narrow selectors rather than one `s.activeLocation()` call: a mutation
  // to `location.staff` (hiring) has nothing to do with what Building
  // renders, so subscribing to `floors`/`rooms`/`themeId` individually
  // means hiring staff doesn't re-run this component at all. `rooms` still
  // has to be selected (and does still change on every guest occupancy
  // flip) since Room's occupied/vacant visuals flow down through here.
  const themeId = useGameStore((s) => s.activeLocation().themeId)
  const floors = useGameStore((s) => s.activeLocation().floors)
  const rooms = useGameStore((s) => s.activeLocation().rooms)
  const theme = getLocationThemeDef(themeId)

  // The ground plane must cover the widest floor (a floor widened by a
  // "wing" purchase extends only to the right — see layout.ts) so it never
  // shows a gap under an expanded floor's extra rooms.
  const maxSlotCount = Math.max(ROOMS_PER_FLOOR, ...floors.map((f) => f.slotCount))
  const [widestSlabW] = floorSlabSize(maxSlotCount)
  const [widestSlabX] = floorSlabPosition(0, maxSlotCount)

  return (
    <group>
      <mesh position={[widestSlabX, -0.15, -0.5]} receiveShadow>
        <boxGeometry args={[widestSlabW + 4, 0.1, 12]} />
        <meshStandardMaterial color={theme.groundColor} />
      </mesh>
      <ElevatorCore floorCount={floors.length} />
      <FloorSlabsAndRails floors={floors} />
      {floors.map((floor) => (
        <Floor key={floor.index} floor={floor} rooms={rooms} />
      ))}
    </group>
  )
}
