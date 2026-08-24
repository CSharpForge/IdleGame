import { z } from 'zod'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

const roomSchema = z.object({
  id: z.string(),
  floorIndex: z.number(),
  slotIndex: z.number(),
  typeId: z.enum(['standard', 'deluxe', 'suite']),
  status: z.enum(['vacant', 'occupied']),
  builtAt: z.number(),
})

const floorSchema = z.object({
  index: z.number(),
  roomIds: z.array(z.string()),
  slotCount: z.number(),
})

const staffMemberSchema = z.object({
  id: z.string(),
  role: z.enum(['receptionist', 'housekeeper']),
  hiredAt: z.number(),
})

const locationSchema = z.object({
  id: z.string(),
  themeId: z.enum(['coastal', 'mountain', 'city', 'desert']),
  floors: z.array(floorSchema),
  rooms: z.record(z.string(), roomSchema),
  staff: z.record(z.string(), staffMemberSchema),
})

const upgradeLevelsSchema = z.object({
  marketing: z.number(),
  staffTraining: z.number(),
  concierge: z.number(),
})

const activeEventSchema = z
  .object({
    id: z.enum(['weekend_rush', 'happy_hour']),
    endsAt: z.number(),
  })
  .nullable()

/**
 * The full, current-version shape. Used as a final sanity check AFTER
 * migration (see migrations.ts) — never at the raw storage-read layer,
 * since an older save is expected to fail this until migrated.
 */
export const persistedStateSchema = z.object({
  cash: z.number(),
  totalEarned: z.number(),
  lifetimeEarned: z.number(),
  lastTickTimestamp: z.number(),
  locations: z.record(z.string(), locationSchema),
  activeLocationId: z.string(),
  upgradeLevels: upgradeLevelsSchema,
  prestigePoints: z.number(),
  prestigeCount: z.number(),
  activeEvent: activeEventSchema,
  unlockedAchievementIds: z.array(z.string()),
  muted: z.boolean().optional(),
})

export type PersistedState = z.infer<typeof persistedStateSchema>

/**
 * A deliberately loose shape check for whatever the storage layer reads —
 * just enough to reject garbage/corrupted JSON. It must NOT enforce the
 * current version's full schema, because that would reject a valid *older*
 * save before zustand's `migrate` ever gets a chance to upgrade it. Strict
 * validation of the final shape happens post-migration instead.
 */
const rawSaveEnvelopeSchema = z.object({
  state: z
    .object({
      cash: z.number(),
      totalEarned: z.number(),
      lastTickTimestamp: z.number(),
    })
    .passthrough(),
  version: z.number(),
})

/**
 * Wraps localStorage with JSON-shape validation so a corrupted or
 * hand-edited save can't crash the app on load — an invalid save is
 * treated as "no save" (fresh start) rather than thrown.
 */
export function createValidatedStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name) => {
      const raw = localStorage.getItem(name)
      if (!raw) return null
      try {
        const parsed = JSON.parse(raw) as StorageValue<unknown>
        const result = rawSaveEnvelopeSchema.safeParse(parsed)
        if (!result.success) {
          console.warn('Save data failed validation, starting fresh.', result.error)
          return null
        }
        return parsed as StorageValue<T>
      } catch (err) {
        console.warn('Save data was corrupted, starting fresh.', err)
        return null
      }
    },
    setItem: (name, value) => {
      localStorage.setItem(name, JSON.stringify(value))
    },
    removeItem: (name) => {
      localStorage.removeItem(name)
    },
  }
}
