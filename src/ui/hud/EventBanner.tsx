import { useEffect, useState } from 'react'
import { useGameStore } from '../../game/state/store'
import { getEventDef } from '../../game/data/eventDefs'

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
        position: 'absolute',
        top: 'max(12px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        background: '#e07a5f',
        color: '#fff',
        borderRadius: '12px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      <span>🎉 {def.label}</span>
      <span style={{ fontWeight: 500, opacity: 0.9 }}>{remainingSeconds}s left</span>
    </div>
  )
}
