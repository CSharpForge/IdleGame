import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Select } from '@react-three/postprocessing'
import { Vector3, type Group } from 'three'
import { GUEST_STAY_SECONDS, GUEST_TRAVEL_SPEED } from '../../game/data/roomTypes'
import { getGuestArchetypeDef } from '../../game/data/guestArchetypeDefs'
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
  const scratchPoint = useRef(new Vector3())
  const setRoomStatus = useGameStore((s) => s.setRoomStatus)
  const gradientMap = useToonGradientMap()
  const archetype = getGuestArchetypeDef(entity.archetypeId)

  useFrame((_, delta) => {
    if (entity.phase === 'arriving' || entity.phase === 'leaving') {
      const advance = GUEST_TRAVEL_SPEED * delta
      entity.pathT = Math.min(1, entity.pathT + advance / Math.max(entity.curveLength, 0.001))
      const point = entity.curve.getPointAt(entity.pathT, scratchPoint.current)
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
        <group scale={archetype.scale}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <capsuleGeometry args={[0.2, 0.44, 4, 8]} />
            <meshToonMaterial color={archetype.shirtColor} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 0.82, 0]} castShadow>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshToonMaterial color={archetype.skinColor} gradientMap={gradientMap} />
          </mesh>
          {archetype.accessory === 'hat' && (
            <mesh position={[0, 0.99, 0]} castShadow>
              <coneGeometry args={[0.13, 0.16, 8]} />
              <meshToonMaterial color="#2b2d42" gradientMap={gradientMap} />
            </mesh>
          )}
          {archetype.accessory === 'backpack' && (
            <mesh position={[0, 0.42, -0.18]} castShadow>
              <boxGeometry args={[0.22, 0.3, 0.12]} />
              <meshToonMaterial color="#5c3a21" gradientMap={gradientMap} />
            </mesh>
          )}
          {archetype.accessory === 'suitcase' && (
            <mesh position={[0.24, 0.16, 0.05]} castShadow>
              <boxGeometry args={[0.16, 0.14, 0.08]} />
              <meshToonMaterial color="#333333" gradientMap={gradientMap} />
            </mesh>
          )}
        </group>
      </Select>
    </group>
  )
}
