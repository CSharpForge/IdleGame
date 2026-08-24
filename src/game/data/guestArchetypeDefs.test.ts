import { describe, expect, it } from 'vitest'
import { getGuestArchetypeDef, GUEST_ARCHETYPES } from './guestArchetypeDefs'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

describe('GUEST_ARCHETYPES', () => {
  it('has more than one entry, so guests actually vary', () => {
    expect(GUEST_ARCHETYPES.length).toBeGreaterThan(1)
  })

  it('every entry has a well-formed hex shirt/skin color and a positive scale', () => {
    for (const def of GUEST_ARCHETYPES) {
      expect(def.shirtColor).toMatch(HEX_COLOR)
      expect(def.skinColor).toMatch(HEX_COLOR)
      expect(def.scale).toBeGreaterThan(0)
    }
  })

  it('every id is unique', () => {
    const ids = GUEST_ARCHETYPES.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getGuestArchetypeDef', () => {
  it('returns the matching def', () => {
    const first = GUEST_ARCHETYPES[0]
    expect(getGuestArchetypeDef(first.id)).toEqual(first)
  })

  it('throws for an unknown id', () => {
    expect(() => getGuestArchetypeDef('not-a-real-archetype')).toThrow()
  })
})
