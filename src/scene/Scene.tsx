import { useMemo } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { EffectComposer, Outline, Selection } from '@react-three/postprocessing'
import { useGameStore } from '../game/state/store'
import { getLocationThemeDef } from '../game/data/locationThemes'
import { Building } from './hotel/Building'
import { GuestSimulation } from './guests/GuestSimulation'
import { orbitControlsRef } from './cameraControls'
import { getQualityTier } from './materials/rendererCapabilities'
import { QualityTierProvider } from './QualityTierContext'

export function Scene() {
  const themeId = useGameStore((s) => s.activeLocation().themeId)
  const theme = getLocationThemeDef(themeId)
  const gl = useThree((state) => state.gl)
  const qualityOverride = useGameStore((s) => s.qualityOverride)
  // Reactive (not a one-time useState): the renderer's software-vs-hardware
  // nature never changes mid-session, but qualityOverride can, via the
  // Settings quality toggle — so this has to recompute when it changes.
  const tier = useMemo(() => getQualityTier(gl, qualityOverride), [gl, qualityOverride])

  return (
    <QualityTierProvider tier={tier}>
      {/* Explicit sky color — without this the canvas is transparent and
          shows whatever the page background happens to be, which flips to
          black on a dark-mode OS/browser (see index.css color-scheme). Tied
          to the active location's theme so each hotel has its own mood. */}
      <color attach="background" args={[theme.skyColor]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.3}
        castShadow={tier.shadowsEnabled}
        shadow-mapSize={tier.shadowMapSize}
      />
      <hemisphereLight args={[theme.ambientSkyColor, theme.groundColor, 0.4]} />

      {/* Only Room and GuestAgent wrap their meshes in <Select enabled> (see
          those components) — ghost slots and floor slabs are deliberately
          left out so the outline pass doesn't halo wireframes/flat slabs. */}
      <Selection>
        <Building />
        <GuestSimulation />
        {tier.outlineEnabled && (
          <EffectComposer autoClear={false}>
            <Outline visibleEdgeColor={0x2b2d42} hiddenEdgeColor={0x2b2d42} edgeStrength={3.5} blur />
          </EffectComposer>
        )}
      </Selection>

      {/* minDistance/target were tuned on-device for the early-game view
          (see CLAUDE.md's camera-framing note) and don't need to change:
          floorBaseY(0) is always 0 regardless of FLOOR_HEIGHT, so a
          starter (1-2 floor) hotel's geometry is identical either way.
          maxDistance alone is raised so a many-floor building — whose
          floors now sit further apart after M5's clipping fix — can still
          be zoomed out far enough to fit fully in frame. */}
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        minDistance={4}
        maxDistance={34}
        maxPolarAngle={Math.PI / 2.1}
        target={[-0.5, 1.8, -1]}
      />
    </QualityTierProvider>
  )
}
