import { useMemo } from 'react'
import { useGameStore } from '../../game/state/store'
import { getThemeDecor, type DecorPropDef } from '../../game/data/decorDefs'
import { ROOMS_PER_FLOOR } from '../../game/data/roomTypes'
import { useToonGradientMap } from '../materials/toonMaterial'
import { useQualityTier } from '../qualityTier'
import { mulberry32 } from '../../utils/seededRandom'
import { floorSlabPosition, floorSlabSize, ROOM_DEPTH, ROOM_Z } from './layout'

// A deep-background band behind the rooms — the one zone whose bounds don't
// depend on the building's current width/floor count (unlike the sides,
// which are too narrow a margin next to the fixed-position elevator core to
// scatter props in without risking overlap), so decor never needs to react
// to wing expansions beyond the ground plane's own width.
const BACKGROUND_Z_MIN = ROOM_Z - ROOM_DEPTH / 2 - 3
const BACKGROUND_Z_MAX = ROOM_Z - ROOM_DEPTH / 2 - 0.3

interface PlacedProp {
  def: DecorPropDef
  x: number
  z: number
  rotationY: number
  scale: number
}

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

function DecorPropMesh({ def, scale }: { def: DecorPropDef; scale: number }) {
  const gradientMap = useToonGradientMap()

  switch (def.type) {
    case 'palmTree':
      return (
        <group scale={scale}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 1.2, 6]} />
            <meshToonMaterial color={def.accentColor} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 1.3, 0]} castShadow>
            <sphereGeometry args={[0.5, 8, 6]} />
            <meshToonMaterial color={def.color} gradientMap={gradientMap} />
          </mesh>
        </group>
      )
    case 'pineTree':
      return (
        <group scale={scale}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.5, 6]} />
            <meshToonMaterial color={def.accentColor} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 0.75, 0]} castShadow>
            <coneGeometry args={[0.45, 0.9, 8]} />
            <meshToonMaterial color={def.color} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 1.25, 0]} castShadow>
            <coneGeometry args={[0.32, 0.7, 8]} />
            <meshToonMaterial color={def.color} gradientMap={gradientMap} />
          </mesh>
        </group>
      )
    case 'rock':
      return (
        <mesh scale={scale} position={[0, 0.25, 0]} castShadow>
          <dodecahedronGeometry args={[0.4, 0]} />
          <meshToonMaterial color={def.color} gradientMap={gradientMap} />
        </mesh>
      )
    case 'cactus':
      return (
        <group scale={scale}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 1, 8]} />
            <meshToonMaterial color={def.color} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0.22, 0.65, 0]} rotation={[0, 0, -0.5]} castShadow>
            <cylinderGeometry args={[0.08, 0.09, 0.4, 6]} />
            <meshToonMaterial color={def.color} gradientMap={gradientMap} />
          </mesh>
        </group>
      )
    case 'lampPost':
      return (
        <group scale={scale}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 1.5, 6]} />
            <meshToonMaterial color={def.color} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color={def.accentColor} emissive={def.accentColor} emissiveIntensity={0.9} />
          </mesh>
        </group>
      )
    case 'bench':
      return (
        <group scale={scale}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.9, 0.08, 0.35]} />
            <meshToonMaterial color={def.color} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 0.5, -0.15]} castShadow>
            <boxGeometry args={[0.9, 0.4, 0.06]} />
            <meshToonMaterial color={def.color} gradientMap={gradientMap} />
          </mesh>
        </group>
      )
    case 'igloo':
      return (
        <mesh scale={scale} position={[0, 0.05, 0]} castShadow>
          <sphereGeometry args={[0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshToonMaterial color={def.color} gradientMap={gradientMap} />
        </mesh>
      )
    case 'obsidianSpike':
      return (
        <mesh scale={scale} position={[0, 0.6, 0]} castShadow>
          <coneGeometry args={[0.22, 1.2, 6]} />
          <meshToonMaterial color={def.color} gradientMap={gradientMap} />
        </mesh>
      )
    case 'fern':
      return (
        <mesh scale={scale} position={[0, 0.2, 0]} castShadow>
          <coneGeometry args={[0.3, 0.4, 6]} />
          <meshToonMaterial color={def.color} gradientMap={gradientMap} />
        </mesh>
      )
    case 'umbrella':
      return (
        <group scale={scale}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
            <meshToonMaterial color={def.accentColor} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 1.2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
            <coneGeometry args={[0.55, 0.35, 10]} />
            <meshToonMaterial color={def.color} gradientMap={gradientMap} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

/**
 * Scattered exterior scenery, deliberately outside <Selection> in Scene.tsx
 * (same treatment as ghost slots/floor slabs — never outline-picked).
 * Positions are seeded off the theme id (mulberry32, not Math.random()) so
 * the layout is stable across re-renders instead of jumping every time
 * this component happens to re-run.
 */
export function Decor() {
  const themeId = useGameStore((s) => s.activeLocation().themeId)
  const floors = useGameStore((s) => s.activeLocation().floors)
  const { maxDecorProps } = useQualityTier()
  const decorSet = useMemo(() => getThemeDecor(themeId), [themeId])

  const maxSlotCount = Math.max(ROOMS_PER_FLOOR, ...floors.map((f) => f.slotCount))
  const [widestSlabW] = floorSlabSize(maxSlotCount)
  const [widestSlabX] = floorSlabPosition(0, maxSlotCount)
  const halfWidth = widestSlabW / 2 + 1.5

  const props = useMemo<PlacedProp[]>(() => {
    const rand = mulberry32(hashSeed(themeId))
    return Array.from({ length: maxDecorProps }, (_, i) => ({
      def: decorSet[i % decorSet.length],
      x: widestSlabX + (rand() * 2 - 1) * halfWidth,
      z: BACKGROUND_Z_MIN + rand() * (BACKGROUND_Z_MAX - BACKGROUND_Z_MIN),
      rotationY: rand() * Math.PI * 2,
      scale: 0.85 + rand() * 0.3,
    }))
  }, [themeId, maxDecorProps, widestSlabX, halfWidth, decorSet])

  return (
    <group>
      {props.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation={[0, p.rotationY, 0]}>
          <DecorPropMesh def={p.def} scale={p.scale} />
        </group>
      ))}
    </group>
  )
}
