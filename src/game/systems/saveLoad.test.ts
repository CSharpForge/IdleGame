import { beforeEach, describe, expect, it } from 'vitest'
import { createValidatedStorage, persistedStateSchema } from './saveLoad'

const KEY = 'test-save'

function validPersistedValue() {
  return {
    state: {
      cash: 100,
      totalEarned: 50,
      lifetimeEarned: 50,
      lastTickTimestamp: Date.now(),
      locations: {
        'loc-1': {
          id: 'loc-1',
          themeId: 'coastal',
          floors: [{ index: 0, roomIds: ['room-1'], slotCount: 4 }],
          rooms: {
            'room-1': {
              id: 'room-1',
              floorIndex: 0,
              slotIndex: 0,
              typeId: 'standard',
              status: 'vacant',
              builtAt: Date.now(),
            },
          },
          staff: {},
        },
      },
      activeLocationId: 'loc-1',
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
    },
    version: 4,
  }
}

describe('createValidatedStorage (loose, pre-migration check)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing has been saved yet', () => {
    const storage = createValidatedStorage()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('round-trips a valid current-version save', () => {
    const storage = createValidatedStorage()
    const value = validPersistedValue()
    storage.setItem(KEY, value)
    expect(storage.getItem(KEY)).toEqual(value)
  })

  it('treats malformed JSON as no save rather than throwing', () => {
    localStorage.setItem(KEY, '{not valid json')
    const storage = createValidatedStorage()
    expect(() => storage.getItem(KEY)).not.toThrow()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('treats a save missing core fields as no save', () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { cash: 100 }, version: 1 }))
    const storage = createValidatedStorage()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('treats a save with a wrong-typed core field as no save', () => {
    const value = validPersistedValue()
    // @ts-expect-error deliberately corrupting the shape for the test
    value.state.cash = 'not-a-number'
    localStorage.setItem(KEY, JSON.stringify(value))
    const storage = createValidatedStorage()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('passes through an older-version (v1) save missing locations/upgrades/etc, so migrate() can upgrade it', () => {
    // A real pre-M2 save: no typeId, no staff, no locations at all — just
    // top-level floors/rooms. The storage layer must NOT reject this;
    // rejecting it here would silently wipe every existing save instead of
    // migrating it. Only the fields common to every save version are
    // checked at this layer (cash/totalEarned/lastTickTimestamp).
    const oldShape = {
      state: {
        cash: 100,
        totalEarned: 50,
        lastTickTimestamp: Date.now(),
        floors: [{ index: 0, roomIds: ['room-1'], slotCount: 4 }],
        rooms: { 'room-1': { id: 'room-1', floorIndex: 0, slotIndex: 0, status: 'vacant', builtAt: Date.now() } },
        muted: false,
      },
      version: 1,
    }
    localStorage.setItem(KEY, JSON.stringify(oldShape))
    const storage = createValidatedStorage()
    expect(storage.getItem(KEY)).toEqual(oldShape)
  })
})

describe('persistedStateSchema (strict, post-migration check)', () => {
  it('accepts a fully-shaped current-version save', () => {
    expect(persistedStateSchema.safeParse(validPersistedValue().state).success).toBe(true)
  })

  it('rejects a save missing locations', () => {
    const value = validPersistedValue()
    // @ts-expect-error deliberately corrupting the shape for the test
    delete value.state.locations
    expect(persistedStateSchema.safeParse(value.state).success).toBe(false)
  })

  it('rejects a room missing typeId', () => {
    const value = validPersistedValue()
    // @ts-expect-error deliberately corrupting the shape for the test
    delete value.state.locations['loc-1'].rooms['room-1'].typeId
    expect(persistedStateSchema.safeParse(value.state).success).toBe(false)
  })

  it('rejects an invalid room status value', () => {
    const value = validPersistedValue()
    value.state.locations['loc-1'].rooms['room-1'].status = 'on-fire'
    expect(persistedStateSchema.safeParse(value.state).success).toBe(false)
  })

  it('rejects an invalid staff role', () => {
    const value = validPersistedValue()
    value.state.locations['loc-1'].staff = { s1: { id: 's1', role: 'chef', hiredAt: 1 } }
    expect(persistedStateSchema.safeParse(value.state).success).toBe(false)
  })

  it('rejects an invalid location theme id', () => {
    const value = validPersistedValue()
    value.state.locations['loc-1'].themeId = 'space_station'
    expect(persistedStateSchema.safeParse(value.state).success).toBe(false)
  })

  it('rejects an invalid active event id', () => {
    const value = validPersistedValue()
    // @ts-expect-error deliberately corrupting the shape for the test
    value.state.activeEvent = { id: 'made_up_event', endsAt: Date.now() }
    expect(persistedStateSchema.safeParse(value.state).success).toBe(false)
  })

  it('accepts a null activeEvent', () => {
    const value = validPersistedValue()
    expect(persistedStateSchema.safeParse(value.state).success).toBe(true)
  })

  it('accepts a penthouse room and a manager staff member', () => {
    const value = validPersistedValue()
    value.state.locations['loc-1'].rooms['room-1'].typeId = 'penthouse'
    value.state.locations['loc-1'].staff = { s1: { id: 's1', role: 'manager', hiredAt: 1 } }
    expect(persistedStateSchema.safeParse(value.state).success).toBe(true)
  })

  it('still accepts an older save with only the original room/staff enum values', () => {
    // Regression guard: widening the typeId/role enums for penthouse/manager
    // must not require existing saves to have them.
    expect(persistedStateSchema.safeParse(validPersistedValue().state).success).toBe(true)
  })
})
