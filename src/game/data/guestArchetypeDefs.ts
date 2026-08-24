export type GuestAccessory = 'none' | 'hat' | 'backpack' | 'suitcase'

export interface GuestArchetypeDef {
  id: string
  shirtColor: string
  skinColor: string
  accessory: GuestAccessory
  scale: number
}

export const GUEST_ARCHETYPES: GuestArchetypeDef[] = [
  { id: 'coral-casual', shirtColor: '#e07a5f', skinColor: '#f1c27d', accessory: 'none', scale: 1 },
  { id: 'navy-business', shirtColor: '#3d5a80', skinColor: '#c68642', accessory: 'suitcase', scale: 1 },
  { id: 'sage-hiker', shirtColor: '#81b29a', skinColor: '#8d5524', accessory: 'backpack', scale: 0.95 },
  { id: 'gold-tourist', shirtColor: '#f2cc8f', skinColor: '#ffdbac', accessory: 'hat', scale: 1 },
  { id: 'violet-vip', shirtColor: '#9b5de5', skinColor: '#e0ac69', accessory: 'none', scale: 1.05 },
  { id: 'indigo-family', shirtColor: '#5e60ce', skinColor: '#f1c27d', accessory: 'backpack', scale: 0.9 },
]

export function getGuestArchetypeDef(id: string): GuestArchetypeDef {
  const def = GUEST_ARCHETYPES.find((a) => a.id === id)
  if (!def) throw new Error(`Unknown guest archetype: ${id}`)
  return def
}
