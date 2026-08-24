import { useState, type CSSProperties } from 'react'
import { useGameStore } from '../../game/state/store'
import { ROOM_TYPES } from '../../game/data/roomTypes'
import { STAFF_ROLES } from '../../game/data/staffDefs'
import { formatNumber } from '../../utils/formatNumber'

type Tab = 'rooms' | 'staff'

const panelStyle: CSSProperties = {
  position: 'absolute',
  bottom: 'max(12px, env(safe-area-inset-bottom))',
  left: '12px',
  right: '12px',
  pointerEvents: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const tabRowStyle: CSSProperties = {
  display: 'flex',
  gap: '6px',
}

const tabButtonStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '6px',
  borderRadius: '10px',
  border: 'none',
  fontWeight: 700,
  fontSize: '13px',
  background: active ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)',
  color: '#fff',
})

const cardRowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  overflowX: 'auto',
  paddingBottom: '2px',
}

const cardStyle: CSSProperties = {
  minWidth: '140px',
  minHeight: '72px',
  borderRadius: '14px',
  border: 'none',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  padding: '8px',
  flexShrink: 0,
}

function RoomCards() {
  const cash = useGameStore((s) => s.cash)
  const rooms = useGameStore((s) => s.rooms)
  const floors = useGameStore((s) => s.floors)
  const buyRoom = useGameStore((s) => s.buyRoom)
  const buyFloor = useGameStore((s) => s.buyFloor)
  const nextRoomCost = useGameStore((s) => s.nextRoomCost)
  const nextFloorCost = useGameStore((s) => s.nextFloorCost())

  const totalRooms = Object.keys(rooms).length
  const floorHasSpace = floors.some((f) => f.roomIds.length < f.slotCount)
  const canBuyFloor = cash >= nextFloorCost

  return (
    <div style={cardRowStyle}>
      {ROOM_TYPES.map((def) => {
        const unlocked = totalRooms >= def.unlockAtRoomCount
        const cost = nextRoomCost(def.id)
        const affordable = unlocked && floorHasSpace && cash >= cost
        return (
          <button
            key={def.id}
            style={{ ...cardStyle, background: affordable ? def.color : '#8a8a8a', opacity: unlocked ? 1 : 0.6 }}
            disabled={!affordable}
            onClick={() => buyRoom(def.id)}
          >
            <span style={{ fontWeight: 700 }}>{def.label}</span>
            <span style={{ fontSize: '12px' }}>
              {!unlocked
                ? `Unlocks at ${def.unlockAtRoomCount} rooms`
                : !floorHasSpace
                  ? 'No floor space'
                  : `$${formatNumber(cost)}`}
            </span>
          </button>
        )
      })}
      <button
        style={{ ...cardStyle, background: canBuyFloor ? '#3d5a80' : '#8a8a8a' }}
        disabled={!canBuyFloor}
        onClick={() => buyFloor()}
      >
        <span style={{ fontWeight: 700 }}>🏗️ Add Floor</span>
        <span style={{ fontSize: '12px' }}>${formatNumber(nextFloorCost)}</span>
      </button>
    </div>
  )
}

function StaffCards() {
  const cash = useGameStore((s) => s.cash)
  const hireStaff = useGameStore((s) => s.hireStaff)
  const nextStaffCost = useGameStore((s) => s.nextStaffCost)
  const staffCountByRole = useGameStore((s) => s.staffCountByRole)

  return (
    <div style={cardRowStyle}>
      {STAFF_ROLES.map((def) => {
        const cost = nextStaffCost(def.id)
        const count = staffCountByRole(def.id)
        const affordable = cash >= cost
        return (
          <button
            key={def.id}
            style={{ ...cardStyle, background: affordable ? '#4d908e' : '#8a8a8a' }}
            disabled={!affordable}
            onClick={() => hireStaff(def.id)}
          >
            <span style={{ fontWeight: 700 }}>
              {def.label} ({count})
            </span>
            <span style={{ fontSize: '12px' }}>${formatNumber(cost)}</span>
          </button>
        )
      })}
    </div>
  )
}

export function ShopPanel() {
  const [tab, setTab] = useState<Tab>('rooms')

  return (
    <div style={panelStyle}>
      <div style={tabRowStyle}>
        <button style={tabButtonStyle(tab === 'rooms')} onClick={() => setTab('rooms')}>
          🏨 Rooms
        </button>
        <button style={tabButtonStyle(tab === 'staff')} onClick={() => setTab('staff')}>
          🧑‍💼 Staff
        </button>
      </div>
      {tab === 'rooms' ? <RoomCards /> : <StaffCards />}
    </div>
  )
}
