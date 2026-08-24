export type RoomStatus = 'vacant' | 'occupied'

export type RoomTypeId = 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'executiveSuite'

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

export type StaffRole = 'receptionist' | 'housekeeper' | 'manager'

export interface StaffMember {
  id: string
  role: StaffRole
  hiredAt: number
}

export type LocationThemeId =
  | 'coastal'
  | 'mountain'
  | 'city'
  | 'desert'
  | 'jungle'
  | 'arctic'
  | 'volcanic'

export interface HotelLocation {
  id: string
  themeId: LocationThemeId
  floors: Floor[]
  rooms: Record<string, Room>
  staff: Record<string, StaffMember>
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
  archetypeId: string
}
