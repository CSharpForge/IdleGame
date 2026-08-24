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

describe('migrateSave', () => {
  it('upgrades a v1 save by defaulting every room to standard and adding staff/achievements', () => {
    const migrated = migrateSave(v1State(), 1) as Record<string, unknown>

    expect(persistedStateSchema.safeParse(migrated).success).toBe(true)
    const rooms = migrated.rooms as Record<string, { typeId: string }>
    expect(rooms.r1.typeId).toBe('standard')
    expect(migrated.staff).toEqual({})
    expect(migrated.unlockedAchievementIds).toEqual([])
  })

  it('preserves existing values that carry over unchanged', () => {
    const migrated = migrateSave(v1State(), 1) as Record<string, unknown>
    expect(migrated.cash).toBe(500)
    expect(migrated.totalEarned).toBe(200)
    expect(migrated.muted).toBe(true)
  })

  it('is a no-op (passthrough of validation) for an already-current-version save', () => {
    const current = {
      ...v1State(),
      rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, typeId: 'deluxe', status: 'vacant', builtAt: 1 } },
      staff: { s1: { id: 's1', role: 'housekeeper', hiredAt: 1 } },
      unlockedAchievementIds: ['first-room'],
    }
    const migrated = migrateSave(current, 2) as Record<string, unknown>
    expect(persistedStateSchema.safeParse(migrated).success).toBe(true)
    expect((migrated.rooms as Record<string, { typeId: string }>).r1.typeId).toBe('deluxe')
    expect(migrated.unlockedAchievementIds).toEqual(['first-room'])
  })

  it('falls back to a safe fresh state if the input is unfixably malformed', () => {
    const migrated = migrateSave({ garbage: true }, 1) as Record<string, unknown>
    expect(persistedStateSchema.safeParse(migrated).success).toBe(true)
    expect(migrated.cash).toBeGreaterThanOrEqual(0)
    expect(migrated.rooms).toEqual({})
  })
})
