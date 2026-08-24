import { useGameStore } from '../../game/state/store'
import { colors, modalBackdropStyle, modalCardShellStyle, radii } from '../theme'

export function DailyRewardModal() {
  const reward = useGameStore((s) => s.pendingDailyReward)
  const dismiss = useGameStore((s) => s.dismissDailyReward)
  // Deliberately waits behind the offline-earnings modal rather than
  // stacking a second full-screen backdrop on top of it — reopening after a
  // multi-day gap can trigger both at once (offline catch-up AND a login
  // streak reward). Once the offline modal is dismissed, this re-renders
  // and takes its turn.
  const offlineEarningsPending = useGameStore((s) => s.pendingOfflineEarnings !== null)

  if (!reward || offlineEarningsPending) return null

  return (
    <div style={modalBackdropStyle}>
      <div style={modalCardShellStyle({ padding: '28px 24px', textAlign: 'center' })}>
        <div style={{ fontSize: '40px' }}>🎁</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: '20px' }}>Day {reward.streakDay} Login Bonus!</h2>
        <p style={{ color: colors.textMuted, margin: '0 0 16px' }}>Come back tomorrow to keep the streak going.</p>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#f2a65a', marginBottom: '20px' }}>
          +${reward.cashAmount}
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
