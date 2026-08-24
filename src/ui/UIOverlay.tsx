import { TopHudRow } from './hud/HudStack'
import { ShopPanel } from './panels/ShopPanel'
import { OfflineEarningsModal } from './modals/OfflineEarningsModal'
import { DailyRewardModal } from './modals/DailyRewardModal'
import { TutorialOverlay } from './modals/TutorialOverlay'

export function UIOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      <TopHudRow />
      <ShopPanel />
      <OfflineEarningsModal />
      <DailyRewardModal />
      {/* Listed last so it paints on top of (and intercepts input ahead of)
          the other modals in the rare case a brand-new save's guarantees
          don't hold — see DailyRewardModal's own guard for the normal case. */}
      <TutorialOverlay />
    </div>
  )
}
