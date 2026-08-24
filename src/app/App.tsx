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
        camera={{ position: [12, 9, 16], fov: 55 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene />
      </Canvas>
      <UIOverlay />
    </div>
  )
}
