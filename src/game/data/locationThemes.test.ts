import { describe, expect, it } from 'vitest'
import { LOCATION_THEMES, getLocationThemeDef, isFirstLocationTheme } from './locationThemes'

describe('LOCATION_THEMES', () => {
  it('has unique ids', () => {
    const ids = LOCATION_THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('the first theme is free to start with', () => {
    expect(LOCATION_THEMES[0].unlockCost).toBe(0)
  })

  it('unlock costs strictly increase after the first (free) location', () => {
    for (let i = 2; i < LOCATION_THEMES.length; i++) {
      expect(LOCATION_THEMES[i].unlockCost).toBeGreaterThan(LOCATION_THEMES[i - 1].unlockCost)
    }
  })

  it('includes the newly added themes', () => {
    const ids = LOCATION_THEMES.map((t) => t.id)
    expect(ids).toEqual(expect.arrayContaining(['jungle', 'arctic', 'volcanic']))
  })
})

describe('getLocationThemeDef', () => {
  it('throws for an unknown theme id', () => {
    // @ts-expect-error deliberately invalid id for the test
    expect(() => getLocationThemeDef('space_station')).toThrow()
  })
})

describe('isFirstLocationTheme', () => {
  it('is true only for the very first theme in the list', () => {
    expect(isFirstLocationTheme(LOCATION_THEMES[0].id)).toBe(true)
    expect(isFirstLocationTheme(LOCATION_THEMES[1].id)).toBe(false)
  })
})
