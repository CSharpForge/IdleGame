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
