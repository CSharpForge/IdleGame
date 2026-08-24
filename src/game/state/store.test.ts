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
  it('builds a room into the first floor with space and deducts cash', () => {
    const before = store.getState().cash
    const bought = store.getState().buyRoom()

    expect(bought).toBe(true)
    const state = store.getState()
    expect(state.totalRoomCount()).toBe(1)
    expect(state.cash).toBeLessThan(before)
    const room = Object.values(state.rooms)[0]
    expect(room.floorIndex).toBe(0)
    expect(room.slotIndex).toBe(0)
    expect(room.status).toBe('vacant')
  })

  it('fails when no floor has a free slot', () => {
    store.setState({ floors: [{ index: 0, roomIds: ['x', 'y', 'z', 'w'], slotCount: 4 }] })
    expect(store.getState().buyRoom()).toBe(false)
  })

  it('fails when cash is insufficient, and does not change state', () => {
    store.setState({ cash: 0 })
    const before = store.getState()
    const bought = store.getState().buyRoom()

    expect(bought).toBe(false)
    expect(store.getState().cash).toBe(before.cash)
    expect(store.getState().totalRoomCount()).toBe(before.totalRoomCount())
  })

  it('fills floors in order, moving to the next once one is full', () => {
    store.setState({ cash: 1_000_000 })
    for (let i = 0; i < 4; i++) {
      expect(store.getState().buyRoom()).toBe(true)
    }
    expect(store.getState().floors[0].roomIds).toHaveLength(4)

    // Floor 0 is now full; buying again should fail until a new floor exists.
    expect(store.getState().buyRoom()).toBe(false)

    store.getState().buyFloor()
    expect(store.getState().buyRoom()).toBe(true)
    expect(store.getState().floors[1].roomIds).toHaveLength(1)
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

describe('setRoomStatus', () => {
  it('updates only the targeted room', () => {
    store.setState({ cash: 1_000_000 })
    store.getState().buyRoom()
    store.getState().buyRoom()
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
    store.getState().buyRoom()
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
          rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, status: 'vacant', builtAt: twoHoursAgo } },
          muted: false,
        },
        version: 1,
      }),
    )

    const rehydrated = createGameStore(key)
    const state = rehydrated.getState()

    expect(state.cash).toBeGreaterThan(100)
    expect(state.pendingOfflineEarnings).not.toBeNull()
    expect(state.pendingOfflineEarnings?.elapsedSeconds).toBeCloseTo(2 * 60 * 60, 0)
  })

  it('does not surface a summary for a very short gap', () => {
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
          muted: false,
        },
        version: 1,
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
          rooms: { r1: { id: 'r1', floorIndex: 0, slotIndex: 0, status: 'vacant', builtAt: twoHoursAgo } },
          muted: false,
        },
        version: 1,
      }),
    )

    const rehydrated = createGameStore(key)
    expect(rehydrated.getState().pendingOfflineEarnings).not.toBeNull()
    rehydrated.getState().dismissOfflineEarnings()
    expect(rehydrated.getState().pendingOfflineEarnings).toBeNull()
  })
})
