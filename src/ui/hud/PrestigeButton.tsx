import { useState } from 'react'
import { useGameStore } from '../../game/state/store'
import { PrestigeConfirmModal } from '../modals/PrestigeConfirmModal'
import { colors, hudPillBgDim, radii } from '../theme'

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
          pointerEvents: 'auto',
          background: preview >= 1 ? colors.purple : hudPillBgDim,
          color: '#fff',
          border: 'none',
          padding: '8px 14px',
          borderRadius: radii.md,
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
