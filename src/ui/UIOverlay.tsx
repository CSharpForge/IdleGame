import { CurrencyDisplay } from './hud/CurrencyDisplay'
import { MuteToggle } from './hud/MuteToggle'
import { SatisfactionBadge } from './hud/SatisfactionBadge'
import { PrestigeButton } from './hud/PrestigeButton'
import { EventBanner } from './hud/EventBanner'
import { ShopPanel } from './panels/ShopPanel'
import { OfflineEarningsModal } from './modals/OfflineEarningsModal'
import { AchievementToast } from './modals/AchievementToast'

export function UIOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      <CurrencyDisplay />
      <SatisfactionBadge />
      <PrestigeButton />
      <EventBanner />
      <MuteToggle />
      <ShopPanel />
      <OfflineEarningsModal />
      <AchievementToast />
    </div>
  )
}
