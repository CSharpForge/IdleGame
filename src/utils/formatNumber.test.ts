import { describe, expect, it } from 'vitest'
import { formatNumber } from './formatNumber'

describe('formatNumber', () => {
  it('formats zero and small integers as-is', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(5)).toBe('5')
    expect(formatNumber(999)).toBe('999')
  })

  it('formats small decimals with one decimal place', () => {
    expect(formatNumber(5.678)).toBe('5.7')
  })

  it('formats thousands with a K suffix', () => {
    expect(formatNumber(1000)).toBe('1.00K')
    expect(formatNumber(1500)).toBe('1.50K')
    expect(formatNumber(25000)).toBe('25.0K')
  })

  it('formats millions/billions with the right suffix', () => {
    expect(formatNumber(1_000_000)).toBe('1.00M')
    expect(formatNumber(1_000_000_000)).toBe('1.00B')
  })

  it('handles negative values with a leading minus', () => {
    expect(formatNumber(-5)).toBe('-5')
    expect(formatNumber(-1000)).toBe('-1.00K')
  })

  it('never crashes or returns NaN text for non-finite input', () => {
    expect(formatNumber(NaN)).toBe('0')
    expect(formatNumber(Infinity)).toBe('0')
    expect(formatNumber(-Infinity)).toBe('0')
  })
})
