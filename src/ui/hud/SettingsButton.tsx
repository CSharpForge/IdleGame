import { useState } from 'react'
import { SettingsModal } from '../modals/SettingsModal'
import { hudPillBg, radii } from '../theme'

export function SettingsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          top: 'max(12px, env(safe-area-inset-top))',
          right: 'max(12px, env(safe-area-inset-right))',
          pointerEvents: 'auto',
          background: hudPillBg,
          color: '#fff',
          border: 'none',
          width: '44px',
          height: '44px',
          borderRadius: radii.md,
          fontSize: '20px',
        }}
      >
        ⚙️
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  )
}
