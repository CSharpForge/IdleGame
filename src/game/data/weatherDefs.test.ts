import { describe, expect, it } from 'vitest'
import { getThemeWeather, THEME_WEATHER } from './weatherDefs'

const THEME_IDS = ['coastal', 'mountain', 'city', 'desert', 'jungle', 'arctic', 'volcanic'] as const
const VALID_KINDS = ['none', 'rain', 'snow', 'sandstorm', 'ash']

describe('THEME_WEATHER', () => {
  it('has an explicit entry for every location theme', () => {
    for (const id of THEME_IDS) {
      expect(THEME_WEATHER[id]).toBeDefined()
      expect(VALID_KINDS).toContain(THEME_WEATHER[id])
    }
  })

  it('arctic gets snow and desert gets sandstorm (explicitly requested pairings)', () => {
    expect(THEME_WEATHER.arctic).toBe('snow')
    expect(THEME_WEATHER.desert).toBe('sandstorm')
  })
})

describe('getThemeWeather', () => {
  it('returns the matching weather kind', () => {
    expect(getThemeWeather('volcanic')).toBe(THEME_WEATHER.volcanic)
  })
})
