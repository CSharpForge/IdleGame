import { useGameStore } from '../../game/state/store'

function faceForSatisfaction(satisfaction: number): string {
  if (satisfaction >= 0.9) return '😄'
  if (satisfaction >= 0.7) return '🙂'
  if (satisfaction >= 0.5) return '😐'
  return '😞'
}

export function SatisfactionBadge() {
  const satisfaction = useGameStore((s) => s.satisfaction())

  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(64px, calc(env(safe-area-inset-top) + 52px))',
        left: '12px',
        pointerEvents: 'auto',
        background: 'rgba(0, 0, 0, 0.55)',
        color: '#fff',
        padding: '8px 14px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span>{faceForSatisfaction(satisfaction)}</span>
      <span>{Math.round(satisfaction * 100)}% happy</span>
    </div>
  )
}
