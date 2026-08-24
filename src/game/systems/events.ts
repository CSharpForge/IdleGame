import { getEventDef, type EventId } from '../data/eventDefs'

export interface ActiveEvent {
  id: EventId
  endsAt: number
}

export function isEventActive(event: ActiveEvent | null, now: number): event is ActiveEvent {
  return event !== null && event.endsAt > now
}

export function eventIncomeMultiplier(event: ActiveEvent | null, now: number): number {
  if (!isEventActive(event, now)) return 1
  return getEventDef(event.id).incomeMultiplier
}
