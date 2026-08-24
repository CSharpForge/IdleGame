import type { ReactNode } from 'react'
import type { QualityTier } from './materials/rendererCapabilities'
import { QualityTierContext } from './qualityTier'

export function QualityTierProvider({ tier, children }: { tier: QualityTier; children: ReactNode }) {
  return <QualityTierContext.Provider value={tier}>{children}</QualityTierContext.Provider>
}
