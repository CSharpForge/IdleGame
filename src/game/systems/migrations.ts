import { persistedStateSchema } from './saveLoad'

export const CURRENT_SAVE_VERSION = 2

function freshDefaultState() {
  return {
    cash: 25,
    totalEarned: 0,
    lastTickTimestamp: Date.now(),
    floors: [{ index: 0, roomIds: [], slotCount: 4 }],
    rooms: {},
    staff: {},
    unlockedAchievementIds: [],
    muted: false,
  }
}

/**
 * v1 -> v2: room types were introduced (rooms didn't have `typeId` before —
 * they were all what's now called "standard"), along with staff and
 * achievements. Every pre-v2 save is missing those fields.
 */
function migrateV1ToV2(state: Record<string, unknown>): Record<string, unknown> {
  const rooms = (state.rooms ?? {}) as Record<string, Record<string, unknown>>
  const migratedRooms = Object.fromEntries(
    Object.entries(rooms).map(([id, room]) => [id, { ...room, typeId: room.typeId ?? 'standard' }]),
  )
  return {
    ...state,
    rooms: migratedRooms,
    staff: state.staff ?? {},
    unlockedAchievementIds: state.unlockedAchievementIds ?? [],
  }
}

/**
 * Applied by zustand's `persist` middleware whenever a save's version is
 * older than CURRENT_SAVE_VERSION. Each step upgrades from the previous
 * shape; the result is validated against the current strict schema as a
 * safety net — if migration somehow still produced something invalid, fall
 * back to a fresh save rather than letting a malformed state into the app.
 */
export function migrateSave(persistedState: unknown, version: number): unknown {
  let state = persistedState as Record<string, unknown>

  if (version < 2) {
    state = migrateV1ToV2(state)
  }

  const result = persistedStateSchema.safeParse(state)
  if (!result.success) {
    console.warn('Save migration produced an invalid shape, starting fresh.', result.error)
    return freshDefaultState()
  }
  return result.data
}
