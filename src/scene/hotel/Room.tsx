import { animated } from '@react-spring/three'
import { Select } from '@react-three/postprocessing'
import type { Room as RoomData } from '../../types/entities'
import { ROOM_DEPTH, ROOM_HEIGHT, ROOM_WIDTH, roomCenterPosition } from './layout'
import { useToonGradientMap } from '../materials/toonMaterial'
import { useBuildPopIn } from './buildAnimation'

const BODY_COLOR = '#f2a65a'
const WINDOW_VACANT = '#2b2d42'
const WINDOW_OCCUPIED = '#ffe066'

export function Room({ room }: { room: RoomData }) {
  const spring = useBuildPopIn(room.builtAt)
  const gradientMap = useToonGradientMap()
  const position = roomCenterPosition(room.floorIndex, room.slotIndex)
  const occupied = room.status === 'occupied'

  return (
    <animated.group position={position} scale={spring.scale}>
      <Select enabled>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[ROOM_WIDTH - 0.15, ROOM_HEIGHT, ROOM_DEPTH - 0.15]} />
          <meshToonMaterial color={BODY_COLOR} gradientMap={gradientMap} />
        </mesh>
      </Select>
      <mesh position={[0, 0.1, (ROOM_DEPTH - 0.15) / 2 + 0.01]}>
        <planeGeometry args={[0.7, 0.6]} />
        <meshStandardMaterial
          color={occupied ? WINDOW_OCCUPIED : WINDOW_VACANT}
          emissive={occupied ? WINDOW_OCCUPIED : '#000000'}
          emissiveIntensity={occupied ? 0.8 : 0}
        />
      </mesh>
    </animated.group>
  )
}
