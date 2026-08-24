import { useGameStore } from '../../game/state/store'

export function MuteToggle() {
  const muted = useGameStore((s) => s.muted)
  const toggleMuted = useGameStore((s) => s.toggleMuted)

  return (
    <button
      onClick={toggleMuted}
      style={{
        position: 'absolute',
        top: 'max(12px, env(safe-area-inset-top))',
        right: '12px',
        pointerEvents: 'auto',
        background: 'rgba(0, 0, 0, 0.55)',
        color: '#fff',
        border: 'none',
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        fontSize: '20px',
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
