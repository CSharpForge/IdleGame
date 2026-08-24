import type { RefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

/**
 * A module-level ref bridging the 3D scene (which owns OrbitControls) and
 * the DOM settings UI (which wants a "reset camera" button) — simpler than
 * threading a callback prop through the whole component tree for one
 * one-off action, and avoids a circular React-context dependency between
 * the scene and UI layers.
 */
export const orbitControlsRef: RefObject<OrbitControlsImpl | null> = { current: null }

export function resetCamera() {
  orbitControlsRef.current?.reset()
}
