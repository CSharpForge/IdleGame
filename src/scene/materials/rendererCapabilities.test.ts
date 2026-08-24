import { describe, expect, it } from 'vitest'
import { getQualityTier, isSoftwareRenderer } from './rendererCapabilities'
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

describe('getQualityTier', () => {
  it('returns the low tier for a software renderer', () => {
    const tier = getQualityTier(fakeRenderer('Google SwiftShader'))
    expect(tier.shadowsEnabled).toBe(false)
    expect(tier.outlineEnabled).toBe(false)
    expect(tier.maxConcurrentGuests).toBeLessThan(40)
    expect(tier.shadowMapSize[0]).toBeLessThan(1024)
    expect(tier.maxDecorProps).toBeLessThan(10)
    expect(tier.weatherParticleCount).toBeLessThan(60)
    expect(tier.weatherParticleCount).toBeGreaterThan(0)
  })

  it('returns the high tier for a real GPU renderer', () => {
    const tier = getQualityTier(fakeRenderer('Adreno (TM) 640'))
    expect(tier.shadowsEnabled).toBe(true)
    expect(tier.outlineEnabled).toBe(true)
    expect(tier.maxConcurrentGuests).toBe(40)
    expect(tier.shadowMapSize).toEqual([1024, 1024])
    expect(tier.maxDecorProps).toBe(10)
    expect(tier.weatherParticleCount).toBe(60)
  })

  it('falls back to the high tier when renderer detection is unavailable (fails open, not closed)', () => {
    const tier = getQualityTier(fakeRenderer(null))
    expect(tier.outlineEnabled).toBe(true)
  })

  it('"low" override forces the low tier even on a real GPU renderer', () => {
    const tier = getQualityTier(fakeRenderer('Adreno (TM) 640'), 'low')
    expect(tier.shadowsEnabled).toBe(false)
    expect(tier.outlineEnabled).toBe(false)
    expect(tier.maxConcurrentGuests).toBeLessThan(40)
  })

  it('"high" override restores shadows/guest-cap on a software renderer but NOT the outline', () => {
    const tier = getQualityTier(fakeRenderer('Google SwiftShader'), 'high')
    expect(tier.shadowsEnabled).toBe(true)
    expect(tier.maxConcurrentGuests).toBe(40)
    expect(tier.outlineEnabled).toBe(false)
  })

  it('"high" override on a real GPU renderer matches the plain high tier, outline included', () => {
    const tier = getQualityTier(fakeRenderer('Adreno (TM) 640'), 'high')
    expect(tier.outlineEnabled).toBe(true)
  })

  it('"auto" override is identical to the default (no override argument)', () => {
    expect(getQualityTier(fakeRenderer('Google SwiftShader'), 'auto')).toEqual(getQualityTier(fakeRenderer('Google SwiftShader')))
    expect(getQualityTier(fakeRenderer('Adreno (TM) 640'), 'auto')).toEqual(getQualityTier(fakeRenderer('Adreno (TM) 640')))
  })
})
