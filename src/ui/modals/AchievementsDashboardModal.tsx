import { ACHIEVEMENTS } from '../../game/data/achievementDefs'
import { useGameStore } from '../../game/state/store'
import { formatNumber } from '../../utils/formatNumber'
import { colors, modalBackdropStyle, modalCardShellStyle, radii } from '../theme'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${Math.floor(seconds)}s`
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
      <span style={{ color: colors.textMuted }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  )
}

export function AchievementsDashboardModal({ onClose }: { onClose: () => void }) {
  const lifetimeEarned = useGameStore((s) => s.lifetimeEarned)
  const prestigeCount = useGameStore((s) => s.prestigeCount)
  const totalPlaytimeSeconds = useGameStore((s) => s.totalPlaytimeSeconds)
  const bestSatisfactionStreakSeconds = useGameStore((s) => s.bestSatisfactionStreakSeconds)
  const eventsExperienced = useGameStore((s) => s.eventsExperienced)
  const totalRoomCountAllLocations = useGameStore((s) => s.totalRoomCountAllLocations())
  const unlockedAchievementIds = useGameStore((s) => s.unlockedAchievementIds)
  const unlockedSet = new Set(unlockedAchievementIds)

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalCardShellStyle({ padding: '24px', maxWidth: '380px' })} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px', fontSize: '20px', textAlign: 'center' }}>🏆 Achievements &amp; Stats</h2>

        <div style={{ background: '#f4f4f6', borderRadius: radii.md, padding: '10px 14px', marginBottom: '18px' }}>
          <StatRow label="Lifetime earned" value={`$${formatNumber(lifetimeEarned)}`} />
          <StatRow label="Rooms built (all locations)" value={formatNumber(totalRoomCountAllLocations)} />
          <StatRow label="Times prestiged" value={formatNumber(prestigeCount)} />
          <StatRow label="Events experienced" value={formatNumber(eventsExperienced)} />
          <StatRow label="Best satisfaction streak" value={formatDuration(bestSatisfactionStreakSeconds)} />
          <StatRow label="Total playtime" value={formatDuration(totalPlaytimeSeconds)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = unlockedSet.has(achievement.id)
            return (
              <div
                key={achievement.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: radii.sm,
                  background: unlocked ? '#f4f4f6' : 'transparent',
                  opacity: unlocked ? 1 : 0.45,
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{unlocked ? '🏆' : '🔒'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{achievement.label}</div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>{achievement.description}</div>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            border: 'none',
            background: colors.primary,
            color: '#fff',
            fontWeight: 700,
            fontSize: '15px',
            padding: '12px',
            borderRadius: radii.md,
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
