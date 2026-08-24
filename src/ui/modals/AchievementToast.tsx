import { useGameStore } from '../../game/state/store'
import { radii, shadows } from '../theme'

export function AchievementToast() {
  const achievement = useGameStore((s) => s.pendingAchievements[0])
  const dismiss = useGameStore((s) => s.dismissTopAchievement)

  if (!achievement) return null

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: '#2b2d42',
        color: '#fff',
        borderRadius: radii.lg,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: shadows.toast,
        cursor: 'pointer',
        maxWidth: '90vw',
      }}
      onClick={dismiss}
    >
      <span style={{ fontSize: '24px' }}>🏆</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px' }}>{achievement.label}</div>
        <div style={{ fontSize: '12px', opacity: 0.85 }}>{achievement.description}</div>
      </div>
    </div>
  )
}
