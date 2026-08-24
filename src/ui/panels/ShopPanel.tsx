import { useEffect, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useGameStore } from '../../game/state/store'
import { ROOM_TYPES } from '../../game/data/roomTypes'
import { STAFF_ROLES } from '../../game/data/staffDefs'
import { UPGRADES } from '../../game/data/upgradeDefs'
import { PRESTIGE_UPGRADES } from '../../game/data/prestigeUpgradeDefs'
import { LOCATION_THEMES } from '../../game/data/locationThemes'
import { formatNumber } from '../../utils/formatNumber'
import { colors, hudPillBgActive, hudPillBgDim, modalBackdropStyle, radii } from '../theme'

type Tab = 'rooms' | 'staff' | 'upgrades' | 'prestige' | 'locations'

const TAP_THRESHOLD_PX = 8
const SNAP_FRACTION = 0.35

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

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  touchAction: 'none',
}

const handleNubStyle: CSSProperties = {
  width: '36px',
  height: '4px',
  borderRadius: '2px',
  background: 'rgba(255,255,255,0.6)',
  border: 'none',
  padding: 0,
}

const tabRowStyle: CSSProperties = {
  display: 'flex',
  gap: '6px',
  width: '100%',
}

const tabButtonStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '6px',
  borderRadius: radii.sm,
  border: 'none',
  fontWeight: 700,
  fontSize: '12px',
  background: active ? hudPillBgActive : hudPillBgDim,
  color: '#fff',
})

const cardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  padding: '4px 2px 12px',
}

const cardStyle: CSSProperties = {
  minHeight: '72px',
  borderRadius: radii.lg,
  border: 'none',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  padding: '8px',
}

function RoomCards() {
  const cash = useGameStore((s) => s.cash)
  // Narrow selectors instead of `s.activeLocation()`: this panel only ever
  // needs these two derived booleans, not the whole location object (which
  // would re-render on every staff hire or guest occupancy flip too).
  const totalRooms = useGameStore((s) => Object.keys(s.activeLocation().rooms).length)
  const floorHasSpace = useGameStore((s) => s.activeLocation().floors.some((f) => f.roomIds.length < f.slotCount))
  const buyRoom = useGameStore((s) => s.buyRoom)
  const buyFloor = useGameStore((s) => s.buyFloor)
  const expandFloor = useGameStore((s) => s.expandFloor)
  const nextRoomCost = useGameStore((s) => s.nextRoomCost)
  const nextFloorCost = useGameStore((s) => s.nextFloorCost())
  const expandableFloorIndex = useGameStore((s) => s.nextExpandableFloorIndex())
  const nextWingExpansionCost = useGameStore((s) => s.nextWingExpansionCost)

  const canBuyFloor = cash >= nextFloorCost
  const wingCost = expandableFloorIndex !== null ? nextWingExpansionCost(expandableFloorIndex) : null
  const canExpandWing = wingCost !== null && cash >= wingCost

  return (
    <div style={cardGridStyle}>
      {ROOM_TYPES.map((def) => {
        const unlocked = totalRooms >= def.unlockAtRoomCount
        const cost = nextRoomCost(def.id)
        const affordable = unlocked && floorHasSpace && cash >= cost
        return (
          <button
            key={def.id}
            style={{ ...cardStyle, background: affordable ? def.color : colors.neutralDisabled, opacity: unlocked ? 1 : 0.6 }}
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
        style={{ ...cardStyle, background: canBuyFloor ? colors.primary : colors.neutralDisabled }}
        disabled={!canBuyFloor}
        onClick={() => buyFloor()}
      >
        <span style={{ fontWeight: 700 }}>🏗️ Add Floor</span>
        <span style={{ fontSize: '12px' }}>${formatNumber(nextFloorCost)}</span>
      </button>
      {expandableFloorIndex !== null && (
        <button
          style={{ ...cardStyle, background: canExpandWing ? '#588157' : colors.neutralDisabled }}
          disabled={!canExpandWing}
          onClick={() => expandFloor(expandableFloorIndex)}
        >
          <span style={{ fontWeight: 700 }}>↔️ Expand Wing</span>
          <span style={{ fontSize: '12px' }}>Floor {expandableFloorIndex + 1} · ${formatNumber(wingCost!)}</span>
        </button>
      )}
    </div>
  )
}

function StaffCards() {
  const cash = useGameStore((s) => s.cash)
  const hireStaff = useGameStore((s) => s.hireStaff)
  const nextStaffCost = useGameStore((s) => s.nextStaffCost)
  const staffCountByRole = useGameStore((s) => s.staffCountByRole)

  return (
    <div style={cardGridStyle}>
      {STAFF_ROLES.map((def) => {
        const cost = nextStaffCost(def.id)
        const count = staffCountByRole(def.id)
        const affordable = cash >= cost
        return (
          <button
            key={def.id}
            style={{ ...cardStyle, background: affordable ? colors.teal : colors.neutralDisabled }}
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

function UpgradeCards() {
  const cash = useGameStore((s) => s.cash)
  const upgradeLevels = useGameStore((s) => s.upgradeLevels)
  const buyUpgrade = useGameStore((s) => s.buyUpgrade)
  const nextUpgradeCost = useGameStore((s) => s.nextUpgradeCost)

  return (
    <div style={cardGridStyle}>
      {UPGRADES.map((def) => {
        const level = upgradeLevels[def.id]
        const maxed = level >= def.maxLevel
        const cost = nextUpgradeCost(def.id)
        const affordable = !maxed && cash >= cost
        return (
          <button
            key={def.id}
            style={{ ...cardStyle, background: affordable ? colors.coral : colors.neutralDisabled }}
            disabled={!affordable}
            onClick={() => buyUpgrade(def.id)}
          >
            <span style={{ fontWeight: 700 }}>
              {def.label} (Lv {level}/{def.maxLevel})
            </span>
            <span style={{ fontSize: '11px' }}>{maxed ? 'Maxed out' : def.description}</span>
            {!maxed && <span style={{ fontSize: '12px' }}>${formatNumber(cost)}</span>}
          </button>
        )
      })}
    </div>
  )
}

function PrestigeUpgradeCards() {
  const availablePoints = useGameStore((s) => s.availablePrestigePoints())
  const prestigeUpgradeLevels = useGameStore((s) => s.prestigeUpgradeLevels)
  const buyPrestigeUpgrade = useGameStore((s) => s.buyPrestigeUpgrade)
  const nextPrestigeUpgradeCost = useGameStore((s) => s.nextPrestigeUpgradeCost)

  return (
    <div style={cardGridStyle}>
      {PRESTIGE_UPGRADES.map((def) => {
        const level = prestigeUpgradeLevels[def.id]
        const maxed = level >= def.maxLevel
        const cost = nextPrestigeUpgradeCost(def.id)
        const affordable = !maxed && availablePoints >= cost
        return (
          <button
            key={def.id}
            style={{ ...cardStyle, background: affordable ? '#f4a261' : colors.neutralDisabled }}
            disabled={!affordable}
            onClick={() => buyPrestigeUpgrade(def.id)}
          >
            <span style={{ fontWeight: 700 }}>
              {def.label} (Lv {level}/{def.maxLevel})
            </span>
            <span style={{ fontSize: '11px' }}>{maxed ? 'Maxed out' : def.description}</span>
            {!maxed && <span style={{ fontSize: '12px' }}>{cost} pts</span>}
          </button>
        )
      })}
    </div>
  )
}

function LocationCards() {
  const cash = useGameStore((s) => s.cash)
  const locations = useGameStore((s) => s.locations)
  const activeLocationId = useGameStore((s) => s.activeLocationId)
  const isLocationUnlocked = useGameStore((s) => s.isLocationUnlocked)
  const unlockLocation = useGameStore((s) => s.unlockLocation)
  const switchLocation = useGameStore((s) => s.switchLocation)

  return (
    <div style={cardGridStyle}>
      {LOCATION_THEMES.map((theme) => {
        const unlocked = isLocationUnlocked(theme.id)
        const owned = Object.values(locations).find((l) => l.themeId === theme.id)
        const isActive = owned?.id === activeLocationId
        const affordable = !unlocked && cash >= theme.unlockCost

        if (unlocked && owned) {
          return (
            <button
              key={theme.id}
              style={{ ...cardStyle, background: isActive ? '#2b2d42' : colors.primary }}
              disabled={isActive}
              onClick={() => switchLocation(owned.id)}
            >
              <span style={{ fontWeight: 700 }}>{theme.label}</span>
              <span style={{ fontSize: '12px' }}>{isActive ? 'Viewing now' : 'Switch here'}</span>
            </button>
          )
        }

        return (
          <button
            key={theme.id}
            style={{ ...cardStyle, background: affordable ? colors.purple : colors.neutralDisabled }}
            disabled={!affordable}
            onClick={() => unlockLocation(theme.id)}
          >
            <span style={{ fontWeight: 700 }}>🔒 {theme.label}</span>
            <span style={{ fontSize: '12px' }}>${formatNumber(theme.unlockCost)}</span>
          </button>
        )
      })}
    </div>
  )
}

function computeExpandedHeight(): number {
  return Math.min(window.innerHeight * 0.55, 480)
}

export function ShopPanel() {
  const [tab, setTab] = useState<Tab>('rooms')
  const [expanded, setExpanded] = useState(false)
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const [expandedHeightPx, setExpandedHeightPx] = useState(computeExpandedHeight)

  useEffect(() => {
    const onResize = () => setExpandedHeightPx(computeExpandedHeight())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isDragging = dragHeight !== null
  const contentHeight = dragHeight ?? (expanded ? expandedHeightPx : 0)
  const sheetVisible = expanded || contentHeight > 0

  function handleTabTap(next: Tab) {
    if (!expanded) {
      setTab(next)
      setExpanded(true)
    } else if (tab === next) {
      setExpanded(false)
    } else {
      setTab(next)
    }
  }

  function onHeaderPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const state = { startY: e.clientY, startHeight: expanded ? expandedHeightPx : 0, dragging: false }

    function onMove(ev: PointerEvent) {
      const delta = ev.clientY - state.startY
      if (!state.dragging && Math.abs(delta) > TAP_THRESHOLD_PX) state.dragging = true
      if (state.dragging) {
        setDragHeight(Math.min(expandedHeightPx, Math.max(0, state.startHeight - delta)))
      }
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (state.dragging) {
        const delta = ev.clientY - state.startY
        const finalHeight = Math.min(expandedHeightPx, Math.max(0, state.startHeight - delta))
        setExpanded(finalHeight > expandedHeightPx * SNAP_FRACTION)
        setDragHeight(null)
      }
      // Not dragging → this was a plain tap; the child button's own onClick
      // (a tab, or the handle nub) already handled it natively — we never
      // called setPointerCapture, so nothing here needs to replay that.
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <>
      {/* A true sibling of `panelStyle`'s div, not nested inside it: the panel
          div is only bottom/left/right-positioned (auto height, hugging its
          own content), so an `inset:0` backdrop nested inside it would only
          cover the sheet's own footprint, not the full screen. */}
      {sheetVisible && <div style={modalBackdropStyle} onClick={() => setExpanded(false)} />}
      <div style={panelStyle}>
        <div style={headerStyle} onPointerDown={onHeaderPointerDown}>
          <button style={handleNubStyle} onClick={() => setExpanded((e) => !e)} aria-label="Toggle shop panel" />
          <div style={tabRowStyle}>
            <button style={tabButtonStyle(tab === 'rooms')} onClick={() => handleTabTap('rooms')}>
              🏨 Rooms
            </button>
            <button style={tabButtonStyle(tab === 'staff')} onClick={() => handleTabTap('staff')}>
              🧑‍💼 Staff
            </button>
            <button style={tabButtonStyle(tab === 'upgrades')} onClick={() => handleTabTap('upgrades')}>
              ⭐ Upgrades
            </button>
            <button style={tabButtonStyle(tab === 'prestige')} onClick={() => handleTabTap('prestige')}>
              👑 Prestige
            </button>
            <button style={tabButtonStyle(tab === 'locations')} onClick={() => handleTabTap('locations')}>
              🗺️ Locations
            </button>
          </div>
        </div>
        <div
          style={{
            maxHeight: `${contentHeight}px`,
            overflowY: 'auto',
            touchAction: 'pan-y',
            transition: isDragging ? 'none' : 'max-height 240ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {tab === 'rooms' && <RoomCards />}
          {tab === 'staff' && <StaffCards />}
          {tab === 'upgrades' && <UpgradeCards />}
          {tab === 'prestige' && <PrestigeUpgradeCards />}
          {tab === 'locations' && <LocationCards />}
        </div>
      </div>
    </>
  )
}
