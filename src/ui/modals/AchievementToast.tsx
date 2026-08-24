import { useGameStore } from '../../game/state/store'

export function AchievementToast() {
  const achievement = useGameStore((s) => s.pendingAchievements[0])
  const dismiss = useGameStore((s) => s.dismissTopAchievement)

  if (!achievement) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(64px, calc(env(safe-area-inset-top) + 52px))',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        background: '#2b2d42',
        color: '#fff',
        borderRadius: '14px',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
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
