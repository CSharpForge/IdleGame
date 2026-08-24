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
  const effect = getEventDef(event.id).effect
  return effect.type === 'incomeMultiplier' ? effect.value : 1
}

/** Added directly to satisfaction, same as the concierge upgrade / prestige floor perk. */
export function eventSatisfactionBonus(event: ActiveEvent | null, now: number): number {
  if (!isEventActive(event, now)) return 0
  const effect = getEventDef(event.id).effect
  return effect.type === 'satisfactionBonus' ? effect.value : 0
}

/** Multiplies room cost — a discount, so this is always <= 1. */
export function eventRoomCostMultiplier(event: ActiveEvent | null, now: number): number {
  if (!isEventActive(event, now)) return 1
  const effect = getEventDef(event.id).effect
  return effect.type === 'roomCostDiscount' ? 1 - effect.value : 1
}
