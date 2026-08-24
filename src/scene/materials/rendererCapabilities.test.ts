import { describe, expect, it } from 'vitest'
import { isSoftwareRenderer } from './rendererCapabilities'
import type { WebGLRenderer } from 'three'

function fakeRenderer(rendererString: string | null): WebGLRenderer {
  return {
    getContext: () => ({
      getExtension: (name: string) => {
        if (name !== 'WEBGL_debug_renderer_info') return null
        if (rendererString === null) return null
        return { UNMASKED_RENDERER_WEBGL: 'UNMASKED_RENDERER_WEBGL' }
      },
      getParameter: () => rendererString,
    }),
  } as unknown as WebGLRenderer
}

describe('isSoftwareRenderer', () => {
  it('detects common software rasterizer strings', () => {
    expect(isSoftwareRenderer(fakeRenderer('Google SwiftShader'))).toBe(true)
    expect(isSoftwareRenderer(fakeRenderer('llvmpipe (LLVM 15.0.0, 256 bits)'))).toBe(true)
    expect(isSoftwareRenderer(fakeRenderer('Mesa Offscreen'))).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isSoftwareRenderer(fakeRenderer('SWIFTSHADER'))).toBe(true)
  })

  it('returns false for a real GPU renderer string', () => {
    expect(isSoftwareRenderer(fakeRenderer('ANGLE (NVIDIA GeForce RTX 3080 Direct3D11)'))).toBe(false)
    expect(isSoftwareRenderer(fakeRenderer('Adreno (TM) 640'))).toBe(false)
    expect(isSoftwareRenderer(fakeRenderer('Mali-G78'))).toBe(false)
  })

  it('returns false when the debug renderer info extension is unavailable', () => {
    expect(isSoftwareRenderer(fakeRenderer(null))).toBe(false)
  })

  it('never throws even if the renderer/context is malformed', () => {
    const brokenRenderer = { getContext: () => null } as unknown as WebGLRenderer
    expect(() => isSoftwareRenderer(brokenRenderer)).not.toThrow()
    expect(isSoftwareRenderer(brokenRenderer)).toBe(false)
  })
})
