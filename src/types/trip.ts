import type { Timestamp } from 'firebase/firestore'

export interface Trip {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  createdBy: string
  inviteCode: string
  createdAt: Timestamp
}

export type NewTrip = Pick<
  Trip,
  'name' | 'description' | 'startDate' | 'endDate'
>

export interface TripMember {
  userId: string
  role: 'admin' | 'member'
  joinedAt: Timestamp
}
