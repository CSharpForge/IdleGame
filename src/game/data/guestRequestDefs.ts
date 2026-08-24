export interface GuestRequestDef {
  id: string
  label: string
  icon: string
  bonusCash: number
  windowSeconds: number
}

export const GUEST_REQUESTS: GuestRequestDef[] = [
  { id: 'extra-towels', label: 'Extra Towels', icon: '🧺', bonusCash: 5, windowSeconds: 12 },
  { id: 'late-checkout', label: 'Late Checkout', icon: '🕒', bonusCash: 8, windowSeconds: 12 },
  { id: 'room-service', label: 'Room Service', icon: '🍽️', bonusCash: 10, windowSeconds: 12 },
  { id: 'wake-up-call', label: 'Wake-up Call', icon: '⏰', bonusCash: 4, windowSeconds: 12 },
]

/** Per-second chance any single occupied, request-free room raises a request. */
export const GUEST_REQUEST_CHANCE_PER_SEC = 0.02

export function getGuestRequestDef(id: string): GuestRequestDef {
  const def = GUEST_REQUESTS.find((r) => r.id === id)
  if (!def) throw new Error(`Unknown guest request: ${id}`)
  return def
}

export function randomGuestRequestDef(): GuestRequestDef {
  return GUEST_REQUESTS[Math.floor(Math.random() * GUEST_REQUESTS.length)]
}
