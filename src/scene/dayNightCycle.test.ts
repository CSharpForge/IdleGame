import { describe, expect, it } from 'vitest'
import { getLocationThemeDef } from '../game/data/locationThemes'
import { DAY_NIGHT_CYCLE_SECONDS, getDayNightLighting, getSunHeight } from './dayNightCycle'

const CYCLE_MS = DAY_NIGHT_CYCLE_SECONDS * 1000
const theme = getLocationThemeDef('coastal')

describe('getSunHeight', () => {
  it('is -1 at the start of the cycle (midnight)', () => {
    expect(getSunHeight(0)).toBeCloseTo(-1)
  })

  it('is +1 at the midpoint of the cycle (midday)', () => {
    expect(getSunHeight(CYCLE_MS / 2)).toBeCloseTo(1)
  })

  it('is ~0 a quarter and three-quarters through (sunrise/sunset)', () => {
    expect(getSunHeight(CYCLE_MS / 4)).toBeCloseTo(0, 5)
    expect(getSunHeight((CYCLE_MS * 3) / 4)).toBeCloseTo(0, 5)
  })

  it('wraps around correctly past one full cycle', () => {
    expect(getSunHeight(CYCLE_MS)).toBeCloseTo(getSunHeight(0))
    expect(getSunHeight(CYCLE_MS * 2.5)).toBeCloseTo(getSunHeight(CYCLE_MS * 0.5))
  })

  it('handles negative timestamps without throwing or going out of [-1,1]', () => {
    const height = getSunHeight(-12345)
    expect(height).toBeGreaterThanOrEqual(-1)
    expect(height).toBeLessThanOrEqual(1)
  })

  it('stays within [-1, 1] across the whole cycle', () => {
    for (let t = 0; t < CYCLE_MS; t += CYCLE_MS / 37) {
      const height = getSunHeight(t)
      expect(height).toBeGreaterThanOrEqual(-1)
      expect(height).toBeLessThanOrEqual(1)
    }
  })
})

describe('getDayNightLighting', () => {
  it('is a pure function: same inputs produce identical output', () => {
    const a = getDayNightLighting(CYCLE_MS * 0.3, theme)
    const b = getDayNightLighting(CYCLE_MS * 0.3, theme)
    expect(a).toEqual(b)
  })

  it('directional/ambient/hemisphere intensity peaks at midday', () => {
    const midday = getDayNightLighting(CYCLE_MS / 2, theme)
    const midnight = getDayNightLighting(0, theme)
    expect(midday.directionalIntensity).toBeGreaterThan(midnight.directionalIntensity)
    expect(midday.ambientIntensity).toBeGreaterThan(midnight.ambientIntensity)
    expect(midday.hemisphereIntensity).toBeGreaterThan(midnight.hemisphereIntensity)
  })

  it('never lets directional intensity hit exactly zero (keeps the toon gradient meaningful)', () => {
    for (let t = 0; t < CYCLE_MS; t += CYCLE_MS / 20) {
      expect(getDayNightLighting(t, theme).directionalIntensity).toBeGreaterThan(0)
    }
  })

  it("sky/ground colors stay close to the theme's own colors at midday", () => {
    const midday = getDayNightLighting(CYCLE_MS / 2, theme)
    expect(midday.skyColor).toBe(theme.skyColor)
    expect(midday.groundColor).toBe(theme.groundColor)
  })

  it('sky/ground colors darken (but do not go pure black) at midnight', () => {
    const midnight = getDayNightLighting(0, theme)
    expect(midnight.skyColor).not.toBe(theme.skyColor)
    expect(midnight.skyColor).not.toBe('#000000')
  })

  it('every location theme produces valid output with no throw', () => {
    const themeIds = ['coastal', 'mountain', 'city', 'desert', 'jungle', 'arctic', 'volcanic'] as const
    for (const id of themeIds) {
      expect(() => getDayNightLighting(CYCLE_MS * 0.2, getLocationThemeDef(id))).not.toThrow()
    }
  })
})
