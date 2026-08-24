export type EventId = 'weekend_rush' | 'happy_hour'

export interface EventDef {
  id: EventId
  label: string
  description: string
  durationSeconds: number
  incomeMultiplier: number
}

export const EVENTS: EventDef[] = [
  {
    id: 'weekend_rush',
    label: 'Weekend Rush',
    description: 'Guests are flooding in! +50% income',
    durationSeconds: 120,
    incomeMultiplier: 1.5,
  },
  {
    id: 'happy_hour',
    label: 'Happy Hour',
    description: "Everyone's celebrating! +25% income",
    durationSeconds: 90,
    incomeMultiplier: 1.25,
  },
]

export function getEventDef(id: EventId): EventDef {
  const def = EVENTS.find((e) => e.id === id)
  if (!def) throw new Error(`Unknown event: ${id}`)
  return def
}

// Small enough that events feel like a nice surprise, not a constant state.
export const EVENT_SPAWN_CHANCE_PER_SEC = 0.003
