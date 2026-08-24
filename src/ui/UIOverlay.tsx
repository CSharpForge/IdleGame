import { SettingsButton } from './hud/SettingsButton'
import { TopCenterHudStack, TopLeftHudStack } from './hud/HudStack'
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
      <TopLeftHudStack />
      <TopCenterHudStack />
      <SettingsButton />
      <ShopPanel />
      <OfflineEarningsModal />
    </div>
  )
}
