import { persistedStateSchema } from './saveLoad'

export const CURRENT_SAVE_VERSION = 3

const STARTER_LOCATION_ID = 'loc-starter'

function freshDefaultState() {
  return {
    cash: 25,
    totalEarned: 0,
    lifetimeEarned: 0,
    lastTickTimestamp: Date.now(),
    locations: {
      [STARTER_LOCATION_ID]: {
        id: STARTER_LOCATION_ID,
        themeId: 'coastal',
        floors: [{ index: 0, roomIds: [], slotCount: 4 }],
        rooms: {},
        staff: {},
      },
    },
    activeLocationId: STARTER_LOCATION_ID,
    upgradeLevels: { marketing: 0, staffTraining: 0, concierge: 0 },
    prestigePoints: 0,
    prestigeCount: 0,
    activeEvent: null,
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
 * v2 -> v3: multiple hotel locations, upgrades, prestige, and timed events
 * were introduced. The single top-level floors/rooms/staff a v2 save had
 * become the *starter* location's floors/rooms/staff; everything else
 * (upgrades, prestige, events) defaults to "none yet".
 */
function migrateV2ToV3(state: Record<string, unknown>): Record<string, unknown> {
  const { floors, rooms, staff, totalEarned, ...rest } = state
  return {
    ...rest,
    totalEarned,
    lifetimeEarned: totalEarned ?? 0,
    locations: {
      [STARTER_LOCATION_ID]: {
        id: STARTER_LOCATION_ID,
        themeId: 'coastal',
        floors: floors ?? [{ index: 0, roomIds: [], slotCount: 4 }],
        rooms: rooms ?? {},
        staff: staff ?? {},
      },
    },
    activeLocationId: STARTER_LOCATION_ID,
    upgradeLevels: { marketing: 0, staffTraining: 0, concierge: 0 },
    prestigePoints: 0,
    prestigeCount: 0,
    activeEvent: null,
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
  if (version < 3) {
    state = migrateV2ToV3(state)
  }

  const result = persistedStateSchema.safeParse(state)
  if (!result.success) {
    console.warn('Save migration produced an invalid shape, starting fresh.', result.error)
    return freshDefaultState()
  }
  return result.data
}
