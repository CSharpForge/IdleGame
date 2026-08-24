import { beforeEach, describe, expect, it, vi } from 'vitest'

const pluginMock = {
  signInSilently: vi.fn(),
  isSignedIn: vi.fn(),
  saveSnapshot: vi.fn(),
  loadSnapshot: vi.fn(),
  unlockAchievement: vi.fn(),
  submitScore: vi.fn(),
  showAchievementsUI: vi.fn(),
  showLeaderboardUI: vi.fn(),
}

let mockPlatform = 'web'

vi.mock('@capacitor/core', () => ({
  registerPlugin: () => pluginMock,
  Capacitor: { getPlatform: () => mockPlatform },
}))

const {
  signInSilently,
  saveCloudSnapshot,
  loadCloudSnapshot,
  reportAchievementUnlock,
  submitLifetimeEarningsScore,
  showAchievementsUI,
  showLeaderboardUI,
} = await import('./playGamesClient')

function makeV3Save() {
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
    activeEvent: null,
    unlockedAchievementIds: [],
    muted: false,
  }
}

describe('playGamesClient on a non-android platform', () => {
  beforeEach(() => {
    mockPlatform = 'web'
    vi.clearAllMocks()
  })

  it('signInSilently no-ops and returns false', async () => {
    expect(await signInSilently()).toBe(false)
    expect(pluginMock.signInSilently).not.toHaveBeenCalled()
  })

  it('loadCloudSnapshot no-ops and returns null', async () => {
    expect(await loadCloudSnapshot()).toBeNull()
    expect(pluginMock.loadSnapshot).not.toHaveBeenCalled()
  })

  it('saveCloudSnapshot, reportAchievementUnlock, submitLifetimeEarningsScore, and the UI openers all no-op', async () => {
    await saveCloudSnapshot(makeV3Save() as never)
    await reportAchievementUnlock('some-id')
    await submitLifetimeEarningsScore(1000)
    await showAchievementsUI()
    await showLeaderboardUI()

    expect(pluginMock.saveSnapshot).not.toHaveBeenCalled()
    expect(pluginMock.unlockAchievement).not.toHaveBeenCalled()
    expect(pluginMock.submitScore).not.toHaveBeenCalled()
    expect(pluginMock.showAchievementsUI).not.toHaveBeenCalled()
    expect(pluginMock.showLeaderboardUI).not.toHaveBeenCalled()
  })
})

describe('playGamesClient on android', () => {
  beforeEach(() => {
    mockPlatform = 'android'
    vi.clearAllMocks()
  })

  it('signInSilently forwards the native result', async () => {
    pluginMock.signInSilently.mockResolvedValue({ signedIn: true })
    expect(await signInSilently()).toBe(true)
  })

  it('signInSilently swallows a native error and returns false', async () => {
    pluginMock.signInSilently.mockRejectedValue(new Error('boom'))
    expect(await signInSilently()).toBe(false)
  })

  it('loadCloudSnapshot returns null (never throws) when there is no snapshot', async () => {
    pluginMock.loadSnapshot.mockResolvedValue({ dataJson: null })
    expect(await loadCloudSnapshot()).toBeNull()
  })

  it('loadCloudSnapshot returns null (never throws) on malformed JSON from native', async () => {
    pluginMock.loadSnapshot.mockResolvedValue({ dataJson: '{not valid json' })
    expect(await loadCloudSnapshot()).toBeNull()
  })

  it('loadCloudSnapshot migrates an older-version snapshot to the current schema', async () => {
    pluginMock.loadSnapshot.mockResolvedValue({
      dataJson: JSON.stringify({ state: makeV3Save(), version: 3 }),
    })

    const result = await loadCloudSnapshot()

    expect(result).not.toBeNull()
    expect(result?.prestigeUpgradeLevels).toEqual({
      cheaperRooms: 0,
      headStart: 0,
      staffSynergy: 0,
      satisfactionFloor: 0,
    })
  })

  it('saveCloudSnapshot forwards a JSON envelope to the native plugin', async () => {
    const state = makeV3Save()
    await saveCloudSnapshot(state as never)

    expect(pluginMock.saveSnapshot).toHaveBeenCalledTimes(1)
    const call = pluginMock.saveSnapshot.mock.calls[0][0]
    expect(JSON.parse(call.dataJson).state.cash).toBe(100)
  })

  it('reportAchievementUnlock swallows native errors without throwing', async () => {
    pluginMock.unlockAchievement.mockRejectedValue(new Error('boom'))
    await expect(reportAchievementUnlock('some-id')).resolves.toBeUndefined()
  })
})
