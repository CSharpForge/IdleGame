import { simulateEconomy } from './economyTick'

const MAX_OFFLINE_SECONDS = 24 * 60 * 60

export interface OfflineEarningsResult {
  incomeEarned: number
  elapsedSeconds: number
}

export function computeOfflineEarnings(
  totalRooms: number,
  lastTickTimestamp: number,
  now: number = Date.now(),
): OfflineEarningsResult {
  const rawElapsedSeconds = Math.max(0, (now - lastTickTimestamp) / 1000)
  const elapsedSeconds = Math.min(rawElapsedSeconds, MAX_OFFLINE_SECONDS)
  const { incomeEarned } = simulateEconomy({ totalRooms }, elapsedSeconds)
  return { incomeEarned, elapsedSeconds }
}
