import { beforeEach, describe, expect, it } from 'vitest'
import { createValidatedStorage } from './saveLoad'

const KEY = 'test-save'

function validPersistedValue() {
  return {
    state: {
      cash: 100,
      totalEarned: 50,
      lastTickTimestamp: Date.now(),
      floors: [{ index: 0, roomIds: ['room-1'], slotCount: 4 }],
      rooms: {
        'room-1': { id: 'room-1', floorIndex: 0, slotIndex: 0, status: 'vacant', builtAt: Date.now() },
      },
      muted: false,
    },
    version: 1,
  }
}

describe('createValidatedStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing has been saved yet', () => {
    const storage = createValidatedStorage()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('round-trips a valid save', () => {
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

  it('treats a save missing required fields as no save', () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { cash: 100 }, version: 1 }))
    const storage = createValidatedStorage()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('treats a save with a wrong-typed field as no save', () => {
    const value = validPersistedValue()
    // @ts-expect-error deliberately corrupting the shape for the test
    value.state.cash = 'not-a-number'
    localStorage.setItem(KEY, JSON.stringify(value))
    const storage = createValidatedStorage()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('rejects an invalid room status value', () => {
    const value = validPersistedValue()
    value.state.rooms['room-1'].status = 'on-fire'
    localStorage.setItem(KEY, JSON.stringify(value))
    const storage = createValidatedStorage()
    expect(storage.getItem(KEY)).toBeNull()
  })
})
