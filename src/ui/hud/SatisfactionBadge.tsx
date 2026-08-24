import { useGameStore } from '../../game/state/store'
import { hudPillBg, radii } from '../theme'

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
        pointerEvents: 'auto',
        background: hudPillBg,
        color: '#fff',
        padding: '8px 14px',
        borderRadius: radii.md,
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
