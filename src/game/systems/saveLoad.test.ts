import { beforeEach, describe, expect, it } from 'vitest'
import { createValidatedStorage, persistedStateSchema } from './saveLoad'

const KEY = 'test-save'

function validPersistedValue() {
  return {
    state: {
      cash: 100,
      totalEarned: 50,
      lastTickTimestamp: Date.now(),
      floors: [{ index: 0, roomIds: ['room-1'], slotCount: 4 }],
      rooms: {
        'room-1': { id: 'room-1', floorIndex: 0, slotIndex: 0, typeId: 'standard', status: 'vacant', builtAt: Date.now() },
      },
      staff: {},
      unlockedAchievementIds: [],
      muted: false,
    },
    version: 2,
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

  it('passes through an older-version save missing newer fields, so migrate() can upgrade it', () => {
    // No `typeId` on the room, no `staff`, no `unlockedAchievementIds` — a
    // real pre-M2 save. The storage layer must NOT reject this; rejecting
    // it here would silently wipe every existing save instead of migrating.
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

  it('rejects a room missing typeId', () => {
    const value = validPersistedValue()
    // @ts-expect-error deliberately corrupting the shape for the test
    delete value.state.rooms['room-1'].typeId
    expect(persistedStateSchema.safeParse(value.state).success).toBe(false)
  })

  it('rejects an invalid room status value', () => {
    const value = validPersistedValue()
    value.state.rooms['room-1'].status = 'on-fire'
    expect(persistedStateSchema.safeParse(value.state).success).toBe(false)
  })

  it('rejects an invalid staff role', () => {
    const value = validPersistedValue()
    value.state.staff = { s1: { id: 's1', role: 'chef', hiredAt: 1 } }
    expect(persistedStateSchema.safeParse(value.state).success).toBe(false)
  })
})
