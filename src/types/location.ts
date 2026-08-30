import type { Timestamp } from 'firebase/firestore'

export interface TripLocation {
  userId: string
  latitude: number
  longitude: number
  accuracy: number
  updatedAt: Timestamp
  isSharing: boolean
}
