import { memo } from 'react'
import { Edges } from '@react-three/drei'
import type { Floor as FloorData, Room as RoomData } from '../../types/entities'
import {
  ROOM_DEPTH,
  ROOM_HEIGHT,
  ROOM_WIDTH,
  floorBaseY,
  floorSlabPosition,
  floorSlabSize,
  roomCenterPosition,
} from './layout'
import { Room } from './Room'

function GhostSlot({ floorIndex, slotIndex }: { floorIndex: number; slotIndex: number }) {
  const position = roomCenterPosition(floorIndex, slotIndex)
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[ROOM_WIDTH - 0.15, ROOM_HEIGHT, ROOM_DEPTH - 0.15]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color="#8a8a8a" />
      </mesh>
    </group>
  )
}

function FloorImpl({ floor, rooms }: { floor: FloorData; rooms: Record<string, RoomData> }) {
  const [slabW, slabD] = floorSlabSize(floor.slotCount)
  const [slabX, slabY, slabZ] = floorSlabPosition(floor.index, floor.slotCount)
  const emptySlotIndices = Array.from(
    { length: floor.slotCount - floor.roomIds.length },
    (_, i) => floor.roomIds.length + i,
  )

  return (
    <group>
      <mesh position={[slabX, slabY, slabZ]} receiveShadow>
        <boxGeometry args={[slabW, 0.2, slabD]} />
        <meshStandardMaterial color="#d9c9a3" />
      </mesh>
      <mesh position={[slabX, floorBaseY(floor.index) + 0.35, 1.15]} receiveShadow castShadow>
        <boxGeometry args={[slabW, 0.7, 0.08]} />
        <meshStandardMaterial color="#c2b28f" />
      </mesh>
      {floor.roomIds.map((roomId) => {
        const room = rooms[roomId]
        if (!room) return null
        return <Room key={room.id} room={room} />
      })}
      {emptySlotIndices.map((slotIndex) => (
        <GhostSlot key={`ghost-${floor.index}-${slotIndex}`} floorIndex={floor.index} slotIndex={slotIndex} />
      ))}
    </group>
  )
}

// `rooms` is the *whole location's* room record, so a plain default memo
// comparison (which would compare that whole object by reference) would
// still re-render every floor whenever any room anywhere changes. Immer
// keeps floor objects referentially stable unless that specific floor's own
// roomIds/slotCount changed, and keeps individual `rooms[id]` entries
// stable unless that specific room changed — so comparing `floor` by
// reference, then only this floor's own rooms, correctly scopes
// re-renders to just the floor(s) actually affected by a purchase or a
// guest occupancy flip.
export const Floor = memo(FloorImpl, (prev, next) => {
  if (prev.floor !== next.floor) return false
  return prev.floor.roomIds.every((id) => prev.rooms[id] === next.rooms[id])
})
