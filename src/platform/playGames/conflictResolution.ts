import { computeRehydratedState, type RehydrationResult } from '../../game/systems/rehydration'
import type { PersistedState } from '../../game/systems/saveLoad'

export interface ConflictResolution {
  winner: 'local' | 'cloud'
  localResult: RehydrationResult
  cloudResult: RehydrationResult | null
}

/**
 * Decides which save wins when a local save and a cloud (Play Games
 * Saved Games) snapshot disagree. Compares `lifetimeEarned`, NOT
 * `lastTickTimestamp` — rehydration always stamps lastTickTimestamp to
 * "now" (see computeRehydratedState), so local's timestamp is always
 * freshest by construction and would win almost every comparison,
 * including the fresh-install case where a brand-new local save should
 * lose to a real cloud save with progress. lifetimeEarned is monotonically
 * non-decreasing (prestige never resets it), so it doesn't have that bias
 * and naturally handles "fresh install restores from cloud" as a special
 * case (a fresh local save has lifetimeEarned === 0).
 *
 * Both sides are run through computeRehydratedState first (bringing each
 * fully "current" as of `now`) before comparing — otherwise a cloud
 * snapshot that's merely stale by days would be compared unfairly against
 * an up-to-date local save. Ties keep local, to avoid unnecessary churn.
 * Whole-state replace only, never a field-level merge.
 */
export function resolveConflict(
  local: PersistedState,
  cloud: PersistedState | null,
  now: number = Date.now(),
): ConflictResolution {
  const localResult = computeRehydratedState(local, now)
  if (!cloud) {
    return { winner: 'local', localResult, cloudResult: null }
  }

  const cloudResult = computeRehydratedState(cloud, now)
  const winner = cloudResult.lifetimeEarned > localResult.lifetimeEarned ? 'cloud' : 'local'
  return { winner, localResult, cloudResult }
}
