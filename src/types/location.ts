import type { Timestamp } from 'firebase/firestore'

export interface TripLocation {
  userId: string
  latitude: number
  longitude: number
  accuracy: number
  // Written with serverTimestamp(), which resolves to null in any snapshot
  // delivered before the server acknowledges the write (e.g. the local
  // optimistic update right after a write goes out) — callers must handle
  // both states, never assume this is always a resolved Timestamp.
  updatedAt: Timestamp | null
  isSharing: boolean
}
