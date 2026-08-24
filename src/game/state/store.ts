import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Floor, Room, RoomStatus } from '../../types/entities'
import { floorCost, roomCost, ROOMS_PER_FLOOR } from '../data/roomTypes'
import { simulateEconomy } from '../systems/economyTick'
import { computeOfflineEarnings } from '../systems/offlineEarnings'
import { createValidatedStorage } from '../systems/saveLoad'
import { CURRENT_SAVE_VERSION, migrateSave } from '../systems/migrations'
import { playPurchaseSound } from '../audio/soundManager'

function generateRoomId(): string {
  return `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface OfflineEarningsSummary {
  incomeEarned: number
  elapsedSeconds: number
}

export interface GameState {
  cash: number
  totalEarned: number
  lastTickTimestamp: number
  floors: Floor[]
  rooms: Record<string, Room>
  muted: boolean

  pendingOfflineEarnings: OfflineEarningsSummary | null
  dismissOfflineEarnings: () => void

  totalRoomCount: () => number
  nextRoomCost: () => number
  nextFloorCost: () => number

  buyRoom: () => boolean
  buyFloor: () => boolean
  setRoomStatus: (roomId: string, status: RoomStatus) => void
  tickEconomy: (deltaSeconds: number) => void
  toggleMuted: () => void
}

function makeInitialFloors(): Floor[] {
  return [{ index: 0, roomIds: [], slotCount: ROOMS_PER_FLOOR }]
}

/**
 * Factory rather than a bare module-level store: production uses the single
 * `useGameStore` instance below, but tests can call this directly to get a
 * fresh, isolated store (own localStorage key, own initial state) instead of
 * sharing — and polluting — one global singleton across test cases.
 */
export function createGameStore(persistName = 'grand-stay-tycoon-save'): UseBoundStore<StoreApi<GameState>> {
  return create<GameState>()(
    persist(
      immer((set, get) => ({
        cash: 25,
        totalEarned: 0,
        lastTickTimestamp: Date.now(),
        floors: makeInitialFloors(),
        rooms: {},
        muted: false,
        pendingOfflineEarnings: null,

        dismissOfflineEarnings: () =>
          set((state) => {
            state.pendingOfflineEarnings = null
          }),

        totalRoomCount: () => Object.keys(get().rooms).length,

        nextRoomCost: () => roomCost(get().totalRoomCount()),

        nextFloorCost: () => floorCost(get().floors.length),

        buyRoom: () => {
          const state = get()
          const targetFloor = state.floors.find((f) => f.roomIds.length < f.slotCount)
          if (!targetFloor) return false
          const cost = roomCost(state.totalRoomCount())
          if (state.cash < cost) return false

          const id = generateRoomId()
          set((draft) => {
            draft.cash -= cost
            const floor = draft.floors.find((f) => f.index === targetFloor.index)!
            const slotIndex = floor.roomIds.length
            floor.roomIds.push(id)
            draft.rooms[id] = {
              id,
              floorIndex: floor.index,
              slotIndex,
              status: 'vacant',
              builtAt: Date.now(),
            }
          })
          playPurchaseSound()
          return true
        },

        buyFloor: () => {
          const state = get()
          const cost = floorCost(state.floors.length)
          if (state.cash < cost) return false
          set((draft) => {
            draft.cash -= cost
            draft.floors.push({
              index: draft.floors.length,
              roomIds: [],
              slotCount: ROOMS_PER_FLOOR,
            })
          })
          playPurchaseSound()
          return true
        },

        setRoomStatus: (roomId, status) =>
          set((draft) => {
            const room = draft.rooms[roomId]
            if (room) room.status = status
          }),

        tickEconomy: (deltaSeconds) => {
          const totalRooms = get().totalRoomCount()
          const { incomeEarned } = simulateEconomy({ totalRooms }, deltaSeconds)
          set((draft) => {
            draft.cash += incomeEarned
            draft.totalEarned += incomeEarned
            draft.lastTickTimestamp = Date.now()
          })
        },

        toggleMuted: () =>
          set((draft) => {
            draft.muted = !draft.muted
          }),
      })),
      {
        name: persistName,
        version: CURRENT_SAVE_VERSION,
        migrate: migrateSave,
        storage: createValidatedStorage(),
        partialize: (state) => ({
          cash: state.cash,
          totalEarned: state.totalEarned,
          lastTickTimestamp: state.lastTickTimestamp,
          floors: state.floors,
          rooms: state.rooms,
          muted: state.muted,
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) return
          const totalRooms = Object.keys(state.rooms).length
          const { incomeEarned, elapsedSeconds } = computeOfflineEarnings(
            totalRooms,
            state.lastTickTimestamp,
          )
          state.lastTickTimestamp = Date.now()
          if (incomeEarned > 0 && elapsedSeconds > 5) {
            state.cash += incomeEarned
            state.totalEarned += incomeEarned
            state.pendingOfflineEarnings = { incomeEarned, elapsedSeconds }
          }
        },
      },
    ),
  )
}

export const useGameStore = createGameStore()
