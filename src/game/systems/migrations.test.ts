import { describe, expect, it } from 'vitest'
import { migrateSave } from './migrations'
import { persistedStateSchema } from './saveLoad'

function v1State() {
  return {
    cash: 500,
    totalEarned: 200,
    lastTickTimestamp: Date.now(),
    floors: [{ index: 0, roomIds: ['r1'], slotCount: 4 }],
    rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, status: 'occupied', builtAt: Date.now() } },
    muted: true,
  }
}

function v2State() {
  return {
    cash: 800,
    totalEarned: 600,
    lastTickTimestamp: Date.now(),
    floors: [{ index: 0, roomIds: ['r1'], slotCount: 4 }],
    rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, typeId: 'deluxe', status: 'occupied', builtAt: Date.now() } },
    staff: { s1: { id: 's1', role: 'housekeeper', hiredAt: Date.now() } },
    unlockedAchievementIds: ['first-room'],
    muted: false,
  }
}

describe('migrateSave: v1 -> v3 (full chain)', () => {
  it('upgrades a v1 save all the way to the current v3 shape', () => {
    const migrated = migrateSave(v1State(), 1) as Record<string, unknown>

    expect(persistedStateSchema.safeParse(migrated).success).toBe(true)
    const locations = migrated.locations as Record<string, { rooms: Record<string, { typeId: string }>; themeId: string }>
    const starter = Object.values(locations)[0]
    expect(starter.themeId).toBe('coastal')
    expect(Object.values(starter.rooms)[0].typeId).toBe('standard')
    expect(migrated.upgradeLevels).toEqual({ marketing: 0, staffTraining: 0, concierge: 0 })
    expect(migrated.prestigePoints).toBe(0)
    expect(migrated.activeEvent).toBeNull()
  })

  it('preserves cash and lifetime earnings across the full chain', () => {
    const migrated = migrateSave(v1State(), 1) as Record<string, unknown>
    expect(migrated.cash).toBe(500)
    expect(migrated.lifetimeEarned).toBe(200)
  })
})

describe('migrateSave: v2 -> v3', () => {
  it('wraps the old top-level floors/rooms/staff into a starter location', () => {
    const migrated = migrateSave(v2State(), 2) as Record<string, unknown>

    expect(persistedStateSchema.safeParse(migrated).success).toBe(true)
    const locations = migrated.locations as Record<string, { id: string; rooms: Record<string, unknown>; staff: Record<string, unknown> }>
    const starter = Object.values(locations)[0]
    expect(Object.keys(starter.rooms)).toEqual(['r1'])
    expect(Object.keys(starter.staff)).toEqual(['s1'])
    expect(migrated.activeLocationId).toBe(starter.id)
  })

  it('carries totalEarned into both totalEarned and lifetimeEarned', () => {
    const migrated = migrateSave(v2State(), 2) as Record<string, unknown>
    expect(migrated.totalEarned).toBe(600)
    expect(migrated.lifetimeEarned).toBe(600)
  })

  it('preserves achievements already unlocked pre-migration', () => {
    const migrated = migrateSave(v2State(), 2) as Record<string, unknown>
    expect(migrated.unlockedAchievementIds).toEqual(['first-room'])
  })
})

describe('migrateSave: already current version', () => {
  it('is a no-op (passthrough of validation) for a current-version save', () => {
    const current = {
      cash: 100,
      totalEarned: 50,
      lifetimeEarned: 50,
      lastTickTimestamp: Date.now(),
      locations: {
        'loc-1': {
          id: 'loc-1',
          themeId: 'mountain',
          floors: [{ index: 0, roomIds: [], slotCount: 4 }],
          rooms: {},
          staff: {},
        },
      },
      activeLocationId: 'loc-1',
      upgradeLevels: { marketing: 1, staffTraining: 0, concierge: 0 },
      prestigePoints: 3,
      prestigeCount: 1,
      activeEvent: null,
      unlockedAchievementIds: ['first-room'],
      muted: false,
    }
    const migrated = migrateSave(current, 3) as Record<string, unknown>
    expect(persistedStateSchema.safeParse(migrated).success).toBe(true)
    expect(migrated.prestigePoints).toBe(3)
  })
})

describe('migrateSave: safe fallback', () => {
  it('falls back to a safe fresh state if the input is unfixably malformed', () => {
    const migrated = migrateSave({ garbage: true }, 1) as Record<string, unknown>
    expect(persistedStateSchema.safeParse(migrated).success).toBe(true)
    expect(migrated.cash).toBeGreaterThanOrEqual(0)
    const locations = migrated.locations as Record<string, { rooms: Record<string, unknown> }>
    expect(Object.values(locations)[0].rooms).toEqual({})
  })
})
