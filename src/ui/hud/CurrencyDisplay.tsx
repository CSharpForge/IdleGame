import { useGameStore } from '../../game/state/store'
import { formatNumber } from '../../utils/formatNumber'
import { hudPillBg, radii } from '../theme'

export function CurrencyDisplay() {
  const cash = useGameStore((s) => s.cash)

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: hudPillBg,
        color: '#fff',
        padding: '10px 16px',
        borderRadius: radii.md,
        fontSize: '18px',
        fontWeight: 600,
      }}
    >
      💰 ${formatNumber(cash)}
    </div>
  )
}
