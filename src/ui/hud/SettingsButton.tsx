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
          flexShrink: 0,
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
