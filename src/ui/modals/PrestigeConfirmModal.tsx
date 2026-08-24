import { useGameStore } from '../../game/state/store'

export function PrestigeConfirmModal({ onClose }: { onClose: () => void }) {
  const preview = useGameStore((s) => s.prestigePreview())
  const prestigePoints = useGameStore((s) => s.prestigePoints)
  const prestige = useGameStore((s) => s.prestige)

  const canPrestige = preview >= 1

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '18px',
          padding: '28px 24px',
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '40px' }}>✨</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: '20px' }}>Prestige?</h2>
        <p style={{ color: '#666', margin: '0 0 16px', fontSize: '14px' }}>
          Resets cash, rooms, floors, staff, and upgrades on every location back to the start — in exchange for a
          permanent income boost that never goes away, even after future resets.
        </p>
        <div style={{ fontSize: '15px', marginBottom: '4px' }}>
          Current prestige points: <strong>{prestigePoints}</strong>
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#9b5de5', marginBottom: '20px' }}>
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
            background: canPrestige ? '#9b5de5' : '#ccc',
            color: '#fff',
            fontWeight: 700,
            fontSize: '16px',
            padding: '12px 24px',
            borderRadius: '12px',
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
            color: '#666',
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
