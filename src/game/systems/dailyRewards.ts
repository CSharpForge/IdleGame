const MS_PER_DAY = 24 * 60 * 60 * 1000

/** UTC calendar-day key (e.g. "2026-08-24") — avoids local-timezone/DST edge cases entirely. */
export function utcDateKey(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 10)
}

export interface LoginStreakResult {
  /** Whether `now` falls on a different UTC calendar day than `lastLoginDate`. */
  isNewDay: boolean
  /** The streak day the player would be on if they claim right now. */
  newStreakDay: number
  /** False when a day was missed (or this is the very first login), resetting the streak to 1. */
  streakContinued: boolean
}

/**
 * Pure function of (last claimed day, current streak, now) — no side effects,
 * no reads of live state, so it's trivially testable and reusable from both
 * rehydration (compute what a claim would be, without committing it) and the
 * store action that actually commits it on claim.
 */
export function computeLoginStreak(
  lastLoginDate: string | null,
  currentStreak: number,
  now: number,
): LoginStreakResult {
  const todayKey = utcDateKey(now)
  if (lastLoginDate === todayKey) {
    return { isNewDay: false, newStreakDay: currentStreak, streakContinued: true }
  }

  const yesterdayKey = utcDateKey(now - MS_PER_DAY)
  if (lastLoginDate === yesterdayKey) {
    return { isNewDay: true, newStreakDay: currentStreak + 1, streakContinued: true }
  }

  return { isNewDay: true, newStreakDay: 1, streakContinued: false }
}
