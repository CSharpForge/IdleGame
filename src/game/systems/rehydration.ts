import type { AchievementDef } from '../data/achievementDefs'
import { getNewlyUnlockedAchievements } from '../data/achievementDefs'
import { dailyRewardForStreakDay } from '../data/dailyRewardDefs'
import { buildAchievementSnapshot, buildLocationSnapshots } from './locationStats'
import { computeLoginStreak, utcDateKey } from './dailyRewards'
import { computeOfflineEarnings } from './offlineEarnings'
import { eventIncomeMultiplier, isEventActive, type ActiveEvent } from './events'
import { prestigeIncomeMultiplier } from './prestige'
import { upgradeIncomeMultiplier } from './upgrades'
import type { PersistedState } from './saveLoad'

export interface RehydrationResult {
  activeEvent: ActiveEvent | null
  lastTickTimestamp: number
  cash: number
  totalEarned: number
  lifetimeEarned: number
  pendingOfflineEarnings: { incomeEarned: number; elapsedSeconds: number } | null
  unlockedAchievementIds: string[]
  newlyUnlockedAchievements: AchievementDef[]
  lastLoginDate: string
  loginStreakDays: number
  longestLoginStreakDays: number
  pendingDailyReward: { streakDay: number; cashAmount: number } | null
}

/**
 * The pure logic behind loading a save: clears an expired timed event,
 * grants offline catch-up income, and re-checks achievements — all as of
 * `now`, without mutating anything. Shared by the live store's
 * `onRehydrateStorage` (loading the local save) and Play Games cloud-save
 * conflict resolution (evaluating a candidate cloud save without touching
 * the live store), so both paths stay consistent with exactly one
 * implementation of "what does loading this save produce right now."
 */
export function computeRehydratedState(saved: PersistedState, now: number = Date.now()): RehydrationResult {
  let activeEvent = saved.activeEvent
  if (activeEvent && !isEventActive(activeEvent, now)) activeEvent = null

  const snapshots = buildLocationSnapshots(saved, activeEvent, now)
  const multiplier =
    upgradeIncomeMultiplier(saved.upgradeLevels.marketing, saved.upgradeLevels.staffTraining) *
    prestigeIncomeMultiplier(saved.prestigePoints) *
    eventIncomeMultiplier(activeEvent, now)

  const { incomeEarned, elapsedSeconds } = computeOfflineEarnings(snapshots, multiplier, saved.lastTickTimestamp, now)

  let cash = saved.cash
  let totalEarned = saved.totalEarned
  let lifetimeEarned = saved.lifetimeEarned
  let pendingOfflineEarnings: RehydrationResult['pendingOfflineEarnings'] = null
  if (incomeEarned > 0 && elapsedSeconds > 5) {
    cash += incomeEarned
    totalEarned += incomeEarned
    lifetimeEarned += incomeEarned
    pendingOfflineEarnings = { incomeEarned, elapsedSeconds }
  }

  // Daily login streak: same treatment as offline earnings above — the
  // reward is granted immediately (folded into cash/totalEarned/
  // lifetimeEarned right here), and `pendingDailyReward` is purely a flag
  // telling the UI to announce what was already applied, not a gate the UI
  // has to "claim" through separately.
  const loginStreak = computeLoginStreak(saved.lastLoginDate, saved.loginStreakDays, now)
  let lastLoginDate = saved.lastLoginDate ?? utcDateKey(now)
  let loginStreakDays = saved.loginStreakDays
  let longestLoginStreakDays = saved.longestLoginStreakDays
  let pendingDailyReward: RehydrationResult['pendingDailyReward'] = null

  if (loginStreak.isNewDay) {
    lastLoginDate = utcDateKey(now)
    loginStreakDays = loginStreak.newStreakDay
    if (loginStreakDays > longestLoginStreakDays) longestLoginStreakDays = loginStreakDays

    // Only grant/announce a reward for a *returning* player. A brand-new
    // save (saved.lastLoginDate still null) silently starts the streak at
    // day 1 instead of popping a reward modal on top of the first-run
    // tutorial during someone's very first session.
    if (saved.lastLoginDate !== null) {
      const reward = dailyRewardForStreakDay(loginStreakDays)
      cash += reward.cashAmount
      totalEarned += reward.cashAmount
      lifetimeEarned += reward.cashAmount
      pendingDailyReward = { streakDay: loginStreakDays, cashAmount: reward.cashAmount }
    }
  }

  const newlyUnlockedAchievements = getNewlyUnlockedAchievements(
    buildAchievementSnapshot({ ...saved, lifetimeEarned, longestLoginStreakDays }),
    saved.unlockedAchievementIds,
  )
  const unlockedAchievementIds =
    newlyUnlockedAchievements.length > 0
      ? [...saved.unlockedAchievementIds, ...newlyUnlockedAchievements.map((a) => a.id)]
      : saved.unlockedAchievementIds

  return {
    activeEvent,
    lastTickTimestamp: now,
    cash,
    totalEarned,
    lifetimeEarned,
    pendingOfflineEarnings,
    unlockedAchievementIds,
    newlyUnlockedAchievements,
    lastLoginDate,
    loginStreakDays,
    longestLoginStreakDays,
    pendingDailyReward,
  }
}
