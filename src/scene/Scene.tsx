import { useState } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { EffectComposer, Outline, Selection } from '@react-three/postprocessing'
import { useGameStore } from '../game/state/store'
import { getLocationThemeDef } from '../game/data/locationThemes'
import { Building } from './hotel/Building'
import { GuestSimulation } from './guests/GuestSimulation'
import { orbitControlsRef } from './cameraControls'
import { isSoftwareRenderer } from './materials/rendererCapabilities'

export function Scene() {
  const themeId = useGameStore((s) => s.activeLocation().themeId)
  const theme = getLocationThemeDef(themeId)
  const gl = useThree((state) => state.gl)
  const [outlineSupported] = useState(() => !isSoftwareRenderer(gl))

  return (
    <>
      {/* Explicit sky color — without this the canvas is transparent and
          shows whatever the page background happens to be, which flips to
          black on a dark-mode OS/browser (see index.css color-scheme). Tied
          to the active location's theme so each hotel has its own mood. */}
      <color attach="background" args={[theme.skyColor]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 4]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={[theme.ambientSkyColor, theme.groundColor, 0.4]} />

      {/* Only Room and GuestAgent wrap their meshes in <Select enabled> (see
          those components) — ghost slots and floor slabs are deliberately
          left out so the outline pass doesn't halo wireframes/flat slabs. */}
      <Selection>
        <Building />
        <GuestSimulation />
        {outlineSupported && (
          <EffectComposer autoClear={false}>
            <Outline visibleEdgeColor={0x2b2d42} hiddenEdgeColor={0x2b2d42} edgeStrength={3.5} blur />
          </EffectComposer>
        )}
      </Selection>

      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        minDistance={4}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2.1}
        target={[-0.5, 1.8, -1]}
      />
    </>
  )
}
