/**
 * A small, fast, deterministic PRNG (mulberry32) — used wherever scattered
 * scene content (decor prop positions, weather particle starting points)
 * needs to look randomly placed but stay stable across re-renders instead
 * of re-rolling (and visually jumping) every time React re-renders the
 * owning component.
 */
export function mulberry32(seed: number): () => number {
  let a = seed
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
