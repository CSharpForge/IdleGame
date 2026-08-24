export type RoomStatus = 'vacant' | 'occupied'

export type RoomTypeId = 'standard' | 'deluxe' | 'suite'

export interface Room {
  id: string
  floorIndex: number
  slotIndex: number
  typeId: RoomTypeId
  status: RoomStatus
  builtAt: number
}

export interface Floor {
  index: number
  roomIds: string[]
  slotCount: number
}

export type StaffRole = 'receptionist' | 'housekeeper'

export interface StaffMember {
  id: string
  role: StaffRole
  hiredAt: number
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
