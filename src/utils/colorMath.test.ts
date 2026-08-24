import { describe, expect, it } from 'vitest'
import { clamp01, hexToRgb, lerpColor, rgbToHex } from './colorMath'

describe('clamp01', () => {
  it('clamps below 0 and above 1', () => {
    expect(clamp01(-5)).toBe(0)
    expect(clamp01(5)).toBe(1)
  })

  it('passes through values already in range', () => {
    expect(clamp01(0.42)).toBeCloseTo(0.42)
  })
})

describe('hexToRgb / rgbToHex', () => {
  it('round-trips a color', () => {
    expect(rgbToHex(hexToRgb('#3d5a80'))).toBe('#3d5a80')
  })

  it('parses known values', () => {
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
  })
})

describe('lerpColor', () => {
  it('returns the first color at t=0 and the second at t=1', () => {
    expect(lerpColor('#000000', '#ffffff', 0)).toBe('#000000')
    expect(lerpColor('#000000', '#ffffff', 1)).toBe('#ffffff')
  })

  it('returns the midpoint at t=0.5', () => {
    expect(lerpColor('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('clamps t outside [0,1]', () => {
    expect(lerpColor('#000000', '#ffffff', -1)).toBe('#000000')
    expect(lerpColor('#000000', '#ffffff', 2)).toBe('#ffffff')
  })
})
