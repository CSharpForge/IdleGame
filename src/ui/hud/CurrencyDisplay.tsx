import { useGameStore } from '../../game/state/store'
import { formatNumber } from '../../utils/formatNumber'

export function CurrencyDisplay() {
  const cash = useGameStore((s) => s.cash)

  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(12px, env(safe-area-inset-top))',
        left: '12px',
        pointerEvents: 'auto',
        background: 'rgba(0, 0, 0, 0.55)',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: 600,
      }}
    >
      💰 ${formatNumber(cash)}
    </div>
  )
}
