import { describe, expect, it } from 'vitest'
import { getGuestRequestDef, GUEST_REQUESTS, randomGuestRequestDef } from './guestRequestDefs'

describe('GUEST_REQUESTS', () => {
  it('every entry has a positive bonus and window', () => {
    for (const def of GUEST_REQUESTS) {
      expect(def.bonusCash).toBeGreaterThan(0)
      expect(def.windowSeconds).toBeGreaterThan(0)
    }
  })

  it('every id is unique', () => {
    const ids = GUEST_REQUESTS.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getGuestRequestDef', () => {
  it('returns the matching def', () => {
    const first = GUEST_REQUESTS[0]
    expect(getGuestRequestDef(first.id)).toEqual(first)
  })

  it('throws for an unknown id', () => {
    expect(() => getGuestRequestDef('not-a-real-request')).toThrow()
  })
})

describe('randomGuestRequestDef', () => {
  it('always returns a def from the table', () => {
    const ids = new Set(GUEST_REQUESTS.map((r) => r.id))
    for (let i = 0; i < 50; i++) {
      expect(ids.has(randomGuestRequestDef().id)).toBe(true)
    }
  })
})
