import { useEffect } from 'react'
import { useGameStore } from '../state/store'

const TICK_SECONDS = 0.75

/**
 * Drives the live economy tick on a plain interval, independent of the
 * render loop, so income keeps accruing even if 3D rendering stalls or the
 * tab is backgrounded. Offline catch-up (see offlineEarnings.ts) uses the
 * same simulateEconomy function for the gap between ticks.
 */
export function useEconomyLoop() {
  useEffect(() => {
    const id = setInterval(() => {
      useGameStore.getState().tickEconomy(TICK_SECONDS)
    }, TICK_SECONDS * 1000)
    return () => clearInterval(id)
  }, [])
}
