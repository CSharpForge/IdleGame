export interface DailyRewardDef {
  /** 1-based position within the repeating cycle. */
  day: number
  cashAmount: number
}

const DAILY_REWARD_CYCLE_LENGTH = 7

export const DAILY_REWARDS: DailyRewardDef[] = [
  { day: 1, cashAmount: 20 },
  { day: 2, cashAmount: 35 },
  { day: 3, cashAmount: 55 },
  { day: 4, cashAmount: 80 },
  { day: 5, cashAmount: 110 },
  { day: 6, cashAmount: 150 },
  { day: 7, cashAmount: 250 },
]

/** Wraps any streak day (8, 15, ...) back onto the fixed 7-day cycle above. */
export function dailyRewardForStreakDay(streakDay: number): DailyRewardDef {
  const cyclePosition = ((streakDay - 1) % DAILY_REWARD_CYCLE_LENGTH) + 1
  const def = DAILY_REWARDS.find((r) => r.day === cyclePosition)
  if (!def) throw new Error(`No daily reward defined for cycle position ${cyclePosition}`)
  return def
}
