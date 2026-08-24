import { useEffect, useMemo, useState } from 'react'
import type { LocationThemeDef } from '../game/data/locationThemes'
import { clamp01, lerpColor } from '../utils/colorMath'

// A full in-game day compresses into 10 real minutes — long enough that the
// transition reads as a smooth cycle rather than a flicker, short enough
// that a normal play session actually sees day turn to night and back.
export const DAY_NIGHT_CYCLE_SECONDS = 600

const NIGHT_SKY_COLOR = '#0a1128'
const NIGHT_GROUND_TINT = '#141824'
// Themes stay recognizably tinted at night rather than going flat black —
// keeps the toon-shaded scene reading fine after dark, matching the same
// "still reads fine" bar the Outline-disable fallback already holds to.
const NIGHT_BLEND_STRENGTH = 0.8

const SUNRISE_LIGHT_COLOR = '#ffb26b'
const DAY_LIGHT_COLOR = '#fff4e0'
const NIGHT_LIGHT_COLOR = '#3a4a6b'

const DAY_AMBIENT_INTENSITY = 0.7
const NIGHT_AMBIENT_INTENSITY = 0.22
const DAY_DIRECTIONAL_INTENSITY = 1.3
// Never fully zero — a dim floor keeps the toon gradient map's primary
// light direction meaningful instead of the scene going flat at night.
const NIGHT_DIRECTIONAL_INTENSITY = 0.15
const DAY_HEMISPHERE_INTENSITY = 0.4
const NIGHT_HEMISPHERE_INTENSITY = 0.15

export interface DayNightLighting {
  skyColor: string
  groundColor: string
  ambientSkyColor: string
  directionalColor: string
  directionalIntensity: number
  ambientIntensity: number
  hemisphereIntensity: number
  /** -1 at midnight, +1 at midday — exposed for anything else that wants to key off time of day. */
  sunHeight: number
}

/**
 * Pure function of wall-clock time, same discipline as the rest of the
 * codebase's time-of-day math (satisfaction streaks, timed events): -1 at
 * midnight, 0 at sunrise/sunset, +1 at midday.
 */
export function getSunHeight(now: number, cycleSeconds: number = DAY_NIGHT_CYCLE_SECONDS): number {
  const cycleMs = cycleSeconds * 1000
  const phase = ((now % cycleMs) + cycleMs) % cycleMs / cycleMs
  return -Math.cos(phase * Math.PI * 2)
}

/**
 * Pure function of (now, theme) — no live state reads — so it's trivially
 * testable and can be called independently from Scene.tsx (sky/lights) and
 * Building.tsx (ground plane) without needing a shared context; both derive
 * from the same wall-clock time, so they stay in sync within the interval
 * granularity either caller polls at.
 */
export function getDayNightLighting(now: number, theme: LocationThemeDef): DayNightLighting {
  const sunHeight = getSunHeight(now)
  const dayFactor = clamp01((sunHeight + 1) / 2)
  const nightAmount = 1 - dayFactor
  const nightBlend = nightAmount * NIGHT_BLEND_STRENGTH

  const directionalColor =
    sunHeight >= 0
      ? lerpColor(SUNRISE_LIGHT_COLOR, DAY_LIGHT_COLOR, sunHeight)
      : lerpColor(SUNRISE_LIGHT_COLOR, NIGHT_LIGHT_COLOR, -sunHeight)

  return {
    skyColor: lerpColor(theme.skyColor, NIGHT_SKY_COLOR, nightBlend),
    groundColor: lerpColor(theme.groundColor, NIGHT_GROUND_TINT, nightBlend),
    ambientSkyColor: lerpColor(theme.ambientSkyColor, NIGHT_SKY_COLOR, nightBlend),
    directionalColor,
    directionalIntensity: NIGHT_DIRECTIONAL_INTENSITY + (DAY_DIRECTIONAL_INTENSITY - NIGHT_DIRECTIONAL_INTENSITY) * dayFactor,
    ambientIntensity: NIGHT_AMBIENT_INTENSITY + (DAY_AMBIENT_INTENSITY - NIGHT_AMBIENT_INTENSITY) * dayFactor,
    hemisphereIntensity: NIGHT_HEMISPHERE_INTENSITY + (DAY_HEMISPHERE_INTENSITY - NIGHT_HEMISPHERE_INTENSITY) * dayFactor,
    sunHeight,
  }
}

const POLL_INTERVAL_MS = 5000

/**
 * React-side wrapper around getDayNightLighting: polls Date.now() every 5s
 * (matching EventBanner's existing countdown-polling pattern) rather than
 * updating every frame — a 10-minute cycle doesn't need per-frame precision,
 * and driving it through React state (not a ref) is fine here since it only
 * touches JSX props (light intensity/color, sky/ground material color), not
 * a 60fps transform.
 */
export function useDayNightLighting(theme: LocationThemeDef): DayNightLighting {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => getDayNightLighting(now, theme), [now, theme])
}
