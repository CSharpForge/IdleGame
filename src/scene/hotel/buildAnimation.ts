import { useSpring } from '@react-spring/three'

export const SESSION_START = Date.now()

/**
 * Plays once when the owning component mounts — used so a newly purchased
 * room/floor pops into place with a spring bounce instead of appearing
 * instantly. Each Room/Floor component is keyed by its id, so React mounts
 * a fresh instance exactly when it's bought, which is what triggers this.
 * Rooms restored from a save (builtAt before this session started) skip
 * the animation and render already in place.
 */
export function useBuildPopIn(builtAt: number) {
  const isFreshBuild = builtAt >= SESSION_START
  return useSpring({
    from: { scale: isFreshBuild ? 0 : 1 },
    to: { scale: 1 },
    config: { tension: 220, friction: 14 },
  })
}
