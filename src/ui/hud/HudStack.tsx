import { CurrencyDisplay } from './CurrencyDisplay'
import { SatisfactionBadge } from './SatisfactionBadge'
import { PrestigeButton } from './PrestigeButton'
import { EventBanner } from './EventBanner'
import { AchievementToast } from '../modals/AchievementToast'
import { GuestRequestTray } from './GuestRequestTray'
import { SettingsButton } from './SettingsButton'

function LeftZone() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
      <CurrencyDisplay />
      <SatisfactionBadge />
      <PrestigeButton />
    </div>
  )
}

/**
 * `flex: 1; minWidth: 0` gives this zone exactly the space left over between
 * the left stack and the settings button — never more — so a wide event
 * banner or achievement toast is structurally bounded by real layout and
 * can't visually overlap the corners, regardless of how wide its content
 * gets. `minWidth: 0` is what lets it actually shrink below its content's
 * natural width instead of overflowing; EventBanner/AchievementToast cap
 * their own width at 100% of this zone to wrap rather than spill over.
 */
function CenterZone() {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <EventBanner />
      <AchievementToast />
      <GuestRequestTray />
    </div>
  )
}

/**
 * The entire top HUD as one real flex row (left stack / flexible center
 * zone / settings button) instead of three independently absolutely-
 * positioned pieces — that's what guarantees the center zone can never
 * overlap the corners, and what let the vertically-stacked pills within
 * each zone drop their own hardcoded `top` offsets in favor of `gap`.
 */
export function TopHudRow() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(12px, env(safe-area-inset-top))',
        left: 'max(12px, env(safe-area-inset-left))',
        right: 'max(12px, env(safe-area-inset-right))',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      <LeftZone />
      <CenterZone />
      <SettingsButton />
    </div>
  )
}
