import { CurrencyDisplay } from './hud/CurrencyDisplay'
import { MuteToggle } from './hud/MuteToggle'
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
      <CurrencyDisplay />
      <MuteToggle />
      <ShopPanel />
      <OfflineEarningsModal />
    </div>
  )
}
