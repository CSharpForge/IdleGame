import { getGuestRequestDef } from '../../game/data/guestRequestDefs'
import { useGameStore } from '../../game/state/store'
import { colors, radii, shadows } from '../theme'

// A 2D HUD tray rather than a 3D tap target on the room itself — avoids
// raycasting/touch-precision problems for a small target on a perspective
// 3D scene, especially on a phone. Mirrors EventBanner/AchievementToast's
// pill styling.
export function GuestRequestTray() {
  const activeGuestRequests = useGameStore((s) => s.activeGuestRequests)
  const fulfillGuestRequest = useGameStore((s) => s.fulfillGuestRequest)
  const entries = Object.values(activeGuestRequests)

  if (entries.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '100%' }}>
      {entries.map((request) => {
        const def = getGuestRequestDef(request.defId)
        return (
          <button
            key={request.roomId}
            onClick={() => fulfillGuestRequest(request.roomId)}
            style={{
              pointerEvents: 'auto',
              border: 'none',
              background: colors.primary,
              color: '#fff',
              borderRadius: radii.md,
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: shadows.banner,
              maxWidth: '100%',
            }}
          >
            <span>
              {def.icon} {def.label}
            </span>
            <span style={{ fontWeight: 500, opacity: 0.9 }}>+${def.bonusCash}</span>
          </button>
        )
      })}
    </div>
  )
}
