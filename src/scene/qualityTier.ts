import { createContext, useContext } from 'react'
import type { QualityTier } from './materials/rendererCapabilities'

// Falls back to the high tier so any consumer rendered outside a provider
// (shouldn't happen — Scene.tsx always provides one — but tests/Storybook-
// style isolation might) fails open rather than silently degrading quality.
const DEFAULT_TIER: QualityTier = {
  shadowsEnabled: true,
  shadowMapSize: [1024, 1024],
  maxConcurrentGuests: 40,
  outlineEnabled: true,
  maxDecorProps: 10,
  weatherParticleCount: 60,
}

export const QualityTierContext = createContext<QualityTier>(DEFAULT_TIER)

export function useQualityTier(): QualityTier {
  return useContext(QualityTierContext)
}
