export type EventId = 'weekend_rush' | 'happy_hour' | 'staff_appreciation_day' | 'flash_sale'

export type EventEffect =
  | { type: 'incomeMultiplier'; value: number }
  | { type: 'satisfactionBonus'; value: number }
  | { type: 'roomCostDiscount'; value: number }

export interface EventDef {
  id: EventId
  label: string
  description: string
  durationSeconds: number
  effect: EventEffect
}

export const EVENTS: EventDef[] = [
  {
    id: 'weekend_rush',
    label: 'Weekend Rush',
    description: 'Guests are flooding in! +50% income',
    durationSeconds: 120,
    effect: { type: 'incomeMultiplier', value: 1.5 },
  },
  {
    id: 'happy_hour',
    label: 'Happy Hour',
    description: "Everyone's celebrating! +25% income",
    durationSeconds: 90,
    effect: { type: 'incomeMultiplier', value: 1.25 },
  },
  {
    id: 'staff_appreciation_day',
    label: 'Staff Appreciation Day',
    description: 'Your staff are extra motivated! +15% satisfaction',
    durationSeconds: 100,
    effect: { type: 'satisfactionBonus', value: 0.15 },
  },
  {
    id: 'flash_sale',
    label: 'Flash Sale',
    description: 'Contractors are cutting deals! -20% room cost',
    durationSeconds: 60,
    effect: { type: 'roomCostDiscount', value: 0.2 },
  },
]

export function getEventDef(id: EventId): EventDef {
  const def = EVENTS.find((e) => e.id === id)
  if (!def) throw new Error(`Unknown event: ${id}`)
  return def
}

// Small enough that events feel like a nice surprise, not a constant state.
export const EVENT_SPAWN_CHANCE_PER_SEC = 0.003
