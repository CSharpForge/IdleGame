import { useGameStore } from '../../game/state/store'
import { getLocationThemeDef } from '../../game/data/locationThemes'
import { ROOMS_PER_FLOOR } from '../../game/data/roomTypes'
import { ELEVATOR_X, FLOOR_HEIGHT, floorSlabPosition, floorSlabSize } from './layout'
import { Floor } from './Floor'

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
      {floors.map((floor) => (
        <Floor key={floor.index} floor={floor} rooms={rooms} />
      ))}
    </group>
  )
}
