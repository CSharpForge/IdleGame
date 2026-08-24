import { animated } from '@react-spring/three'
import { Select } from '@react-three/postprocessing'
import type { Room as RoomData } from '../../types/entities'
import { getRoomTypeDef } from '../../game/data/roomTypes'
import { ROOM_DEPTH, ROOM_HEIGHT, ROOM_WIDTH, roomCenterPosition } from './layout'
import { useToonGradientMap } from '../materials/toonMaterial'
import { useBuildPopIn } from './buildAnimation'

const WINDOW_VACANT = '#2b2d42'

export function Room({ room }: { room: RoomData }) {
  const spring = useBuildPopIn(room.builtAt)
  const gradientMap = useToonGradientMap()
  const typeDef = getRoomTypeDef(room.typeId)
  const position = roomCenterPosition(room.floorIndex, room.slotIndex)
  const occupied = room.status === 'occupied'
  const height = ROOM_HEIGHT * typeDef.heightScale

  return (
    <animated.group position={position} scale={spring.scale}>
      <Select enabled>
        <mesh position={[0, (height - ROOM_HEIGHT) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[ROOM_WIDTH - 0.15, height, ROOM_DEPTH - 0.15]} />
          <meshToonMaterial color={typeDef.color} gradientMap={gradientMap} />
        </mesh>
      </Select>
      <mesh position={[0, 0.1, (ROOM_DEPTH - 0.15) / 2 + 0.01]}>
        <planeGeometry args={[0.7, 0.6]} />
        <meshStandardMaterial
          color={occupied ? typeDef.windowColor : WINDOW_VACANT}
          emissive={occupied ? typeDef.windowColor : '#000000'}
          emissiveIntensity={occupied ? 0.8 : 0}
        />
      </mesh>
    </animated.group>
  )
}
