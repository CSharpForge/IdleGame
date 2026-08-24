import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Floor, Room, RoomStatus, RoomTypeId, StaffMember, StaffRole } from '../../types/entities'
import { floorCost, isRoomTypeUnlocked, roomCost, ROOMS_PER_FLOOR } from '../data/roomTypes'
import { staffCost } from '../data/staffDefs'
import { getNewlyUnlockedAchievements, type AchievementDef } from '../data/achievementDefs'
import { simulateEconomy, type EconomySnapshot } from '../systems/economyTick'
import { computeOfflineEarnings } from '../systems/offlineEarnings'
import { computeSatisfaction } from '../systems/satisfaction'
import { createValidatedStorage } from '../systems/saveLoad'
import { CURRENT_SAVE_VERSION, migrateSave } from '../systems/migrations'
import { playAchievementSound, playPurchaseSound } from '../audio/soundManager'

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
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
  staff: Record<string, StaffMember>
  unlockedAchievementIds: string[]
  muted: boolean

  pendingOfflineEarnings: OfflineEarningsSummary | null
  dismissOfflineEarnings: () => void

  pendingAchievements: AchievementDef[]
  dismissTopAchievement: () => void

  totalRoomCount: () => number
  roomCountsByType: () => Partial<Record<RoomTypeId, number>>
  staffCountByRole: (role: StaffRole) => number
  satisfaction: () => number

  nextRoomCost: (typeId: RoomTypeId) => number
  nextFloorCost: () => number
  nextStaffCost: (role: StaffRole) => number

  buyRoom: (typeId: RoomTypeId) => boolean
  buyFloor: () => boolean
  hireStaff: (role: StaffRole) => boolean
  setRoomStatus: (roomId: string, status: RoomStatus) => void
  tickEconomy: (deltaSeconds: number) => void
  toggleMuted: () => void
}

function makeInitialFloors(): Floor[] {
  return [{ index: 0, roomIds: [], slotCount: ROOMS_PER_FLOOR }]
}

function countByType(rooms: Record<string, Room>): Partial<Record<RoomTypeId, number>> {
  const counts: Partial<Record<RoomTypeId, number>> = {}
  for (const room of Object.values(rooms)) {
    counts[room.typeId] = (counts[room.typeId] ?? 0) + 1
  }
  return counts
}

function countByRole(staff: Record<string, StaffMember>, role: StaffRole): number {
  let count = 0
  for (const member of Object.values(staff)) {
    if (member.role === role) count++
  }
  return count
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
      immer((set, get) => {
        function checkAchievements() {
          const state = get()
          const newly = getNewlyUnlockedAchievements(
            {
              totalRoomsBuilt: state.totalRoomCount(),
              totalFloors: state.floors.length,
              totalEarned: state.totalEarned,
              staffCount: Object.keys(state.staff).length,
            },
            state.unlockedAchievementIds,
          )
          if (newly.length === 0) return
          set((draft) => {
            for (const achievement of newly) {
              draft.unlockedAchievementIds.push(achievement.id)
              draft.pendingAchievements.push(achievement)
            }
          })
          playAchievementSound()
        }

        return {
          cash: 25,
          totalEarned: 0,
          lastTickTimestamp: Date.now(),
          floors: makeInitialFloors(),
          rooms: {},
          staff: {},
          unlockedAchievementIds: [],
          muted: false,
          pendingOfflineEarnings: null,
          pendingAchievements: [],

          dismissOfflineEarnings: () =>
            set((state) => {
              state.pendingOfflineEarnings = null
            }),

          dismissTopAchievement: () =>
            set((state) => {
              state.pendingAchievements.shift()
            }),

          totalRoomCount: () => Object.keys(get().rooms).length,

          roomCountsByType: () => countByType(get().rooms),

          staffCountByRole: (role) => countByRole(get().staff, role),

          satisfaction: () => computeSatisfaction(get().totalRoomCount(), get().staffCountByRole('housekeeper')),

          nextRoomCost: (typeId) => {
            const countOfType = countByType(get().rooms)[typeId] ?? 0
            return roomCost(typeId, countOfType)
          },

          nextFloorCost: () => floorCost(get().floors.length),

          nextStaffCost: (role) => staffCost(role, get().staffCountByRole(role)),

          buyRoom: (typeId) => {
            const state = get()
            if (!isRoomTypeUnlocked(typeId, state.totalRoomCount())) return false
            const targetFloor = state.floors.find((f) => f.roomIds.length < f.slotCount)
            if (!targetFloor) return false
            const cost = state.nextRoomCost(typeId)
            if (state.cash < cost) return false

            const id = generateId('room')
            set((draft) => {
              draft.cash -= cost
              const floor = draft.floors.find((f) => f.index === targetFloor.index)!
              const slotIndex = floor.roomIds.length
              floor.roomIds.push(id)
              draft.rooms[id] = {
                id,
                floorIndex: floor.index,
                slotIndex,
                typeId,
                status: 'vacant',
                builtAt: Date.now(),
              }
            })
            playPurchaseSound()
            checkAchievements()
            return true
          },

          buyFloor: () => {
            const state = get()
            const cost = state.nextFloorCost()
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
            checkAchievements()
            return true
          },

          hireStaff: (role) => {
            const state = get()
            const cost = state.nextStaffCost(role)
            if (state.cash < cost) return false
            const id = generateId('staff')
            set((draft) => {
              draft.cash -= cost
              draft.staff[id] = { id, role, hiredAt: Date.now() }
            })
            playPurchaseSound()
            checkAchievements()
            return true
          },

          setRoomStatus: (roomId, status) =>
            set((draft) => {
              const room = draft.rooms[roomId]
              if (room) room.status = status
            }),

          tickEconomy: (deltaSeconds) => {
            const state = get()
            const snapshot: EconomySnapshot = {
              roomCounts: state.roomCountsByType(),
              satisfaction: state.satisfaction(),
              receptionistCount: state.staffCountByRole('receptionist'),
            }
            const { incomeEarned } = simulateEconomy(snapshot, deltaSeconds)
            set((draft) => {
              draft.cash += incomeEarned
              draft.totalEarned += incomeEarned
              draft.lastTickTimestamp = Date.now()
            })
            checkAchievements()
          },

          toggleMuted: () =>
            set((draft) => {
              draft.muted = !draft.muted
            }),
        }
      }),
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
          staff: state.staff,
          unlockedAchievementIds: state.unlockedAchievementIds,
          muted: state.muted,
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) return

          const roomCounts = countByType(state.rooms)
          const housekeeperCount = countByRole(state.staff, 'housekeeper')
          const receptionistCount = countByRole(state.staff, 'receptionist')
          const totalRooms = Object.keys(state.rooms).length
          const satisfaction = computeSatisfaction(totalRooms, housekeeperCount)

          const { incomeEarned, elapsedSeconds } = computeOfflineEarnings(
            { roomCounts, satisfaction, receptionistCount },
            state.lastTickTimestamp,
          )
          state.lastTickTimestamp = Date.now()
          if (incomeEarned > 0 && elapsedSeconds > 5) {
            state.cash += incomeEarned
            state.totalEarned += incomeEarned
            state.pendingOfflineEarnings = { incomeEarned, elapsedSeconds }
          }

          const newlyUnlocked = getNewlyUnlockedAchievements(
            {
              totalRoomsBuilt: totalRooms,
              totalFloors: state.floors.length,
              totalEarned: state.totalEarned,
              staffCount: Object.keys(state.staff).length,
            },
            state.unlockedAchievementIds,
          )
          if (newlyUnlocked.length > 0) {
            state.unlockedAchievementIds = [...state.unlockedAchievementIds, ...newlyUnlocked.map((a) => a.id)]
            state.pendingAchievements = [...state.pendingAchievements, ...newlyUnlocked]
          }
        },
      },
    ),
  )
}

export const useGameStore = createGameStore()
