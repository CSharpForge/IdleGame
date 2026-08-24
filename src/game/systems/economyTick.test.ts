import { describe, expect, it } from 'vitest'
import { simulateEconomy } from './economyTick'

describe('simulateEconomy', () => {
  it('earns nothing with zero rooms', () => {
    expect(simulateEconomy({ totalRooms: 0 }, 10).incomeEarned).toBe(0)
  })

  it('earns nothing for zero or negative delta', () => {
    expect(simulateEconomy({ totalRooms: 5 }, 0).incomeEarned).toBe(0)
    expect(simulateEconomy({ totalRooms: 5 }, -1).incomeEarned).toBe(0)
  })

  it('is linear in delta: N small ticks sum to one big tick', () => {
    const totalRooms = 7
    const bigTick = simulateEconomy({ totalRooms }, 10).incomeEarned

    let summed = 0
    for (let i = 0; i < 100; i++) {
      summed += simulateEconomy({ totalRooms }, 0.1).incomeEarned
    }

    expect(summed).toBeCloseTo(bigTick, 10)
  })

  it('scales linearly with room count', () => {
    const oneRoom = simulateEconomy({ totalRooms: 1 }, 5).incomeEarned
    const tenRooms = simulateEconomy({ totalRooms: 10 }, 5).incomeEarned
    expect(tenRooms).toBeCloseTo(oneRoom * 10, 10)
  })

  it('never returns negative or NaN income', () => {
    for (const rooms of [0, 1, 50, 1000]) {
      for (const delta of [0, 0.01, 1, 3600]) {
        const { incomeEarned } = simulateEconomy({ totalRooms: rooms }, delta)
        expect(incomeEarned).toBeGreaterThanOrEqual(0)
        expect(Number.isNaN(incomeEarned)).toBe(false)
      }
    }
  })
})
