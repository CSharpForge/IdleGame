import { useState } from 'react'
import { SettingsModal } from '../modals/SettingsModal'

export function SettingsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
        ⚙️
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  )
}
