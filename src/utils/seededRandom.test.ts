import { describe, expect, it } from 'vitest'
import { mulberry32 } from './seededRandom'

describe('mulberry32', () => {
  it('is deterministic: the same seed produces the same sequence', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('different seeds produce different sequences', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    expect(a()).not.toBe(b())
  })

  it('always returns a value in [0, 1)', () => {
    const rand = mulberry32(7)
    for (let i = 0; i < 200; i++) {
      const value = rand()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})
