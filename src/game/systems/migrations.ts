export const CURRENT_SAVE_VERSION = 1

/**
 * Applied by zustand's `persist` middleware when a save's version is older
 * than CURRENT_SAVE_VERSION. Add one `if (version < N) { ...transform... }`
 * block per version bump — each block upgrades from the previous shape.
 */
export function migrateSave(persistedState: unknown, _version: number): unknown {
  return persistedState
}
