import { useState } from 'react'
import { useGameStore } from '../../game/state/store'
import { PrestigeConfirmModal } from '../modals/PrestigeConfirmModal'

export function PrestigeButton() {
  const [open, setOpen] = useState(false)
  const preview = useGameStore((s) => s.prestigePreview())
  const prestigeCount = useGameStore((s) => s.prestigeCount)

  if (preview < 1 && prestigeCount === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          top: 'max(112px, calc(env(safe-area-inset-top) + 100px))',
          left: '12px',
          pointerEvents: 'auto',
          background: preview >= 1 ? '#9b5de5' : 'rgba(0,0,0,0.4)',
          color: '#fff',
          border: 'none',
          padding: '8px 14px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 700,
        }}
      >
        ✨ Prestige{preview >= 1 ? ` (+${preview})` : ''}
      </button>
      {open && <PrestigeConfirmModal onClose={() => setOpen(false)} />}
    </>
  )
}
