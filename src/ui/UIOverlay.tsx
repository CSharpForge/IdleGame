import { TopHudRow } from './hud/HudStack'
import { ShopPanel } from './panels/ShopPanel'
import { OfflineEarningsModal } from './modals/OfflineEarningsModal'

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
    </div>
  )
}
