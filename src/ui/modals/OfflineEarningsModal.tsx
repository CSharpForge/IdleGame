import { useGameStore } from '../../game/state/store'
import { formatNumber } from '../../utils/formatNumber'

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
      >
        <div style={{ fontSize: '40px' }}>🌙</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: '20px' }}>While you were away...</h2>
        <p style={{ color: '#666', margin: '0 0 16px' }}>
          Away for {formatDuration(summary.elapsedSeconds)}
        </p>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#f2a65a', marginBottom: '20px' }}>
          +${formatNumber(summary.incomeEarned)}
        </div>
        <button
          onClick={dismiss}
          style={{
            border: 'none',
            background: '#3d5a80',
            color: '#fff',
            fontWeight: 700,
            fontSize: '16px',
            padding: '12px 24px',
            borderRadius: '12px',
            width: '100%',
          }}
        >
          Collect
        </button>
      </div>
    </div>
  )
}
