import { useGameStore } from '../../game/state/store'
import { formatNumber } from '../../utils/formatNumber'
import { colors, modalBackdropStyle, modalCardShellStyle, radii } from '../theme'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${Math.floor(seconds)}s`
}

export function OfflineEarningsModal() {
  const summary = useGameStore((s) => s.pendingOfflineEarnings)
  const dismiss = useGameStore((s) => s.dismissOfflineEarnings)

  if (!summary) return null

  return (
    <div style={modalBackdropStyle}>
      <div style={modalCardShellStyle({ padding: '28px 24px', textAlign: 'center' })}>
        <div style={{ fontSize: '40px' }}>🌙</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: '20px' }}>While you were away...</h2>
        <p style={{ color: colors.textMuted, margin: '0 0 16px' }}>
          Away for {formatDuration(summary.elapsedSeconds)}
        </p>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#f2a65a', marginBottom: '20px' }}>
          +${formatNumber(summary.incomeEarned)}
        </div>
        <button
          onClick={dismiss}
          style={{
            border: 'none',
            background: colors.primary,
            color: '#fff',
            fontWeight: 700,
            fontSize: '16px',
            padding: '12px 24px',
            borderRadius: radii.md,
            width: '100%',
          }}
        >
          Collect
        </button>
      </div>
    </div>
  )
}
