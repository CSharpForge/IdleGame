export type RoomStatus = 'vacant' | 'occupied'

export interface Room {
  id: string
  floorIndex: number
  slotIndex: number
  status: RoomStatus
  builtAt: number
}

export interface Floor {
  index: number
  roomIds: string[]
  slotCount: number
}

export type GuestPhase =
  | 'arriving'
  | 'walkToRoom'
  | 'staying'
  | 'checkingOut'
  | 'leaving'
  | 'done'

export interface GuestEntity {
  id: string
  phase: GuestPhase
  roomId: string
  floorIndex: number
  slotIndex: number
  pathT: number
  stayTimer: number
  color: string
}
