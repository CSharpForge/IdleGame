import { z } from 'zod'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

const roomSchema = z.object({
  id: z.string(),
  floorIndex: z.number(),
  slotIndex: z.number(),
  status: z.enum(['vacant', 'occupied']),
  builtAt: z.number(),
})

const floorSchema = z.object({
  index: z.number(),
  roomIds: z.array(z.string()),
  slotCount: z.number(),
})

export const persistedStateSchema = z.object({
  cash: z.number(),
  totalEarned: z.number(),
  lastTickTimestamp: z.number(),
  floors: z.array(floorSchema),
  rooms: z.record(z.string(), roomSchema),
  muted: z.boolean().optional(),
})

export type PersistedState = z.infer<typeof persistedStateSchema>

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
        const result = persistedStateSchema.safeParse(parsed.state)
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
