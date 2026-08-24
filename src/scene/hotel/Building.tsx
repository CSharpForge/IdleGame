import { useGameStore } from '../../game/state/store'
import { getLocationThemeDef } from '../../game/data/locationThemes'
import { ELEVATOR_X, FLOOR_HEIGHT, floorSlabSize } from './layout'
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
  const location = useGameStore((s) => s.activeLocation())
  const [slabW] = floorSlabSize()
  const theme = getLocationThemeDef(location.themeId)

  return (
    <group>
      <mesh position={[0, -0.15, -0.5]} receiveShadow>
        <boxGeometry args={[slabW + 4, 0.1, 12]} />
        <meshStandardMaterial color={theme.groundColor} />
      </mesh>
      <ElevatorCore floorCount={location.floors.length} />
      {location.floors.map((floor) => (
        <Floor key={floor.index} floor={floor} rooms={location.rooms} />
      ))}
    </group>
  )
}
