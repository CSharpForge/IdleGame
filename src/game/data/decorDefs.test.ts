import { describe, expect, it } from 'vitest'
import { getThemeDecor, THEME_DECOR } from './decorDefs'

const HEX_COLOR = /^#[0-9a-f]{6}$/i
const THEME_IDS = ['coastal', 'mountain', 'city', 'desert', 'jungle', 'arctic', 'volcanic'] as const

describe('THEME_DECOR', () => {
  it('has an entry for every location theme', () => {
    for (const id of THEME_IDS) {
      expect(THEME_DECOR[id]).toBeDefined()
    }
  })

  it('every theme has at least one prop', () => {
    for (const id of THEME_IDS) {
      expect(THEME_DECOR[id].length).toBeGreaterThan(0)
    }
  })

  it('every prop has well-formed hex colors', () => {
    for (const id of THEME_IDS) {
      for (const prop of THEME_DECOR[id]) {
        expect(prop.color).toMatch(HEX_COLOR)
        expect(prop.accentColor).toMatch(HEX_COLOR)
      }
    }
  })
})

describe('getThemeDecor', () => {
  it('returns the matching theme set', () => {
    expect(getThemeDecor('desert')).toEqual(THEME_DECOR.desert)
  })
})
