import { beforeEach, describe, expect, it } from 'vitest'
import { createGameStore, type GameState } from './store'
import type { StoreApi, UseBoundStore } from 'zustand'

let store: UseBoundStore<StoreApi<GameState>>
let keySuffix = 0

beforeEach(() => {
  localStorage.clear()
  keySuffix += 1
  store = createGameStore(`test-save-${keySuffix}`)
})

describe('buyRoom', () => {
  it('builds a standard room into the first floor with space and deducts cash', () => {
    const before = store.getState().cash
    const bought = store.getState().buyRoom('standard')

    expect(bought).toBe(true)
    const state = store.getState()
    expect(state.totalRoomCount()).toBe(1)
    expect(state.cash).toBeLessThan(before)
    const room = Object.values(state.rooms)[0]
    expect(room.floorIndex).toBe(0)
    expect(room.slotIndex).toBe(0)
    expect(room.typeId).toBe('standard')
    expect(room.status).toBe('vacant')
  })

  it('fails when no floor has a free slot', () => {
    store.setState({ floors: [{ index: 0, roomIds: ['x', 'y', 'z', 'w'], slotCount: 4 }] })
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

  it('unlocks deluxe once enough standard rooms are built', () => {
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
    expect(store.getState().floors[0].roomIds).toHaveLength(4)
    expect(store.getState().buyRoom('standard')).toBe(false)

    store.getState().buyFloor()
    expect(store.getState().buyRoom('standard')).toBe(true)
    expect(store.getState().floors[1].roomIds).toHaveLength(1)
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
    const floorsBefore = store.getState().floors.length
    const bought = store.getState().buyFloor()

    expect(bought).toBe(true)
    expect(store.getState().floors).toHaveLength(floorsBefore + 1)
    expect(store.getState().floors.at(-1)?.roomIds).toEqual([])
  })

  it('fails when cash is insufficient', () => {
    store.setState({ cash: 0 })
    expect(store.getState().buyFloor()).toBe(false)
  })
})

describe('hireStaff', () => {
  it('hires a staff member and deducts cash', () => {
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
})

describe('setRoomStatus', () => {
  it('updates only the targeted room', () => {
    store.setState({ cash: 1_000_000 })
    store.getState().buyRoom('standard')
    store.getState().buyRoom('standard')
    const [firstId, secondId] = Object.keys(store.getState().rooms)

    store.getState().setRoomStatus(firstId, 'occupied')

    expect(store.getState().rooms[firstId].status).toBe('occupied')
    expect(store.getState().rooms[secondId].status).toBe('vacant')
  })

  it('is a no-op for an unknown room id', () => {
    const before = store.getState().rooms
    store.getState().setRoomStatus('does-not-exist', 'occupied')
    expect(store.getState().rooms).toEqual(before)
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
    expect(after.lastTickTimestamp).toBeGreaterThanOrEqual(before.lastTickTimestamp)
  })

  it('adds nothing when there are no rooms', () => {
    const before = store.getState().cash
    store.getState().tickEconomy(10)
    expect(store.getState().cash).toBe(before)
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
})

describe('offline earnings on rehydration', () => {
  it('grants offline income and surfaces a summary when reopened after a long gap', () => {
    const key = 'test-save-offline'
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    localStorage.setItem(
      key,
      JSON.stringify({
        state: {
          cash: 100,
          totalEarned: 0,
          lastTickTimestamp: twoHoursAgo,
          floors: [{ index: 0, roomIds: ['r1'], slotCount: 4 }],
          rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, typeId: 'standard', status: 'vacant', builtAt: twoHoursAgo } },
          staff: {},
          unlockedAchievementIds: [],
          muted: false,
        },
        version: 2,
      }),
    )

    const rehydrated = createGameStore(key)
    const state = rehydrated.getState()

    expect(state.cash).toBeGreaterThan(100)
    expect(state.pendingOfflineEarnings).not.toBeNull()
    expect(state.pendingOfflineEarnings?.elapsedSeconds).toBeCloseTo(2 * 60 * 60, 0)
  })

  it('also unlocks achievements newly satisfied by the offline catch-up', () => {
    const key = 'test-save-offline-achievement'
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    localStorage.setItem(
      key,
      JSON.stringify({
        state: {
          cash: 0,
          totalEarned: 0,
          lastTickTimestamp: twoHoursAgo,
          floors: [{ index: 0, roomIds: ['r1'], slotCount: 4 }],
          rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, typeId: 'standard', status: 'vacant', builtAt: twoHoursAgo } },
          staff: {},
          unlockedAchievementIds: [],
          muted: false,
        },
        version: 2,
      }),
    )

    const rehydrated = createGameStore(key)
    expect(rehydrated.getState().unlockedAchievementIds).toContain('first-room')
  })

  it('does not surface an offline summary for a very short gap', () => {
    const key = 'test-save-short-gap'
    localStorage.setItem(
      key,
      JSON.stringify({
        state: {
          cash: 100,
          totalEarned: 0,
          lastTickTimestamp: Date.now() - 1000,
          floors: [{ index: 0, roomIds: [], slotCount: 4 }],
          rooms: {},
          staff: {},
          unlockedAchievementIds: [],
          muted: false,
        },
        version: 2,
      }),
    )

    const rehydrated = createGameStore(key)
    expect(rehydrated.getState().pendingOfflineEarnings).toBeNull()
  })

  it('dismissOfflineEarnings clears the pending summary', () => {
    const key = 'test-save-dismiss'
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    localStorage.setItem(
      key,
      JSON.stringify({
        state: {
          cash: 100,
          totalEarned: 0,
          lastTickTimestamp: twoHoursAgo,
          floors: [{ index: 0, roomIds: ['r1'], slotCount: 4 }],
          rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, typeId: 'standard', status: 'vacant', builtAt: twoHoursAgo } },
          staff: {},
          unlockedAchievementIds: [],
          muted: false,
        },
        version: 2,
      }),
    )

    const rehydrated = createGameStore(key)
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

    expect(state.rooms.r1.typeId).toBe('standard')
    expect(state.staff).toEqual({})
    expect(state.muted).toBe(true)
  })
})
