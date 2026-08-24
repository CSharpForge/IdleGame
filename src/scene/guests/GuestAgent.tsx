import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Select } from '@react-three/postprocessing'
import type { Group } from 'three'
import { GUEST_STAY_SECONDS, GUEST_TRAVEL_SPEED } from '../../game/data/roomTypes'
import type { GuestRuntime } from '../../game/ecs/world'
import { useGameStore } from '../../game/state/store'
import { useToonGradientMap } from '../materials/toonMaterial'
import { buildDeparturePath, pathLength } from './waypoints'

// This component intentionally mutates `entity` (a miniplex ECS entity, not
// a plain React prop) directly inside useFrame every frame. That's the
// whole point of using an ECS for guests: 60fps position/state updates
// without going through React state and re-rendering the component tree.
// oxlint-disable react/immutability
export function GuestAgent({ entity }: { entity: GuestRuntime }) {
  const groupRef = useRef<Group>(null)
  const setRoomStatus = useGameStore((s) => s.setRoomStatus)
  const gradientMap = useToonGradientMap()

  useFrame((_, delta) => {
    if (entity.phase === 'arriving' || entity.phase === 'leaving') {
      const advance = GUEST_TRAVEL_SPEED * delta
      entity.pathT = Math.min(1, entity.pathT + advance / Math.max(entity.curveLength, 0.001))
      const point = entity.curve.getPointAt(entity.pathT)
      groupRef.current?.position.copy(point)

      if (entity.pathT >= 1) {
        if (entity.phase === 'arriving') {
          entity.phase = 'staying'
          entity.stayTimer = 0
          setRoomStatus(entity.roomId, 'occupied')
        } else {
          entity.phase = 'done'
        }
      }
    } else if (entity.phase === 'staying') {
      entity.stayTimer += delta
      if (entity.stayTimer >= GUEST_STAY_SECONDS) {
        entity.phase = 'leaving'
        entity.pathT = 0
        entity.curve = buildDeparturePath(entity.floorIndex, entity.slotIndex, entity.seed)
        entity.curveLength = pathLength(entity.curve)
        setRoomStatus(entity.roomId, 'vacant')
      }
    }
  })

  if (entity.phase === 'done') return null

  return (
    <group ref={groupRef}>
      <Select enabled>
        <group>
          <mesh position={[0, 0.4, 0]} castShadow>
            <capsuleGeometry args={[0.2, 0.44, 4, 8]} />
            <meshToonMaterial color={entity.color} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 0.82, 0]} castShadow>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshToonMaterial color="#f1c27d" gradientMap={gradientMap} />
          </mesh>
        </group>
      </Select>
    </group>
  )
}
