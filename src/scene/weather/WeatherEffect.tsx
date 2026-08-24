import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import type { Object3D } from 'three'
import { useGameStore } from '../../game/state/store'
import { getThemeWeather, type WeatherKind } from '../../game/data/weatherDefs'
import { useQualityTier } from '../qualityTier'
import { mulberry32 } from '../../utils/seededRandom'

interface WeatherVisual {
  color: string
  opacity: number
  scale: [number, number, number]
  fallSpeed: number
  driftSpeed: number
  swayAmplitude: number
}

// Non-uniform scale on a shared unit sphere fakes each kind's silhouette
// (a stretched sphere reads as a raindrop streak, a flattened wide one as a
// sandstorm puff) without needing per-kind geometry.
const WEATHER_VISUALS: Record<Exclude<WeatherKind, 'none'>, WeatherVisual> = {
  rain: { color: '#a8c8e8', opacity: 0.55, scale: [0.03, 0.35, 0.03], fallSpeed: 7, driftSpeed: 0.4, swayAmplitude: 0 },
  snow: { color: '#ffffff', opacity: 0.85, scale: [0.07, 0.07, 0.07], fallSpeed: 1.1, driftSpeed: 0, swayAmplitude: 0.4 },
  sandstorm: { color: '#dcb26b', opacity: 0.3, scale: [0.4, 0.22, 0.4], fallSpeed: 0.15, driftSpeed: 2.6, swayAmplitude: 0.15 },
  ash: { color: '#7a3b3b', opacity: 0.8, scale: [0.05, 0.05, 0.05], fallSpeed: 0.6, driftSpeed: 0.3, swayAmplitude: 0.3 },
}

const X_MIN = -9
const X_MAX = 9
const Y_MIN = 0.5
const Y_MAX = 9
const Z_MIN = -8
const Z_MAX = 5

function WeatherParticle({ visual, seed }: { visual: WeatherVisual; seed: number }) {
  const ref = useRef<Object3D>(null)
  const swayPhase = seed * 12.9898

  // Seeded (not Math.random()) starting position so a re-render doesn't
  // reshuffle every particle's spot mid-flight.
  useEffect(() => {
    const rand = mulberry32(seed)
    ref.current?.position.set(
      X_MIN + rand() * (X_MAX - X_MIN),
      Y_MIN + rand() * (Y_MAX - Y_MIN),
      Z_MIN + rand() * (Z_MAX - Z_MIN),
    )
  }, [seed])

  useFrame((state, delta) => {
    const obj = ref.current
    if (!obj) return
    obj.position.y -= visual.fallSpeed * delta
    obj.position.x += visual.driftSpeed * delta
    if (visual.swayAmplitude > 0) {
      obj.position.x += Math.sin(state.clock.elapsedTime * 2 + swayPhase) * visual.swayAmplitude * delta
    }
    // Wrap on both axes, generically: rain/snow/ash mostly cycle via the Y
    // reset (their drift is small relative to the volume's width), while
    // sandstorm — near-zero fall speed, fast horizontal drift — relies on
    // the X wrap instead. Neither kind needs its own special-cased reset.
    if (obj.position.y < Y_MIN) obj.position.y = Y_MAX
    if (obj.position.x > X_MAX) obj.position.x = X_MIN
    else if (obj.position.x < X_MIN) obj.position.x = X_MAX
  })

  return <Instance ref={ref} scale={visual.scale} />
}

/**
 * Ambient weather particles, one kind per active location's theme (see
 * weatherDefs.ts) — instanced (shared geometry + material, one draw call)
 * since a full-quality tier renders up to 60 of these continuously, unlike
 * CashBurst's handful of short-lived coins. Deliberately outside
 * <Selection> in Scene.tsx (never outline-picked).
 */
export function WeatherEffect() {
  const themeId = useGameStore((s) => s.activeLocation().themeId)
  const { weatherParticleCount } = useQualityTier()
  const kind = getThemeWeather(themeId)

  if (kind === 'none' || weatherParticleCount === 0) return null
  const visual = WEATHER_VISUALS[kind]

  return (
    <Instances limit={weatherParticleCount}>
      <sphereGeometry args={[1, 5, 4]} />
      <meshBasicMaterial color={visual.color} transparent opacity={visual.opacity} depthWrite={false} />
      {/* Keyed by kind too: switching themes swaps rain-speed particles for
          snow-speed ones, so a fresh reset (new random positions) reads
          better than an old particle continuing mid-flight at the wrong
          speed for its new kind. */}
      {Array.from({ length: weatherParticleCount }, (_, i) => (
        <WeatherParticle key={`${kind}-${i}`} visual={visual} seed={i + 1} />
      ))}
    </Instances>
  )
}
