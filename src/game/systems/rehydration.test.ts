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
    qualityOverride: 'auto',
    requestsFulfilledTotal: 0,
    lastLoginDate: null,
    loginStreakDays: 0,
    longestLoginStreakDays: 0,
    tutorialCompleted: true,
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

describe('computeRehydratedState: daily login streak', () => {
  const DAY = 24 * 60 * 60 * 1000

  it("a brand-new save's first-ever session starts the streak silently, with no reward popup", () => {
    const now = Date.now()
    const saved = makePersistedState({ lastLoginDate: null, loginStreakDays: 0 })

    const result = computeRehydratedState(saved, now)

    expect(result.loginStreakDays).toBe(1)
    expect(result.longestLoginStreakDays).toBe(1)
    expect(result.pendingDailyReward).toBeNull()
    expect(result.cash).toBe(saved.cash)
  })

  it('logging in again the same UTC day grants nothing and leaves the streak unchanged', () => {
    const now = Date.now()
    const saved = makePersistedState({ lastLoginDate: utcKey(now), loginStreakDays: 3, longestLoginStreakDays: 3 })

    const result = computeRehydratedState(saved, now)

    expect(result.loginStreakDays).toBe(3)
    expect(result.pendingDailyReward).toBeNull()
    expect(result.cash).toBe(saved.cash)
  })

  it('a returning player on a consecutive day gets a reward and an incremented streak', () => {
    const now = Date.now()
    const saved = makePersistedState({
      lastLoginDate: utcKey(now - DAY),
      loginStreakDays: 2,
      longestLoginStreakDays: 2,
      lastTickTimestamp: now - 1000, // short gap, avoids also triggering offline earnings
    })

    const result = computeRehydratedState(saved, now)

    expect(result.loginStreakDays).toBe(3)
    expect(result.longestLoginStreakDays).toBe(3)
    expect(result.pendingDailyReward).toEqual({ streakDay: 3, cashAmount: expect.any(Number) })
    expect(result.pendingDailyReward!.cashAmount).toBeGreaterThan(0)
    expect(result.cash).toBe(saved.cash + result.pendingDailyReward!.cashAmount)
  })

  it('missing a day resets the streak to 1 but still grants the day-1 reward', () => {
    const now = Date.now()
    const saved = makePersistedState({
      lastLoginDate: utcKey(now - 5 * DAY),
      loginStreakDays: 6,
      longestLoginStreakDays: 6,
      lastTickTimestamp: now - 1000,
    })

    const result = computeRehydratedState(saved, now)

    expect(result.loginStreakDays).toBe(1)
    // longest streak is a high-water mark — a reset never lowers it.
    expect(result.longestLoginStreakDays).toBe(6)
    expect(result.pendingDailyReward?.streakDay).toBe(1)
  })

  function utcKey(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10)
  }
})
