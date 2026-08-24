import * as THREE from 'three'

const STEPS = 4

function createGradientTexture(): THREE.DataTexture {
  const data = new Uint8Array(STEPS)
  for (let i = 0; i < STEPS; i++) {
    data[i] = Math.round((i / (STEPS - 1)) * 255)
  }
  const texture = new THREE.DataTexture(data, STEPS, 1, THREE.RedFormat)
  texture.needsUpdate = true
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  return texture
}

const gradientMap = createGradientTexture()

export function useToonGradientMap(): THREE.DataTexture {
  return gradientMap
}
