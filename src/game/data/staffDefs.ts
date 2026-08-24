import type { StaffRole } from '../../types/entities'

export interface StaffRoleDef {
  id: StaffRole
  label: string
  baseCost: number
  costGrowth: number
  description: string
}

export const STAFF_ROLES: StaffRoleDef[] = [
  {
    id: 'receptionist',
    label: 'Receptionist',
    baseCost: 200,
    costGrowth: 1.5,
    description: 'Boosts income from every room.',
  },
  {
    id: 'housekeeper',
    label: 'Housekeeper',
    baseCost: 150,
    costGrowth: 1.4,
    description: 'Keeps guests happier, raising income further.',
  },
  {
    id: 'manager',
    label: 'Manager',
    baseCost: 500,
    costGrowth: 1.6,
    description: 'Boosts the effectiveness of your receptionists and housekeepers.',
  },
]

export function getStaffRoleDef(id: StaffRole): StaffRoleDef {
  const def = STAFF_ROLES.find((r) => r.id === id)
  if (!def) throw new Error(`Unknown staff role: ${id}`)
  return def
}

export function staffCost(role: StaffRole, countOfRoleHired: number): number {
  const def = getStaffRoleDef(role)
  return Math.round(def.baseCost * Math.pow(def.costGrowth, countOfRoleHired))
}

// Diminishing-returns caps: hiring past this many of a role keeps them
// employed (and visible) but stops adding further multiplier benefit, so
// the economy formula never scales unboundedly with staff count.
export const MAX_EFFECTIVE_RECEPTIONISTS = 10
export const RECEPTIONIST_INCOME_BONUS_PER_UNIT = 0.05

export const ROOMS_COVERED_PER_HOUSEKEEPER = 3

// Managers don't earn income or satisfaction directly — they multiply the
// effectiveness of the other two roles instead (see
// satisfaction.ts's managerEffectivenessMultiplier), so they need their own
// diminishing-returns cap for the same reason receptionists do.
export const MAX_EFFECTIVE_MANAGERS = 5
export const MANAGER_EFFECTIVENESS_BONUS_PER_UNIT = 0.08
