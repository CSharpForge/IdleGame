import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { HotelLocation, LocationThemeId, RoomStatus, RoomTypeId, StaffRole } from '../../types/entities'
import {
  floorCost,
  isFloorMaxWidth,
  isRoomTypeUnlocked,
  roomCost,
  ROOMS_PER_FLOOR,
  wingExpansionCost,
  timesFloorExpanded,
  WING_EXPANSION_SIZE,
} from '../data/roomTypes'
import { staffCost } from '../data/staffDefs'
import { isUpgradeMaxed, upgradeCost, type UpgradeId } from '../data/upgradeDefs'
import {
  isPrestigeUpgradeMaxed,
  prestigeUpgradeCost,
  PRESTIGE_UPGRADES,
  type PrestigeUpgradeId,
} from '../data/prestigeUpgradeDefs'
import { getLocationThemeDef, LOCATION_THEMES } from '../data/locationThemes'
import { EVENTS, EVENT_SPAWN_CHANCE_PER_SEC } from '../data/eventDefs'
import { getNewlyUnlockedAchievements, type AchievementDef } from '../data/achievementDefs'
import { getGuestRequestDef, randomGuestRequestDef } from '../data/guestRequestDefs'
import type { QualityOverride } from '../../scene/materials/rendererCapabilities'
import { simulateEconomyAcrossLocations } from '../systems/economyTick'
import {
  buildAchievementSnapshot,
  buildLocationSnapshots,
  countByRole,
  countByType,
  locationSatisfaction,
} from '../systems/locationStats'
import { HIGH_SATISFACTION_THRESHOLD } from '../systems/satisfaction'
import { upgradeIncomeMultiplier, upgradeSatisfactionBonus } from '../systems/upgrades'
import {
  prestigeHeadStartBonus,
  prestigeIncomeMultiplier,
  prestigePointsForTotalEarned,
  prestigeRoomCostMultiplier,
  prestigeSatisfactionFloorBonus,
  prestigeStaffEffectivenessBonus,
} from '../systems/prestige'
import {
  eventIncomeMultiplier,
  eventRoomCostMultiplier,
  eventSatisfactionBonus,
  isEventActive,
  type ActiveEvent,
} from '../systems/events'
import { createValidatedStorage, type PersistedState } from '../systems/saveLoad'
import { CURRENT_SAVE_VERSION, migrateSave } from '../systems/migrations'
import { computeRehydratedState } from '../systems/rehydration'
import { playAchievementSound, playPrestigeSound, playPurchaseSound } from '../audio/soundManager'
import { reportAchievementUnlocks } from '../../platform/playGames/achievementReporting'

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface OfflineEarningsSummary {
  incomeEarned: number
  elapsedSeconds: number
}

export interface UpgradeLevels {
  marketing: number
  staffTraining: number
  concierge: number
}

export interface GameState {
  cash: number
  totalEarned: number
  lifetimeEarned: number
  lastTickTimestamp: number

  locations: Record<string, HotelLocation>
  activeLocationId: string

  upgradeLevels: UpgradeLevels
  prestigePoints: number
  prestigeCount: number
  prestigeUpgradeLevels: Record<PrestigeUpgradeId, number>
  activeEvent: ActiveEvent | null
  eventsExperienced: number
  /** Seconds satisfaction has stayed >= HIGH_SATISFACTION_THRESHOLD, live-ticking only. Resets on drop below. */
  currentSatisfactionStreakSeconds: number
  bestSatisfactionStreakSeconds: number
  /** Live playtime only — offline catch-up deliberately does not count toward this. */
  totalPlaytimeSeconds: number

  unlockedAchievementIds: string[]
  muted: boolean
  qualityOverride: QualityOverride

  requestsFulfilledTotal: number
  /** Runtime-only, keyed by roomId — never persisted (ECS-adjacent, like a guest's phase). */
  activeGuestRequests: Record<string, { roomId: string; defId: string; expiresAt: number }>

  lastLoginDate: string | null
  loginStreakDays: number
  longestLoginStreakDays: number

  tutorialCompleted: boolean

  pendingOfflineEarnings: OfflineEarningsSummary | null
  dismissOfflineEarnings: () => void

  pendingDailyReward: { streakDay: number; cashAmount: number } | null
  dismissDailyReward: () => void

  pendingAchievements: AchievementDef[]
  dismissTopAchievement: () => void

  activeLocation: () => HotelLocation
  totalRoomCount: () => number
  totalRoomCountAllLocations: () => number
  roomCountsByType: () => Partial<Record<RoomTypeId, number>>
  staffCountByRole: (role: StaffRole) => number
  satisfaction: () => number

  nextRoomCost: (typeId: RoomTypeId) => number
  nextFloorCost: () => number
  nextStaffCost: (role: StaffRole) => number
  nextUpgradeCost: (id: UpgradeId) => number
  isLocationUnlocked: (themeId: LocationThemeId) => boolean
  prestigePreview: () => number
  /** Prestige points not yet spent on a permanent perk (prestigePoints itself never decreases). */
  availablePrestigePoints: () => number
  nextPrestigeUpgradeCost: (id: PrestigeUpgradeId) => number
  /** The lowest-index floor in the active location that's full and can still be widened, or null if none. */
  nextExpandableFloorIndex: () => number | null
  nextWingExpansionCost: (floorIndex: number) => number

  buyRoom: (typeId: RoomTypeId) => boolean
  buyFloor: () => boolean
  expandFloor: (floorIndex: number) => boolean
  hireStaff: (role: StaffRole) => boolean
  setRoomStatus: (roomId: string, status: RoomStatus) => void
  buyUpgrade: (id: UpgradeId) => boolean
  buyPrestigeUpgrade: (id: PrestigeUpgradeId) => boolean
  unlockLocation: (themeId: LocationThemeId) => boolean
  switchLocation: (locationId: string) => void
  prestige: () => boolean
  tickEconomy: (deltaSeconds: number) => void
  toggleMuted: () => void
  setQualityOverride: (value: QualityOverride) => void

  raiseGuestRequest: (roomId: string) => void
  expireGuestRequest: (roomId: string) => void
  fulfillGuestRequest: (roomId: string) => boolean

  completeTutorial: () => void
}

function makeStarterLocation(id: string): HotelLocation {
  return {
    id,
    themeId: LOCATION_THEMES[0].id,
    floors: [{ index: 0, roomIds: [], slotCount: ROOMS_PER_FLOOR }],
    rooms: {},
    staff: {},
  }
}

function globalIncomeMultiplier(state: GameState, event: ActiveEvent | null, now: number): number {
  return (
    upgradeIncomeMultiplier(state.upgradeLevels.marketing, state.upgradeLevels.staffTraining) *
    prestigeIncomeMultiplier(state.prestigePoints) *
    eventIncomeMultiplier(event, now)
  )
}

/**
 * The save-relevant subset of GameState, matching PersistedState exactly —
 * used both as the `persist` middleware's `partialize` and to build the
 * blob pushed to Google Play Games cloud save, so the two can't drift apart.
 */
export function toPersistedState(state: GameState): PersistedState {
  return {
    cash: state.cash,
    totalEarned: state.totalEarned,
    lifetimeEarned: state.lifetimeEarned,
    lastTickTimestamp: state.lastTickTimestamp,
    locations: state.locations,
    activeLocationId: state.activeLocationId,
    upgradeLevels: state.upgradeLevels,
    prestigePoints: state.prestigePoints,
    prestigeCount: state.prestigeCount,
    prestigeUpgradeLevels: state.prestigeUpgradeLevels,
    activeEvent: state.activeEvent,
    eventsExperienced: state.eventsExperienced,
    currentSatisfactionStreakSeconds: state.currentSatisfactionStreakSeconds,
    bestSatisfactionStreakSeconds: state.bestSatisfactionStreakSeconds,
    totalPlaytimeSeconds: state.totalPlaytimeSeconds,
    unlockedAchievementIds: state.unlockedAchievementIds,
    muted: state.muted,
    qualityOverride: state.qualityOverride,
    requestsFulfilledTotal: state.requestsFulfilledTotal,
    lastLoginDate: state.lastLoginDate,
    loginStreakDays: state.loginStreakDays,
    longestLoginStreakDays: state.longestLoginStreakDays,
    tutorialCompleted: state.tutorialCompleted,
  }
}

/**
 * Factory rather than a bare module-level store: production uses the single
 * `useGameStore` instance below, but tests can call this directly to get a
 * fresh, isolated store (own localStorage key, own initial state) instead of
 * sharing — and polluting — one global singleton across test cases.
 */
export const DEFAULT_SAVE_KEY = 'grand-stay-tycoon-save'

export function createGameStore(persistName: string = DEFAULT_SAVE_KEY): UseBoundStore<StoreApi<GameState>> {
  const starterLocationId = 'loc-starter'

  return create<GameState>()(
    persist(
      immer((set, get) => {
        function checkAchievements() {
          const state = get()
          const newly = getNewlyUnlockedAchievements(buildAchievementSnapshot(state), state.unlockedAchievementIds)
          if (newly.length === 0) return
          set((draft) => {
            for (const achievement of newly) {
              draft.unlockedAchievementIds.push(achievement.id)
              draft.pendingAchievements.push(achievement)
            }
          })
          playAchievementSound()
          reportAchievementUnlocks(newly)
        }

        return {
          cash: 25,
          totalEarned: 0,
          lifetimeEarned: 0,
          lastTickTimestamp: Date.now(),
          locations: { [starterLocationId]: makeStarterLocation(starterLocationId) },
          activeLocationId: starterLocationId,
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
          activeGuestRequests: {},
          lastLoginDate: null,
          loginStreakDays: 0,
          longestLoginStreakDays: 0,
          tutorialCompleted: false,
          pendingOfflineEarnings: null,
          pendingDailyReward: null,
          pendingAchievements: [],

          dismissOfflineEarnings: () =>
            set((state) => {
              state.pendingOfflineEarnings = null
            }),

          dismissDailyReward: () =>
            set((state) => {
              state.pendingDailyReward = null
            }),

          dismissTopAchievement: () =>
            set((state) => {
              state.pendingAchievements.shift()
            }),

          activeLocation: () => {
            const state = get()
            return state.locations[state.activeLocationId]
          },

          totalRoomCount: () => Object.keys(get().activeLocation().rooms).length,

          totalRoomCountAllLocations: () =>
            Object.values(get().locations).reduce((sum, l) => sum + Object.keys(l.rooms).length, 0),

          roomCountsByType: () => countByType(get().activeLocation().rooms),

          staffCountByRole: (role) => countByRole(get().activeLocation().staff, role),

          satisfaction: () => {
            const state = get()
            const conciergeBonus = upgradeSatisfactionBonus(state.upgradeLevels.concierge)
            const staffSynergyBonus = prestigeStaffEffectivenessBonus(state.prestigeUpgradeLevels.staffSynergy)
            const satisfactionFloorBonus = prestigeSatisfactionFloorBonus(
              state.prestigeUpgradeLevels.satisfactionFloor,
            )
            const eventBonus = eventSatisfactionBonus(state.activeEvent, Date.now())
            return locationSatisfaction(
              state.activeLocation(),
              conciergeBonus,
              staffSynergyBonus,
              satisfactionFloorBonus,
              eventBonus,
            )
          },

          nextRoomCost: (typeId) => {
            const state = get()
            const countOfType = countByType(state.activeLocation().rooms)[typeId] ?? 0
            const base = roomCost(typeId, countOfType)
            const prestigeMultiplier = prestigeRoomCostMultiplier(state.prestigeUpgradeLevels.cheaperRooms)
            const eventMultiplier = eventRoomCostMultiplier(state.activeEvent, Date.now())
            return Math.round(base * prestigeMultiplier * eventMultiplier)
          },

          nextFloorCost: () => floorCost(get().activeLocation().floors.length),

          nextStaffCost: (role) => staffCost(role, get().staffCountByRole(role)),

          nextUpgradeCost: (id) => upgradeCost(id, get().upgradeLevels[id]),

          isLocationUnlocked: (themeId) => Object.values(get().locations).some((l) => l.themeId === themeId),

          prestigePreview: () => prestigePointsForTotalEarned(get().totalEarned),

          availablePrestigePoints: () => {
            const state = get()
            let spent = 0
            for (const def of PRESTIGE_UPGRADES) {
              for (let level = 0; level < state.prestigeUpgradeLevels[def.id]; level++) {
                spent += prestigeUpgradeCost(def.id, level)
              }
            }
            return state.prestigePoints - spent
          },

          nextPrestigeUpgradeCost: (id) => prestigeUpgradeCost(id, get().prestigeUpgradeLevels[id]),

          nextExpandableFloorIndex: () => {
            const location = get().activeLocation()
            const candidate = location.floors.find(
              (f) => f.roomIds.length >= f.slotCount && !isFloorMaxWidth(f.slotCount),
            )
            return candidate ? candidate.index : null
          },

          nextWingExpansionCost: (floorIndex) => {
            const floor = get().activeLocation().floors.find((f) => f.index === floorIndex)
            if (!floor) return Infinity
            return wingExpansionCost(timesFloorExpanded(floor.slotCount))
          },

          buyRoom: (typeId) => {
            const state = get()
            const location = state.activeLocation()
            if (!isRoomTypeUnlocked(typeId, Object.keys(location.rooms).length)) return false
            const targetFloor = location.floors.find((f) => f.roomIds.length < f.slotCount)
            if (!targetFloor) return false
            const cost = state.nextRoomCost(typeId)
            if (state.cash < cost) return false

            const id = generateId('room')
            set((draft) => {
              draft.cash -= cost
              const loc = draft.locations[draft.activeLocationId]
              const floor = loc.floors.find((f) => f.index === targetFloor.index)!
              const slotIndex = floor.roomIds.length
              floor.roomIds.push(id)
              loc.rooms[id] = {
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
              const loc = draft.locations[draft.activeLocationId]
              loc.floors.push({ index: loc.floors.length, roomIds: [], slotCount: ROOMS_PER_FLOOR })
            })
            playPurchaseSound()
            checkAchievements()
            return true
          },

          expandFloor: (floorIndex) => {
            const state = get()
            const floor = state.activeLocation().floors.find((f) => f.index === floorIndex)
            if (!floor || isFloorMaxWidth(floor.slotCount)) return false
            const cost = state.nextWingExpansionCost(floorIndex)
            if (state.cash < cost) return false
            set((draft) => {
              draft.cash -= cost
              const targetFloor = draft.locations[draft.activeLocationId].floors.find((f) => f.index === floorIndex)!
              targetFloor.slotCount += WING_EXPANSION_SIZE
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
              draft.locations[draft.activeLocationId].staff[id] = { id, role, hiredAt: Date.now() }
            })
            playPurchaseSound()
            checkAchievements()
            return true
          },

          setRoomStatus: (roomId, status) =>
            set((draft) => {
              const room = draft.locations[draft.activeLocationId].rooms[roomId]
              if (room) room.status = status
            }),

          buyUpgrade: (id) => {
            const state = get()
            const currentLevel = state.upgradeLevels[id]
            if (isUpgradeMaxed(id, currentLevel)) return false
            const cost = upgradeCost(id, currentLevel)
            if (state.cash < cost) return false
            set((draft) => {
              draft.cash -= cost
              draft.upgradeLevels[id] += 1
            })
            playPurchaseSound()
            checkAchievements()
            return true
          },

          buyPrestigeUpgrade: (id) => {
            const state = get()
            const currentLevel = state.prestigeUpgradeLevels[id]
            if (isPrestigeUpgradeMaxed(id, currentLevel)) return false
            const cost = prestigeUpgradeCost(id, currentLevel)
            if (state.availablePrestigePoints() < cost) return false
            set((draft) => {
              draft.prestigeUpgradeLevels[id] += 1
            })
            playPurchaseSound()
            checkAchievements()
            return true
          },

          unlockLocation: (themeId) => {
            const state = get()
            if (state.isLocationUnlocked(themeId)) return false
            const themeDef = getLocationThemeDef(themeId)
            if (state.cash < themeDef.unlockCost) return false
            const id = generateId('loc')
            set((draft) => {
              draft.cash -= themeDef.unlockCost
              draft.locations[id] = {
                id,
                themeId,
                floors: [{ index: 0, roomIds: [], slotCount: ROOMS_PER_FLOOR }],
                rooms: {},
                staff: {},
              }
              draft.activeLocationId = id
            })
            playPurchaseSound()
            checkAchievements()
            return true
          },

          switchLocation: (locationId) =>
            set((draft) => {
              if (draft.locations[locationId]) draft.activeLocationId = locationId
            }),

          prestige: () => {
            const state = get()
            const pointsEarned = prestigePointsForTotalEarned(state.totalEarned)
            if (pointsEarned < 1) return false
            const newStarterId = generateId('loc')
            set((draft) => {
              draft.prestigePoints += pointsEarned
              draft.prestigeCount += 1
              // prestigeUpgradeLevels is deliberately NOT reset here — it's a
              // permanent perk shop, not a run-scoped upgrade like
              // upgradeLevels below. Resetting it would make every perk
              // one-shot, defeating the point of spending prestige points on it.
              draft.cash = 25 + prestigeHeadStartBonus(draft.prestigeUpgradeLevels.headStart)
              draft.totalEarned = 0
              draft.upgradeLevels = { marketing: 0, staffTraining: 0, concierge: 0 }
              draft.activeEvent = null
              draft.locations = { [newStarterId]: makeStarterLocation(newStarterId) }
              draft.activeLocationId = newStarterId
            })
            playPrestigeSound()
            checkAchievements()
            return true
          },

          tickEconomy: (deltaSeconds) => {
            const state = get()
            const now = Date.now()

            let activeEvent = state.activeEvent
            if (activeEvent && !isEventActive(activeEvent, now)) activeEvent = null
            let startedNewEvent = false
            if (!activeEvent && Math.random() < EVENT_SPAWN_CHANCE_PER_SEC * deltaSeconds) {
              const def = EVENTS[Math.floor(Math.random() * EVENTS.length)]
              activeEvent = { id: def.id, endsAt: now + def.durationSeconds * 1000 }
              startedNewEvent = true
            }

            const snapshots = buildLocationSnapshots(state, activeEvent, now)
            const multiplier = globalIncomeMultiplier(state, activeEvent, now)
            const { incomeEarned } = simulateEconomyAcrossLocations(snapshots, multiplier, deltaSeconds)

            // Active-location-only satisfaction streak (see achievementDefs.ts's
            // "five-star-streak") — a deliberate simplification vs. this
            // codebase's usual empire-wide achievement philosophy: a player
            // could dodge a struggling location by switching away from it,
            // but tracking every owned location every tick is more state and
            // more test surface than this milestone's scope warrants.
            const conciergeBonus = upgradeSatisfactionBonus(state.upgradeLevels.concierge)
            const staffSynergyBonus = prestigeStaffEffectivenessBonus(state.prestigeUpgradeLevels.staffSynergy)
            const satisfactionFloorBonus = prestigeSatisfactionFloorBonus(
              state.prestigeUpgradeLevels.satisfactionFloor,
            )
            const eventSatBonus = eventSatisfactionBonus(activeEvent, now)
            const activeSatisfaction = locationSatisfaction(
              state.activeLocation(),
              conciergeBonus,
              staffSynergyBonus,
              satisfactionFloorBonus,
              eventSatBonus,
            )

            set((draft) => {
              draft.cash += incomeEarned
              draft.totalEarned += incomeEarned
              draft.lifetimeEarned += incomeEarned
              draft.lastTickTimestamp = now
              draft.activeEvent = activeEvent
              // Live ticking only — offline catch-up (onRehydrateStorage) never
              // touches this, so leaving the tab open overnight isn't "playtime".
              draft.totalPlaytimeSeconds += deltaSeconds
              if (startedNewEvent) draft.eventsExperienced += 1
              if (activeSatisfaction >= HIGH_SATISFACTION_THRESHOLD) {
                draft.currentSatisfactionStreakSeconds += deltaSeconds
                if (draft.currentSatisfactionStreakSeconds > draft.bestSatisfactionStreakSeconds) {
                  draft.bestSatisfactionStreakSeconds = draft.currentSatisfactionStreakSeconds
                }
              } else {
                draft.currentSatisfactionStreakSeconds = 0
              }
            })
            checkAchievements()
          },

          toggleMuted: () =>
            set((draft) => {
              draft.muted = !draft.muted
            }),

          setQualityOverride: (value) =>
            set((draft) => {
              draft.qualityOverride = value
            }),

          raiseGuestRequest: (roomId) =>
            set((draft) => {
              if (draft.activeGuestRequests[roomId]) return
              const def = randomGuestRequestDef()
              draft.activeGuestRequests[roomId] = {
                roomId,
                defId: def.id,
                expiresAt: Date.now() + def.windowSeconds * 1000,
              }
            }),

          expireGuestRequest: (roomId) =>
            set((draft) => {
              delete draft.activeGuestRequests[roomId]
            }),

          fulfillGuestRequest: (roomId) => {
            const state = get()
            const request = state.activeGuestRequests[roomId]
            if (!request || request.expiresAt < Date.now()) return false
            const def = getGuestRequestDef(request.defId)
            set((draft) => {
              draft.cash += def.bonusCash
              draft.requestsFulfilledTotal += 1
              delete draft.activeGuestRequests[roomId]
            })
            checkAchievements()
            return true
          },

          completeTutorial: () =>
            set((draft) => {
              draft.tutorialCompleted = true
            }),
        }
      }),
      {
        name: persistName,
        version: CURRENT_SAVE_VERSION,
        migrate: migrateSave,
        storage: createValidatedStorage(),
        partialize: toPersistedState,
        onRehydrateStorage: () => (state) => {
          if (!state) return

          const result = computeRehydratedState(toPersistedState(state), Date.now())
          state.activeEvent = result.activeEvent
          state.lastTickTimestamp = result.lastTickTimestamp
          state.cash = result.cash
          state.totalEarned = result.totalEarned
          state.lifetimeEarned = result.lifetimeEarned
          if (result.pendingOfflineEarnings) {
            state.pendingOfflineEarnings = result.pendingOfflineEarnings
          }
          state.lastLoginDate = result.lastLoginDate
          state.loginStreakDays = result.loginStreakDays
          state.longestLoginStreakDays = result.longestLoginStreakDays
          if (result.pendingDailyReward) {
            state.pendingDailyReward = result.pendingDailyReward
          }
          if (result.newlyUnlockedAchievements.length > 0) {
            state.unlockedAchievementIds = result.unlockedAchievementIds
            state.pendingAchievements = [...state.pendingAchievements, ...result.newlyUnlockedAchievements]
            reportAchievementUnlocks(result.newlyUnlockedAchievements)
          }
        },
      },
    ),
  )
}

export const useGameStore = createGameStore()
