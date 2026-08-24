import { describe, expect, it } from 'vitest'
import type { PersistedState } from './saveLoad'
import { computeRehydratedState } from './rehydration'

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
        floors: [{ index: 0, roomIds: ['r1'], slotCount: 4 }],
        rooms: {
          r1: { id: 'r1', floorIndex: 0, slotIndex: 0, typeId: 'standard', status: 'vacant', builtAt: Date.now() },
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
    ...overrides,
  }
}

describe('computeRehydratedState', () => {
  it('grants offline income and surfaces a summary when reopened after a long gap', () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    const saved = makePersistedState({ lastTickTimestamp: twoHoursAgo })

    const result = computeRehydratedState(saved)

    expect(result.cash).toBeGreaterThan(saved.cash)
    expect(result.pendingOfflineEarnings).not.toBeNull()
    expect(result.pendingOfflineEarnings?.elapsedSeconds).toBeCloseTo(2 * 60 * 60, 0)
  })

  it('also surfaces achievements newly satisfied by the offline catch-up', () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    const saved = makePersistedState({ lastTickTimestamp: twoHoursAgo })

    const result = computeRehydratedState(saved)

    expect(result.unlockedAchievementIds).toContain('first-room')
    expect(result.newlyUnlockedAchievements.map((a) => a.id)).toContain('first-room')
  })

  it('clears an expired event', () => {
    const saved = makePersistedState({ activeEvent: { id: 'happy_hour', endsAt: Date.now() - 1000 } })

    const result = computeRehydratedState(saved)

    expect(result.activeEvent).toBeNull()
  })

  it('keeps an active, not-yet-expired event', () => {
    const activeEvent = { id: 'happy_hour' as const, endsAt: Date.now() + 60_000 }
    const saved = makePersistedState({ activeEvent })

    const result = computeRehydratedState(saved)

    expect(result.activeEvent).toEqual(activeEvent)
  })

  it('does not grant a summary for a short gap (below the 5s floor)', () => {
    const saved = makePersistedState({ lastTickTimestamp: Date.now() - 1000 })

    const result = computeRehydratedState(saved)

    expect(result.pendingOfflineEarnings).toBeNull()
    expect(result.cash).toBe(saved.cash)
  })

  it('always stamps lastTickTimestamp to "now", regardless of how stale the save was', () => {
    const saved = makePersistedState({ lastTickTimestamp: Date.now() - 10 * 60 * 60 * 1000 })
    const now = Date.now()

    const result = computeRehydratedState(saved, now)

    expect(result.lastTickTimestamp).toBe(now)
  })
})
