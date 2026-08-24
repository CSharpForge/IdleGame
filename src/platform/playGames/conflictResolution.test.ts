import { describe, expect, it } from 'vitest'
import type { PersistedState } from '../../game/systems/saveLoad'
import { resolveConflict } from './conflictResolution'

function makePersistedState(overrides: Partial<PersistedState> = {}): PersistedState {
  return {
    cash: 100,
    totalEarned: 0,
    lifetimeEarned: 0,
    lastTickTimestamp: Date.now(),
    locations: {
      'loc-1': {
        id: 'loc-1',
        themeId: 'coastal',
        floors: [{ index: 0, roomIds: [], slotCount: 4 }],
        rooms: {},
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
    ...overrides,
  }
}

describe('resolveConflict', () => {
  it('picks local when there is no cloud save', () => {
    const local = makePersistedState({ lifetimeEarned: 500 })

    const resolution = resolveConflict(local, null)

    expect(resolution.winner).toBe('local')
    expect(resolution.cloudResult).toBeNull()
  })

  it('picks cloud when a fresh local save (no progress) meets a cloud save with real progress', () => {
    const local = makePersistedState({ lifetimeEarned: 0 })
    const cloud = makePersistedState({ lifetimeEarned: 5000 })

    const resolution = resolveConflict(local, cloud)

    expect(resolution.winner).toBe('cloud')
  })

  it('picks local when local has more lifetime progress than a stale cloud save', () => {
    const local = makePersistedState({ lifetimeEarned: 10_000 })
    const cloud = makePersistedState({ lifetimeEarned: 200 })

    const resolution = resolveConflict(local, cloud)

    expect(resolution.winner).toBe('local')
  })

  it('keeps local on a tie, to avoid unnecessary churn', () => {
    const local = makePersistedState({ lifetimeEarned: 1000 })
    const cloud = makePersistedState({ lifetimeEarned: 1000 })

    const resolution = resolveConflict(local, cloud)

    expect(resolution.winner).toBe('local')
  })

  it('compares lifetimeEarned as it will be AFTER offline catch-up, not the raw saved value', () => {
    // Cloud save has less raw lifetimeEarned than local, but has been
    // offline much longer with rooms earning income — after catch-up its
    // effective lifetimeEarned should overtake local's.
    const local = makePersistedState({ lifetimeEarned: 100, lastTickTimestamp: Date.now() })
    const cloud = makePersistedState({
      lifetimeEarned: 90,
      lastTickTimestamp: Date.now() - 24 * 60 * 60 * 1000,
      locations: {
        'loc-1': {
          id: 'loc-1',
          themeId: 'coastal',
          floors: [{ index: 0, roomIds: ['r1'], slotCount: 4 }],
          rooms: {
            r1: { id: 'r1', floorIndex: 0, slotIndex: 0, typeId: 'suite', status: 'vacant', builtAt: Date.now() },
          },
          staff: {},
        },
      },
    })

    const resolution = resolveConflict(local, cloud)

    expect(resolution.cloudResult?.lifetimeEarned).toBeGreaterThan(90)
    expect(resolution.winner).toBe('cloud')
  })
})
