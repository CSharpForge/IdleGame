import { Capacitor } from '@capacitor/core'
import { useState, type CSSProperties } from 'react'
import { freshDefaultState } from '../../game/systems/migrations'
import { DEFAULT_SAVE_KEY, useGameStore } from '../../game/state/store'
import { saveCloudSnapshot, showAchievementsUI, showLeaderboardUI, signInSilently } from '../../platform/playGames/playGamesClient'
import { resetCamera } from '../../scene/cameraControls'
import { colors, modalBackdropStyle, modalCardShellStyle, radii } from '../theme'
import { AchievementsDashboardModal } from './AchievementsDashboardModal'

const isAndroidNative = Capacitor.getPlatform() === 'android'

const actionButtonStyle = (background: string): CSSProperties => ({
  width: '100%',
  border: 'none',
  background,
  color: '#fff',
  fontWeight: 700,
  fontSize: '15px',
  padding: '12px',
  borderRadius: radii.md,
  marginBottom: '10px',
})

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'high', label: 'High' },
  { value: 'low', label: 'Low' },
] as const

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const muted = useGameStore((s) => s.muted)
  const toggleMuted = useGameStore((s) => s.toggleMuted)
  const qualityOverride = useGameStore((s) => s.qualityOverride)
  const setQualityOverride = useGameStore((s) => s.setQualityOverride)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [showAchievementsDashboard, setShowAchievementsDashboard] = useState(false)

  if (showAchievementsDashboard) {
    return <AchievementsDashboardModal onClose={() => setShowAchievementsDashboard(false)} />
  }

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalCardShellStyle({ padding: '24px' })} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px', fontSize: '20px', textAlign: 'center' }}>⚙️ Settings</h2>

        <button onClick={toggleMuted} style={actionButtonStyle(colors.primary)}>
          {muted ? '🔇 Sound: Off' : '🔊 Sound: On'}
        </button>

        <button onClick={() => setShowAchievementsDashboard(true)} style={actionButtonStyle(colors.purple)}>
          🏆 Achievements &amp; Stats
        </button>

        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 6px', textAlign: 'center' }}>
            🖼️ Graphics Quality
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {QUALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setQualityOverride(option.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: qualityOverride === option.value ? colors.primary : '#eee',
                  color: qualityOverride === option.value ? '#fff' : colors.textMuted,
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '10px',
                  borderRadius: radii.md,
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            resetCamera()
            onClose()
          }}
          style={actionButtonStyle(colors.teal)}
        >
          🎥 Reset Camera
        </button>

        {isAndroidNative && (
          <>
            <button onClick={() => void showAchievementsUI()} style={actionButtonStyle(colors.primary)}>
              🏆 Achievements
            </button>
            <button onClick={() => void showLeaderboardUI()} style={actionButtonStyle(colors.primary)}>
              📊 Leaderboard
            </button>
          </>
        )}

        {!confirmingReset ? (
          <button onClick={() => setConfirmingReset(true)} style={actionButtonStyle(colors.coral)}>
            🗑️ Reset Save
          </button>
        ) : (
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '13px', color: colors.textMuted, textAlign: 'center', margin: '0 0 8px' }}>
              This permanently erases all progress. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  void (async () => {
                    // Erase everywhere, not just locally: if signed in, overwrite
                    // the cloud snapshot with a fresh save before reloading — the
                    // next sync would otherwise silently pull the old progress
                    // right back (a fresh local save has lifetimeEarned 0, which
                    // always loses conflict resolution against real cloud progress).
                    if (isAndroidNative && (await signInSilently())) {
                      await saveCloudSnapshot(freshDefaultState())
                    }
                    localStorage.removeItem(DEFAULT_SAVE_KEY)
                    window.location.reload()
                  })()
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  background: colors.danger,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '10px',
                  borderRadius: radii.md,
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
                  borderRadius: radii.md,
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
            color: colors.textMuted,
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
