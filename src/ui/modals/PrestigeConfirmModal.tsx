import { useGameStore } from '../../game/state/store'
import { colors, modalBackdropStyle, modalCardShellStyle, radii } from '../theme'

export function PrestigeConfirmModal({ onClose }: { onClose: () => void }) {
  const preview = useGameStore((s) => s.prestigePreview())
  const prestigePoints = useGameStore((s) => s.prestigePoints)
  const prestige = useGameStore((s) => s.prestige)

  const canPrestige = preview >= 1

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div
        style={modalCardShellStyle({ padding: '28px 24px', textAlign: 'center' })}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '40px' }}>✨</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: '20px' }}>Prestige?</h2>
        <p style={{ color: colors.textMuted, margin: '0 0 16px', fontSize: '14px' }}>
          Resets cash, rooms, floors, staff, and upgrades on every location back to the start — in exchange for a
          permanent income boost that never goes away, even after future resets.
        </p>
        <div style={{ fontSize: '15px', marginBottom: '4px' }}>
          Current prestige points: <strong>{prestigePoints}</strong>
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: colors.purple, marginBottom: '20px' }}>
          {canPrestige ? `+${preview} points` : 'Not enough earned yet'}
        </div>
        <button
          onClick={() => {
            if (canPrestige) prestige()
            onClose()
          }}
          disabled={!canPrestige}
          style={{
            border: 'none',
            background: canPrestige ? colors.purple : '#ccc',
            color: '#fff',
            fontWeight: 700,
            fontSize: '16px',
            padding: '12px 24px',
            borderRadius: radii.md,
            width: '100%',
            marginBottom: '8px',
          }}
        >
          {canPrestige ? 'Confirm Prestige' : 'Earn more first'}
        </button>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: colors.textMuted,
            fontSize: '14px',
            padding: '8px',
            width: '100%',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
