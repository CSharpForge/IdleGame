import * as THREE from 'three'
import {
  elevatorPosition,
  lobbyPosition,
  roomDoorPosition,
  roomStandingPosition,
} from '../hotel/layout'

const JITTER = 0.35

function jittered(v: [number, number, number], seed: number): THREE.Vector3 {
  const dx = (Math.sin(seed * 12.9898) * 43758.5453 % 1) * JITTER
  const dz = (Math.sin(seed * 78.233) * 43758.5453 % 1) * JITTER
  return new THREE.Vector3(v[0] + dx, v[1], v[2] + dz)
}

/**
 * Guests move along a Catmull-Rom curve through a few fixed waypoints
 * (lobby -> elevator column -> corridor door -> room) rather than a real
 * navmesh: the building's corridor topology is fixed and known, so a
 * curve through hand-placed points already reads as natural movement
 * without pathfinding-library complexity.
 */
export function buildArrivalPath(floorIndex: number, slotIndex: number, seed: number): THREE.CatmullRomCurve3 {
  const lobby = jittered(lobbyPosition(), seed)
  const elevatorGround = jittered(elevatorPosition(0), seed + 1)
  const elevatorFloor = jittered(elevatorPosition(floorIndex), seed + 2)
  const door = jittered(roomDoorPosition(floorIndex, slotIndex), seed + 3)
  const standing = new THREE.Vector3(...roomStandingPosition(floorIndex, slotIndex))

  return new THREE.CatmullRomCurve3([lobby, elevatorGround, elevatorFloor, door, standing])
}

export function buildDeparturePath(floorIndex: number, slotIndex: number, seed: number): THREE.CatmullRomCurve3 {
  const arrival = buildArrivalPath(floorIndex, slotIndex, seed + 100)
  return new THREE.CatmullRomCurve3([...arrival.points].reverse())
}

export function pathLength(curve: THREE.CatmullRomCurve3): number {
  return curve.getLength()
}
