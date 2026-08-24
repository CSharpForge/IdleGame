import { persistedStateSchema, type PersistedState } from './saveLoad'

export const CURRENT_SAVE_VERSION = 4

const STARTER_LOCATION_ID = 'loc-starter'

/** A brand-new save's shape — also reused by cloud-save "Reset Save" to erase the cloud snapshot, not just localStorage. */
export function freshDefaultState(): PersistedState {
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
    prestigeUpgradeLevels: { cheaperRooms: 0, headStart: 0, staffSynergy: 0, satisfactionFloor: 0 },
    activeEvent: null,
    eventsExperienced: 0,
    currentSatisfactionStreakSeconds: 0,
    bestSatisfactionStreakSeconds: 0,
    totalPlaytimeSeconds: 0,
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
 * v3 -> v4 (M5): a prestige perk shop, expanded achievement tracking, and
 * generalized timed-event effects were introduced. Every new field here is
 * a genuinely new counter with no prior equivalent to derive from, so each
 * just defaults to "none yet" — unlike the new room type/staff role/event
 * ids added in the same milestone, which are enum widenings only (an older
 * save's existing values remain valid without any transform, so they don't
 * need a migration step here at all).
 */
function migrateV3ToV4(state: Record<string, unknown>): Record<string, unknown> {
  return {
    ...state,
    prestigeUpgradeLevels: state.prestigeUpgradeLevels ?? {
      cheaperRooms: 0,
      headStart: 0,
      staffSynergy: 0,
      satisfactionFloor: 0,
    },
    eventsExperienced: state.eventsExperienced ?? 0,
    currentSatisfactionStreakSeconds: state.currentSatisfactionStreakSeconds ?? 0,
    bestSatisfactionStreakSeconds: state.bestSatisfactionStreakSeconds ?? 0,
    totalPlaytimeSeconds: state.totalPlaytimeSeconds ?? 0,
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
  if (version < 4) {
    state = migrateV3ToV4(state)
  }

  const result = persistedStateSchema.safeParse(state)
  if (!result.success) {
    console.warn('Save migration produced an invalid shape, starting fresh.', result.error)
    return freshDefaultState()
  }
  return result.data
}
