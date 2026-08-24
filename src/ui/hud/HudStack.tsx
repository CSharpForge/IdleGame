import { CurrencyDisplay } from './CurrencyDisplay'
import { SatisfactionBadge } from './SatisfactionBadge'
import { PrestigeButton } from './PrestigeButton'
import { EventBanner } from './EventBanner'
import { AchievementToast } from '../modals/AchievementToast'

/**
 * Stacks the top-left HUD pills with a real flex `gap` instead of each pill
 * hardcoding its own `top` offset relative to its siblings — a pill that
 * conditionally self-hides (PrestigeButton) just collapses its slot instead
 * of leaving a gap or requiring every other offset to be recomputed.
 */
export function TopLeftHudStack() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(12px, env(safe-area-inset-top))',
        left: 'max(12px, env(safe-area-inset-left))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      <CurrencyDisplay />
      <SatisfactionBadge />
      <PrestigeButton />
    </div>
  )
}

export function TopCenterHudStack() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(12px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      <EventBanner />
      <AchievementToast />
    </div>
  )
}
