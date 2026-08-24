import { CurrencyDisplay } from './hud/CurrencyDisplay'
import { MuteToggle } from './hud/MuteToggle'
import { SatisfactionBadge } from './hud/SatisfactionBadge'
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
      <MuteToggle />
      <ShopPanel />
      <OfflineEarningsModal />
      <AchievementToast />
    </div>
  )
}
