import { memo, useEffect, useState } from 'react'
import { animated } from '@react-spring/three'
import { Select } from '@react-three/postprocessing'
import type { Room as RoomData } from '../../types/entities'
import { getRoomTypeDef } from '../../game/data/roomTypes'
import { ROOM_DEPTH, ROOM_HEIGHT, ROOM_WIDTH, roomCenterPosition } from './layout'
import { useToonGradientMap } from '../materials/toonMaterial'
import { useBuildPopIn } from './buildAnimation'
import { CashBurst } from './CashBurst'

const WINDOW_VACANT = '#2b2d42'
const CASH_BURST_DURATION_MS = 900

function RoomImpl({ room }: { room: RoomData }) {
  const spring = useBuildPopIn(room.builtAt)
  const gradientMap = useToonGradientMap()
  const typeDef = getRoomTypeDef(room.typeId)
  const position = roomCenterPosition(room.floorIndex, room.slotIndex)
  const occupied = room.status === 'occupied'
  const height = ROOM_HEIGHT * typeDef.heightScale

  const [burstId, setBurstId] = useState<number | null>(null)

  // The effect only re-runs when `occupied` actually changes, so this fires
  // exactly once per vacant->occupied transition (never on unrelated
  // re-renders, and not again while it stays occupied). This genuinely is
  // "synchronizing with an external system" (a self-expiring setTimeout
  // driving a transient 3D effect) rather than deriving render output, so
  // it belongs in an effect despite the general set-state-in-effect rule.
  useEffect(() => {
    if (!occupied) return
    const id = Date.now()
    // oxlint-disable-next-line react/set-state-in-effect
    setBurstId(id)
    const timeout = setTimeout(() => setBurstId((current) => (current === id ? null : current)), CASH_BURST_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [occupied])

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
      {burstId !== null && (
        <CashBurst seed={burstId} position={[0, 0.5, (ROOM_DEPTH - 0.15) / 2 + 0.4]} />
      )}
    </animated.group>
  )
}

// Safe with the default reference-equality comparison: Floor only ever
// passes a specific `rooms[id]` entry down, and immer keeps that reference
// stable for any room untouched by the current mutation (see Floor's own
// memo comparator, which relies on the same guarantee).
export const Room = memo(RoomImpl)
