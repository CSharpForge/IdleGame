import type { CSSProperties } from 'react'
import { useGameStore } from '../../game/state/store'
import { formatNumber } from '../../utils/formatNumber'

const buttonBaseStyle: CSSProperties = {
  pointerEvents: 'auto',
  flex: 1,
  minHeight: '56px',
  border: 'none',
  borderRadius: '14px',
  fontSize: '15px',
  fontWeight: 700,
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
}

export function ShopPanel() {
  const cash = useGameStore((s) => s.cash)
  const nextRoomCost = useGameStore((s) => s.nextRoomCost())
  const nextFloorCost = useGameStore((s) => s.nextFloorCost())
  const floors = useGameStore((s) => s.floors)
  const buyRoom = useGameStore((s) => s.buyRoom)
  const buyFloor = useGameStore((s) => s.buyFloor)

  const floorHasSpace = floors.some((f) => f.roomIds.length < f.slotCount)
  const canBuyRoom = floorHasSpace && cash >= nextRoomCost
  const canBuyFloor = cash >= nextFloorCost

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        left: '12px',
        right: '12px',
        display: 'flex',
        gap: '10px',
      }}
    >
      <button
        style={{
          ...buttonBaseStyle,
          background: canBuyRoom ? '#f2a65a' : '#8a8a8a',
          opacity: floorHasSpace ? 1 : 0.5,
        }}
        disabled={!canBuyRoom}
        onClick={() => buyRoom()}
      >
        <span>🏨 Build Room</span>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>
          {floorHasSpace ? `$${formatNumber(nextRoomCost)}` : 'Floor full'}
        </span>
      </button>
      <button
        style={{
          ...buttonBaseStyle,
          background: canBuyFloor ? '#3d5a80' : '#8a8a8a',
        }}
        disabled={!canBuyFloor}
        onClick={() => buyFloor()}
      >
        <span>🏗️ Add Floor</span>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>${formatNumber(nextFloorCost)}</span>
      </button>
    </div>
  )
}
