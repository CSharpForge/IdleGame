import { describe, expect, it } from 'vitest'
import { eventIncomeMultiplier, eventRoomCostMultiplier, eventSatisfactionBonus, isEventActive } from './events'

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

  it('is neutral (1.0x) for an active event of a different effect type', () => {
    const event = { id: 'staff_appreciation_day' as const, endsAt: 2000 }
    expect(eventIncomeMultiplier(event, 1000)).toBe(1)
  })
})

describe('eventSatisfactionBonus', () => {
  it('is 0 with no active event', () => {
    expect(eventSatisfactionBonus(null, Date.now())).toBe(0)
  })

  it('is 0 once the event has expired', () => {
    const event = { id: 'staff_appreciation_day' as const, endsAt: 1000 }
    expect(eventSatisfactionBonus(event, 2000)).toBe(0)
  })

  it("matches the event's own satisfaction bonus while active", () => {
    const event = { id: 'staff_appreciation_day' as const, endsAt: 2000 }
    expect(eventSatisfactionBonus(event, 1000)).toBe(0.15)
  })

  it('is neutral (0) for an active event of a different effect type', () => {
    const event = { id: 'weekend_rush' as const, endsAt: 2000 }
    expect(eventSatisfactionBonus(event, 1000)).toBe(0)
  })
})

describe('eventRoomCostMultiplier', () => {
  it('is 1.0x with no active event', () => {
    expect(eventRoomCostMultiplier(null, Date.now())).toBe(1)
  })

  it('is 1.0x once the event has expired', () => {
    const event = { id: 'flash_sale' as const, endsAt: 1000 }
    expect(eventRoomCostMultiplier(event, 2000)).toBe(1)
  })

  it("matches the event's own discount while active", () => {
    const event = { id: 'flash_sale' as const, endsAt: 2000 }
    expect(eventRoomCostMultiplier(event, 1000)).toBeCloseTo(0.8, 10)
  })

  it('is neutral (1.0x) for an active event of a different effect type', () => {
    const event = { id: 'weekend_rush' as const, endsAt: 2000 }
    expect(eventRoomCostMultiplier(event, 1000)).toBe(1)
  })
})
