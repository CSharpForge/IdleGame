import { memo, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { LineMaterial, LineSegments2, LineSegmentsGeometry } from 'three-stdlib'
import type { Floor as FloorData, Room as RoomData } from '../../types/entities'
import { ROOM_DEPTH, ROOM_HEIGHT, ROOM_WIDTH, roomCenterPosition } from './layout'
import { Room } from './Room'

// Every ghost slot (an empty, not-yet-bought room slot) is the exact same
// size, so the wireframe outline geometry/material are computed once here
// and shared by every instance — each GhostSlot only creates its own
// LineSegments2 *object* (cheap: just a transform), not its own geometry
// buffer or material. This is a fat-line (Line2) pair, matching drei's
// <Edges> exactly (same three-stdlib classes it uses internally), so the
// visual result is identical — just without recomputing/re-uploading the
// same edge geometry once per ghost slot.
const GHOST_EDGES_GEOMETRY = (() => {
  const box = new THREE.BoxGeometry(ROOM_WIDTH - 0.15, ROOM_HEIGHT, ROOM_DEPTH - 0.15)
  const edges = new THREE.EdgesGeometry(box)
  const geometry = new LineSegmentsGeometry()
  geometry.setPositions(Array.from(edges.attributes.position.array))
  box.dispose()
  edges.dispose()
  return geometry
})()

const GHOST_EDGES_MATERIAL = new LineMaterial({ color: 0x8a8a8a })

function GhostSlot({ floorIndex, slotIndex }: { floorIndex: number; slotIndex: number }) {
  const position = roomCenterPosition(floorIndex, slotIndex)
  const size = useThree((state) => state.size)

  // Fat lines (Line2) render their width relative to `resolution`, in
  // screen pixels — since GHOST_EDGES_MATERIAL is one shared singleton
  // (not per-instance), its resolution needs to be kept in sync with the
  // canvas size from somewhere; doing it here is redundant across ghost
  // slots but idempotent and cheap (just a Vector2 set).
  useEffect(() => {
    GHOST_EDGES_MATERIAL.resolution.set(size.width, size.height)
  }, [size])

  // One Object3D per ghost slot is unavoidable (each needs its own
  // position), but it reuses the shared geometry/material buffers above
  // rather than owning its own copy.
  const line = useMemo(() => {
    const instance = new LineSegments2(GHOST_EDGES_GEOMETRY, GHOST_EDGES_MATERIAL)
    instance.computeLineDistances()
    return instance
  }, [])

  return <primitive object={line} position={position} />
}

function FloorImpl({ floor, rooms }: { floor: FloorData; rooms: Record<string, RoomData> }) {
  const emptySlotIndices = Array.from(
    { length: floor.slotCount - floor.roomIds.length },
    (_, i) => floor.roomIds.length + i,
  )

  return (
    <group>
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
