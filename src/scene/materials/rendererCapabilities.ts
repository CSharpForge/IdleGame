import type { WebGLRenderer } from 'three'

const SOFTWARE_RENDERER_MARKERS = ['swiftshader', 'llvmpipe', 'software', 'mesa offscreen']

/**
 * Some WebGL contexts fall back to a CPU-side software rasterizer instead of
 * real GPU hardware — seen on an Android emulator whose host had no working
 * GPU passthrough, and known to also happen on some real low-end/older
 * Android devices. On that path, @react-three/postprocessing's Outline
 * effect renders a corrupted, ghosted double-exposure of the whole scene
 * instead of a clean edge highlight (confirmed by disabling it — the
 * artifact disappeared entirely). Skip the outline pass rather than ship a
 * broken-looking effect; the toon-shaded scene still reads fine without it.
 */
export function isSoftwareRenderer(gl: WebGLRenderer): boolean {
  try {
    const context = gl.getContext()
    const debugInfo = context.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) return false
    const renderer = String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)).toLowerCase()
    return SOFTWARE_RENDERER_MARKERS.some((marker) => renderer.includes(marker))
  } catch {
    return false
  }
}

export interface QualityTier {
  shadowsEnabled: boolean
  shadowMapSize: [number, number]
  maxConcurrentGuests: number
  outlineEnabled: boolean
}

const HIGH_QUALITY_TIER: QualityTier = {
  shadowsEnabled: true,
  shadowMapSize: [1024, 1024],
  maxConcurrentGuests: 40,
  outlineEnabled: true,
}

const LOW_QUALITY_TIER: QualityTier = {
  shadowsEnabled: false,
  shadowMapSize: [512, 512],
  maxConcurrentGuests: 15,
  outlineEnabled: false,
}

/**
 * Reuses the same software-renderer signal as isSoftwareRenderer (see above)
 * rather than adding new detection machinery — a software rasterizer is
 * already known to render the Outline effect corrupted, and it's also the
 * one path this project can reach without real GPU passthrough, so it's the
 * natural single condition to scale everything else back on too (shadow
 * resolution, guest cap) rather than paying full quality for pixels that
 * are being rasterized in software anyway.
 */
export function getQualityTier(gl: WebGLRenderer): QualityTier {
  return isSoftwareRenderer(gl) ? LOW_QUALITY_TIER : HIGH_QUALITY_TIER
}
