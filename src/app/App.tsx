import { Canvas } from '@react-three/fiber'
import { Scene } from '../scene/Scene'
import { UIOverlay } from '../ui/UIOverlay'
import { useEconomyLoop } from '../game/systems/useEconomyLoop'

export function App() {
  useEconomyLoop()

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [11, 7, 15], fov: 52 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene />
      </Canvas>
      <UIOverlay />
    </div>
  )
}
