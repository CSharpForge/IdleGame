import { describe, expect, it } from 'vitest'
import { eventIncomeMultiplier, isEventActive } from './events'

describe('isEventActive', () => {
  it('is false when there is no event', () => {
    expect(isEventActive(null, Date.now())).toBe(false)
  })

  it('is true before the end time and false after', () => {
    const now = 1000
    const event = { id: 'weekend_rush' as const, endsAt: 2000 }
    expect(isEventActive(event, 1500)).toBe(true)
    expect(isEventActive(event, 2500)).toBe(false)
    expect(now).toBe(1000) // sanity: now unused directly, kept for readability
  })
})

describe('eventIncomeMultiplier', () => {
  it('is 1.0x with no active event', () => {
    expect(eventIncomeMultiplier(null, Date.now())).toBe(1)
  })

  it('is 1.0x once the event has expired', () => {
    const event = { id: 'happy_hour' as const, endsAt: 1000 }
    expect(eventIncomeMultiplier(event, 2000)).toBe(1)
  })

  it("matches the event's own income multiplier while active", () => {
    const event = { id: 'weekend_rush' as const, endsAt: 2000 }
    expect(eventIncomeMultiplier(event, 1000)).toBe(1.5)
  })
})
