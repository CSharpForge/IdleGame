import { useState } from 'react'
import { DEFAULT_SAVE_KEY, useGameStore } from '../../game/state/store'
import { resetCamera } from '../../scene/cameraControls'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const muted = useGameStore((s) => s.muted)
  const toggleMuted = useGameStore((s) => s.toggleMuted)
  const [confirmingReset, setConfirmingReset] = useState(false)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '18px',
          padding: '24px',
          maxWidth: '340px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: '20px', textAlign: 'center' }}>⚙️ Settings</h2>

        <button
          onClick={toggleMuted}
          style={{
            width: '100%',
            border: 'none',
            background: '#3d5a80',
            color: '#fff',
            fontWeight: 700,
            fontSize: '15px',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '10px',
          }}
        >
          {muted ? '🔇 Sound: Off' : '🔊 Sound: On'}
        </button>

        <button
          onClick={() => {
            resetCamera()
            onClose()
          }}
          style={{
            width: '100%',
            border: 'none',
            background: '#4d908e',
            color: '#fff',
            fontWeight: 700,
            fontSize: '15px',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '10px',
          }}
        >
          🎥 Reset Camera
        </button>

        {!confirmingReset ? (
          <button
            onClick={() => setConfirmingReset(true)}
            style={{
              width: '100%',
              border: 'none',
              background: '#e07a5f',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '10px',
            }}
          >
            🗑️ Reset Save
          </button>
        ) : (
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', margin: '0 0 8px' }}>
              This permanently erases all progress. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  localStorage.removeItem(DEFAULT_SAVE_KEY)
                  window.location.reload()
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  background: '#c1121f',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '10px',
                  borderRadius: '12px',
                }}
              >
                Yes, erase it
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: '#ccc',
                  color: '#333',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '10px',
                  borderRadius: '12px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: '#666',
            fontSize: '14px',
            padding: '8px',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
