import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Outline, Selection } from '@react-three/postprocessing'
import { Building } from './hotel/Building'
import { GuestSimulation } from './guests/GuestSimulation'

export function Scene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 4]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={['#bcd7ff', '#7fb069', 0.4]} />

      {/* Only Room and GuestAgent wrap their meshes in <Select enabled> (see
          those components) — ghost slots and floor slabs are deliberately
          left out so the outline pass doesn't halo wireframes/flat slabs. */}
      <Selection>
        <Building />
        <GuestSimulation />
        <EffectComposer autoClear={false}>
          <Outline visibleEdgeColor={0x2b2d42} hiddenEdgeColor={0x2b2d42} edgeStrength={3.5} blur />
        </EffectComposer>
      </Selection>

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 2.5, -1]}
      />
    </>
  )
}
