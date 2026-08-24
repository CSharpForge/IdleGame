import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, MeshBasicMaterial } from 'three'

const COIN_COUNT = 5
const RISE_HEIGHT = 1.1
const DURATION_SECONDS = 0.9

function randomOffsets(seed: number) {
  return Array.from({ length: COIN_COUNT }, (_, i) => {
    const angle = (i / COIN_COUNT) * Math.PI * 2 + seed
    return {
      x: Math.cos(angle) * 0.3,
      z: Math.sin(angle) * 0.3,
      delaySeconds: i * 0.04,
    }
  })
}

function Coin({ x, z, delaySeconds }: { x: number; z: number; delaySeconds: number }) {
  const meshRef = useRef<Mesh>(null)
  const elapsed = useRef(0)

  // Driven imperatively via refs each frame (same pattern as GuestAgent.tsx)
  // rather than @react-spring/three, which doesn't reliably interpolate
  // mixed static/animated dash-notation position props for a short one-shot
  // effect like this.
  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    elapsed.current += delta

    if (elapsed.current < delaySeconds) {
      mesh.visible = false
      return
    }
    mesh.visible = true

    const t = Math.min(1, (elapsed.current - delaySeconds) / DURATION_SECONDS)
    mesh.position.y = t * RISE_HEIGHT
    const scale = 0.3 + t * 0.7
    mesh.scale.setScalar(scale)
    ;(mesh.material as MeshBasicMaterial).opacity = 1 - t
  })

  return (
    <mesh ref={meshRef} position={[x, 0, z]} visible={false}>
      <circleGeometry args={[0.14, 8]} />
      <meshBasicMaterial color="#ffd700" transparent opacity={1} depthWrite={false} />
    </mesh>
  )
}

/** A short-lived golden coin burst — the visual "cha-ching" when a guest checks in and starts paying. */
export function CashBurst({ seed = 0, position }: { seed?: number; position: [number, number, number] }) {
  const coins = useMemo(() => randomOffsets(seed), [seed])

  return (
    <group position={position}>
      {coins.map((c, i) => (
        <Coin key={i} x={c.x} z={c.z} delaySeconds={c.delaySeconds} />
      ))}
    </group>
  )
}
