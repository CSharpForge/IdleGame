import { useEffect, useState } from 'react'
import { useGameStore } from '../../game/state/store'
import { getEventDef } from '../../game/data/eventDefs'
import { colors, radii, shadows } from '../theme'

export function EventBanner() {
  const activeEvent = useGameStore((s) => s.activeEvent)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!activeEvent) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeEvent])

  if (!activeEvent) return null
  const remainingSeconds = Math.max(0, Math.ceil((activeEvent.endsAt - now) / 1000))
  if (remainingSeconds <= 0) return null
  const def = getEventDef(activeEvent.id)

  return (
    <div
      style={{
        pointerEvents: 'none',
        background: colors.coral,
        color: '#fff',
        borderRadius: radii.md,
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: shadows.banner,
        maxWidth: '100%',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <span>🎉 {def.label}</span>
      <span style={{ fontWeight: 500, opacity: 0.9 }}>{remainingSeconds}s left</span>
    </div>
  )
}
