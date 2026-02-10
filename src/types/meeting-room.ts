export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Booking {
  id: string
  roomId: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  organizer: string
  attendees: string[]
  status: BookingStatus
}

export interface MeetingRoom {
  id: string
  name: string
  capacity: number
  floor: number
  facilities: string[]
  description?: string
  color: string
}
