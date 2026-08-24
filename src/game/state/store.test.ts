import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGameStore, type GameState } from './store'
import type { StoreApi, UseBoundStore } from 'zustand'
import { MIN_TOTAL_EARNED_TO_PRESTIGE } from '../systems/prestige'

let store: UseBoundStore<StoreApi<GameState>>
let keySuffix = 0

beforeEach(() => {
  localStorage.clear()
  keySuffix += 1
  store = createGameStore(`test-save-${keySuffix}`)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buyRoom', () => {
  it('builds a standard room into the active location and deducts cash', () => {
    const before = store.getState().cash
    const bought = store.getState().buyRoom('standard')

    expect(bought).toBe(true)
    const state = store.getState()
    expect(state.totalRoomCount()).toBe(1)
    expect(state.cash).toBeLessThan(before)
    const room = Object.values(state.activeLocation().rooms)[0]
    expect(room.floorIndex).toBe(0)
    expect(room.slotIndex).toBe(0)
    expect(room.typeId).toBe('standard')
    expect(room.status).toBe('vacant')
  })

  it('fails when no floor has a free slot', () => {
    const locId = store.getState().activeLocationId
    store.setState((s) => ({
      locations: { ...s.locations, [locId]: { ...s.locations[locId], floors: [{ index: 0, roomIds: ['x', 'y', 'z', 'w'], slotCount: 4 }] } },
    }))
    expect(store.getState().buyRoom('standard')).toBe(false)
  })

  it('fails when cash is insufficient, and does not change state', () => {
    store.setState({ cash: 0 })
    const before = store.getState()
    const bought = store.getState().buyRoom('standard')

    expect(bought).toBe(false)
    expect(store.getState().cash).toBe(before.cash)
    expect(store.getState().totalRoomCount()).toBe(before.totalRoomCount())
  })

  it('fails to build a locked room type even with enough cash and space', () => {
    store.setState({ cash: 1_000_000 })
    expect(store.getState().buyRoom('suite')).toBe(false)
  })

  it('unlocks deluxe once enough standard rooms are built in this location', () => {
    store.setState({ cash: 1_000_000 })
    expect(store.getState().buyRoom('deluxe')).toBe(false)
    for (let i = 0; i < 4; i++) {
      store.getState().buyRoom('standard')
      store.getState().buyFloor()
    }
    expect(store.getState().buyRoom('deluxe')).toBe(true)
  })

  it('fills floors in order, moving to the next once one is full', () => {
    store.setState({ cash: 1_000_000 })
    for (let i = 0; i < 4; i++) {
      expect(store.getState().buyRoom('standard')).toBe(true)
    }
    expect(store.getState().activeLocation().floors[0].roomIds).toHaveLength(4)
    expect(store.getState().buyRoom('standard')).toBe(false)

    store.getState().buyFloor()
    expect(store.getState().buyRoom('standard')).toBe(true)
    expect(store.getState().activeLocation().floors[1].roomIds).toHaveLength(1)
  })

  it('prices each room type on its own independent cost curve', () => {
    store.setState({ cash: 1_000_000 })
    const firstStandardCost = store.getState().nextRoomCost('standard')
    store.getState().buyRoom('standard')
    const secondStandardCost = store.getState().nextRoomCost('standard')
    const deluxeCost = store.getState().nextRoomCost('deluxe')

    expect(secondStandardCost).toBeGreaterThan(firstStandardCost)
    expect(deluxeCost).not.toBe(firstStandardCost)
  })
})

describe('buyFloor', () => {
  it('adds a new empty floor and deducts cash', () => {
    store.setState({ cash: 1_000_000 })
    const floorsBefore = store.getState().activeLocation().floors.length
    const bought = store.getState().buyFloor()

    expect(bought).toBe(true)
    expect(store.getState().activeLocation().floors).toHaveLength(floorsBefore + 1)
    expect(store.getState().activeLocation().floors.at(-1)?.roomIds).toEqual([])
  })

  it('fails when cash is insufficient', () => {
    store.setState({ cash: 0 })
    expect(store.getState().buyFloor()).toBe(false)
  })
})

describe('hireStaff', () => {
  it('hires a staff member into the active location and deducts cash', () => {
    store.setState({ cash: 1_000_000 })
    const hired = store.getState().hireStaff('housekeeper')

    expect(hired).toBe(true)
    expect(store.getState().staffCountByRole('housekeeper')).toBe(1)
  })

  it('fails when cash is insufficient', () => {
    store.setState({ cash: 0 })
    expect(store.getState().hireStaff('receptionist')).toBe(false)
  })

  it('prices each additional hire of the same role higher', () => {
    store.setState({ cash: 1_000_000 })
    const firstCost = store.getState().nextStaffCost('receptionist')
    store.getState().hireStaff('receptionist')
    const secondCost = store.getState().nextStaffCost('receptionist')
    expect(secondCost).toBeGreaterThan(firstCost)
  })
})

describe('satisfaction', () => {
  it('is perfect with no rooms built', () => {
    expect(store.getState().satisfaction()).toBe(1)
  })

  it('improves after hiring housekeepers', () => {
    store.setState({ cash: 1_000_000 })
    for (let i = 0; i < 8; i++) {
      store.getState().buyRoom('standard')
      if (i % 4 === 3) store.getState().buyFloor()
    }
    const before = store.getState().satisfaction()
    store.getState().hireStaff('housekeeper')
    const after = store.getState().satisfaction()
    expect(after).toBeGreaterThan(before)
  })

  it('improves after buying the concierge upgrade', () => {
    store.setState({ cash: 1_000_000 })
    for (let i = 0; i < 8; i++) {
      store.getState().buyRoom('standard')
      if (i % 4 === 3) store.getState().buyFloor()
    }
    const before = store.getState().satisfaction()
    store.getState().buyUpgrade('concierge')
    expect(store.getState().satisfaction()).toBeGreaterThan(before)
  })
})

describe('setRoomStatus', () => {
  it('updates only the targeted room in the active location', () => {
    store.setState({ cash: 1_000_000 })
    store.getState().buyRoom('standard')
    store.getState().buyRoom('standard')
    const [firstId, secondId] = Object.keys(store.getState().activeLocation().rooms)

    store.getState().setRoomStatus(firstId, 'occupied')

    expect(store.getState().activeLocation().rooms[firstId].status).toBe('occupied')
    expect(store.getState().activeLocation().rooms[secondId].status).toBe('vacant')
  })

  it('is a no-op for an unknown room id', () => {
    const before = store.getState().activeLocation().rooms
    store.getState().setRoomStatus('does-not-exist', 'occupied')
    expect(store.getState().activeLocation().rooms).toEqual(before)
  })
})

describe('buyUpgrade', () => {
  it('increases the upgrade level and deducts cash', () => {
    store.setState({ cash: 1_000_000 })
    expect(store.getState().buyUpgrade('marketing')).toBe(true)
    expect(store.getState().upgradeLevels.marketing).toBe(1)
  })

  it('fails when cash is insufficient', () => {
    store.setState({ cash: 0 })
    expect(store.getState().buyUpgrade('marketing')).toBe(false)
  })

  it('fails once the upgrade is maxed out', () => {
    store.setState({ cash: 1e12 })
    for (let i = 0; i < 20; i++) store.getState().buyUpgrade('concierge')
    const levelAtCap = store.getState().upgradeLevels.concierge
    expect(store.getState().buyUpgrade('concierge')).toBe(false)
    expect(store.getState().upgradeLevels.concierge).toBe(levelAtCap)
  })
})

describe('locations', () => {
  it('starts with exactly one unlocked location, the first theme', () => {
    const state = store.getState()
    expect(Object.keys(state.locations)).toHaveLength(1)
    expect(state.isLocationUnlocked('coastal')).toBe(true)
    expect(state.isLocationUnlocked('mountain')).toBe(false)
  })

  it('unlockLocation fails when cash is insufficient', () => {
    expect(store.getState().unlockLocation('mountain')).toBe(false)
  })

  it('unlockLocation succeeds with enough cash, deducts it, and switches to the new location', () => {
    store.setState({ cash: 1_000_000 })
    const unlocked = store.getState().unlockLocation('mountain')

    expect(unlocked).toBe(true)
    expect(store.getState().isLocationUnlocked('mountain')).toBe(true)
    expect(Object.keys(store.getState().locations)).toHaveLength(2)
    expect(store.getState().activeLocation().themeId).toBe('mountain')
  })

  it('unlockLocation fails if that theme is already unlocked', () => {
    store.setState({ cash: 1_000_000 })
    store.getState().unlockLocation('mountain')
    const cashAfterFirst = store.getState().cash
    expect(store.getState().unlockLocation('mountain')).toBe(false)
    expect(store.getState().cash).toBe(cashAfterFirst)
  })

  it('each location has independent rooms/floors/staff', () => {
    store.setState({ cash: 1_000_000 })
    store.getState().buyRoom('standard')
    const firstLocationId = store.getState().activeLocationId
    store.getState().unlockLocation('mountain')
    expect(store.getState().totalRoomCount()).toBe(0)
    store.getState().buyRoom('standard')
    expect(store.getState().totalRoomCount()).toBe(1)

    store.getState().switchLocation(firstLocationId)
    expect(store.getState().totalRoomCount()).toBe(1)
    expect(store.getState().totalRoomCountAllLocations()).toBe(2)
  })

  it('switchLocation is a no-op for an unknown location id', () => {
    const before = store.getState().activeLocationId
    store.getState().switchLocation('does-not-exist')
    expect(store.getState().activeLocationId).toBe(before)
  })
})

describe('prestige', () => {
  it('cannot prestige before the minimum earnings threshold', () => {
    expect(store.getState().prestige()).toBe(false)
  })

  it('resets cash/rooms/floors/staff/upgrades and grants prestige points once eligible', () => {
    store.setState({ cash: 1_000_000, totalEarned: MIN_TOTAL_EARNED_TO_PRESTIGE * 4 })
    store.getState().buyRoom('standard')
    store.getState().hireStaff('housekeeper')
    store.getState().buyUpgrade('marketing')

    const result = store.getState().prestige()

    expect(result).toBe(true)
    const state = store.getState()
    expect(state.prestigePoints).toBeGreaterThan(0)
    expect(state.prestigeCount).toBe(1)
    expect(state.cash).toBe(25)
    expect(state.totalEarned).toBe(0)
    expect(state.upgradeLevels).toEqual({ marketing: 0, staffTraining: 0, concierge: 0 })
    expect(Object.keys(state.locations)).toHaveLength(1)
    expect(state.totalRoomCountAllLocations()).toBe(0)
  })

  it('does not reset lifetimeEarned or unlocked achievements', () => {
    store.setState({ cash: 1_000_000, totalEarned: MIN_TOTAL_EARNED_TO_PRESTIGE * 4, lifetimeEarned: 99_999 })
    store.getState().buyRoom('standard')
    store.getState().prestige()
    const state = store.getState()
    expect(state.lifetimeEarned).toBe(99_999)
    expect(state.unlockedAchievementIds).toContain('first-room')
  })

  it('the permanent multiplier persists across resets (prestigePoints only ever grows)', () => {
    store.setState({ cash: 1_000_000, totalEarned: MIN_TOTAL_EARNED_TO_PRESTIGE * 4 })
    store.getState().prestige()
    const pointsAfterFirst = store.getState().prestigePoints
    expect(pointsAfterFirst).toBeGreaterThan(0)

    store.setState({ cash: 1_000_000, totalEarned: MIN_TOTAL_EARNED_TO_PRESTIGE * 9 })
    store.getState().prestige()
    expect(store.getState().prestigePoints).toBeGreaterThan(pointsAfterFirst)
    expect(store.getState().prestigeCount).toBe(2)
  })
})

describe('tickEconomy', () => {
  it('adds income proportional to room count and delta, and advances lastTickTimestamp', () => {
    store.setState({ cash: 1_000_000 })
    store.getState().buyRoom('standard')
    const before = store.getState()

    store.getState().tickEconomy(10)

    const after = store.getState()
    expect(after.cash).toBeGreaterThan(before.cash)
    expect(after.totalEarned).toBeGreaterThan(before.totalEarned)
    expect(after.lifetimeEarned).toBeGreaterThan(before.lifetimeEarned)
    expect(after.lastTickTimestamp).toBeGreaterThanOrEqual(before.lastTickTimestamp)
  })

  it('adds nothing when there are no rooms anywhere', () => {
    const before = store.getState().cash
    store.getState().tickEconomy(10)
    expect(store.getState().cash).toBe(before)
  })

  it('earns from every unlocked location simultaneously, not just the active one', () => {
    // See the "marketing and staff training" test below for why Math.random
    // is pinned: tickEconomy also rolls a chance to start a timed event.
    vi.spyOn(Math, 'random').mockReturnValue(0.999)

    store.setState({ cash: 1_000_000 })
    store.getState().buyRoom('standard')
    store.getState().unlockLocation('mountain')
    store.getState().buyRoom('standard')
    // now on 'mountain' with 1 room; the first location also has 1 room
    const cashBefore = store.getState().cash
    store.getState().tickEconomy(10)
    const soloIncome = store.getState().cash - cashBefore

    // Compare against a single-location baseline in a fresh store.
    const solo = createGameStore(`test-save-solo-${keySuffix}`)
    solo.setState({ cash: 1_000_000 })
    solo.getState().buyRoom('standard')
    const soloBefore = solo.getState().cash
    solo.getState().tickEconomy(10)
    const oneLocationIncome = solo.getState().cash - soloBefore

    expect(soloIncome).toBeGreaterThan(oneLocationIncome)
  })

  it('marketing and staff training upgrades increase tick income', () => {
    // tickEconomy also rolls a random chance to start a timed event (see
    // data/eventDefs.ts) — pin Math.random() so an unlucky roll on one side
    // of this comparison can't make the test flaky.
    vi.spyOn(Math, 'random').mockReturnValue(0.999)

    store.setState({ cash: 1_000_000 })
    store.getState().buyRoom('standard')
    const baselineStore = createGameStore(`test-save-baseline-${keySuffix}`)
    baselineStore.setState({ cash: 1_000_000 })
    baselineStore.getState().buyRoom('standard')

    store.getState().buyUpgrade('marketing')

    const cashBefore = store.getState().cash
    const baselineCashBefore = baselineStore.getState().cash
    store.getState().tickEconomy(10)
    baselineStore.getState().tickEconomy(10)

    const upgraded = store.getState().cash - cashBefore
    const baseline = baselineStore.getState().cash - baselineCashBefore
    expect(upgraded).toBeGreaterThan(baseline)
  })
})

describe('toggleMuted', () => {
  it('flips the muted flag', () => {
    expect(store.getState().muted).toBe(false)
    store.getState().toggleMuted()
    expect(store.getState().muted).toBe(true)
    store.getState().toggleMuted()
    expect(store.getState().muted).toBe(false)
  })
})

describe('achievements', () => {
  it('unlocks "Grand Opening" after the first room and queues it for display', () => {
    store.setState({ cash: 1_000_000 })
    expect(store.getState().unlockedAchievementIds).not.toContain('first-room')

    store.getState().buyRoom('standard')

    expect(store.getState().unlockedAchievementIds).toContain('first-room')
    expect(store.getState().pendingAchievements.map((a) => a.id)).toContain('first-room')
  })

  it('does not unlock the same achievement twice', () => {
    store.setState({ cash: 1_000_000 })
    store.getState().buyRoom('standard')
    store.getState().dismissTopAchievement()
    store.getState().buyRoom('standard')

    const count = store.getState().unlockedAchievementIds.filter((id) => id === 'first-room').length
    expect(count).toBe(1)
  })

  it('dismissTopAchievement removes only the front of the queue', () => {
    store.setState({ cash: 1_000_000 })
    for (let i = 0; i < 5; i++) {
      store.getState().buyRoom('standard')
      if (i === 3) store.getState().buyFloor()
    }
    const queueBefore = store.getState().pendingAchievements.length
    expect(queueBefore).toBeGreaterThan(1)

    const firstId = store.getState().pendingAchievements[0].id
    store.getState().dismissTopAchievement()

    expect(store.getState().pendingAchievements).toHaveLength(queueBefore - 1)
    expect(store.getState().pendingAchievements[0].id).not.toBe(firstId)
  })

  it('unlocks second-location and first-upgrade achievements', () => {
    store.setState({ cash: 1_000_000 })
    store.getState().unlockLocation('mountain')
    store.getState().buyUpgrade('marketing')
    expect(store.getState().unlockedAchievementIds).toContain('second-location')
    expect(store.getState().unlockedAchievementIds).toContain('first-upgrade')
  })

  it('unlocks first-prestige after prestiging', () => {
    store.setState({ cash: 1_000_000, totalEarned: MIN_TOTAL_EARNED_TO_PRESTIGE * 4 })
    store.getState().prestige()
    expect(store.getState().unlockedAchievementIds).toContain('first-prestige')
  })
})

describe('offline earnings on rehydration', () => {
  function seedV3Save(key: string, overrides: Record<string, unknown> = {}) {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    localStorage.setItem(
      key,
      JSON.stringify({
        state: {
          cash: 100,
          totalEarned: 0,
          lifetimeEarned: 0,
          lastTickTimestamp: twoHoursAgo,
          locations: {
            'loc-1': {
              id: 'loc-1',
              themeId: 'coastal',
              floors: [{ index: 0, roomIds: ['r1'], slotCount: 4 }],
              rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, typeId: 'standard', status: 'vacant', builtAt: twoHoursAgo } },
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
          ...overrides,
        },
        version: 3,
      }),
    )
  }

  it('grants offline income and surfaces a summary when reopened after a long gap', () => {
    seedV3Save('test-save-offline')
    const rehydrated = createGameStore('test-save-offline')
    const state = rehydrated.getState()

    expect(state.cash).toBeGreaterThan(100)
    expect(state.pendingOfflineEarnings).not.toBeNull()
    expect(state.pendingOfflineEarnings?.elapsedSeconds).toBeCloseTo(2 * 60 * 60, 0)
  })

  it('also unlocks achievements newly satisfied by the offline catch-up', () => {
    seedV3Save('test-save-offline-achievement')
    const rehydrated = createGameStore('test-save-offline-achievement')
    expect(rehydrated.getState().unlockedAchievementIds).toContain('first-room')
  })

  it('clears an expired event on load', () => {
    seedV3Save('test-save-expired-event', { activeEvent: { id: 'happy_hour', endsAt: Date.now() - 1000 } })
    const rehydrated = createGameStore('test-save-expired-event')
    expect(rehydrated.getState().activeEvent).toBeNull()
  })

  it('dismissOfflineEarnings clears the pending summary', () => {
    seedV3Save('test-save-dismiss')
    const rehydrated = createGameStore('test-save-dismiss')
    expect(rehydrated.getState().pendingOfflineEarnings).not.toBeNull()
    rehydrated.getState().dismissOfflineEarnings()
    expect(rehydrated.getState().pendingOfflineEarnings).toBeNull()
  })

  it('migrates a pre-M2 (v1) save without crashing and defaults its rooms to standard', () => {
    const key = 'test-save-v1-migration'
    localStorage.setItem(
      key,
      JSON.stringify({
        state: {
          cash: 250,
          totalEarned: 100,
          lastTickTimestamp: Date.now() - 1000,
          floors: [{ index: 0, roomIds: ['r1'], slotCount: 4 }],
          rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, status: 'occupied', builtAt: Date.now() } },
          muted: true,
        },
        version: 1,
      }),
    )

    const rehydrated = createGameStore(key)
    const state = rehydrated.getState()

    expect(Object.values(state.activeLocation().rooms)[0].typeId).toBe('standard')
    expect(state.activeLocation().staff).toEqual({})
    expect(state.muted).toBe(true)
  })
})
