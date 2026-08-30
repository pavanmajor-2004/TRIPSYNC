import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firestore'
import type { TripLocation } from '../types/location'

export async function shareLocation(
  tripId: string,
  userId: string,
  latitude: number,
  longitude: number,
  accuracy: number,
): Promise<void> {
  await setDoc(doc(db, 'trips', tripId, 'locations', userId), {
    userId,
    latitude,
    longitude,
    accuracy,
    updatedAt: serverTimestamp(),
    isSharing: true,
  })
}

export async function stopSharing(
  tripId: string,
  userId: string,
): Promise<void> {
  await setDoc(
    doc(db, 'trips', tripId, 'locations', userId),
    {
      isSharing: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function subscribeToTripLocations(
  tripId: string,
  callback: (locations: TripLocation[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    collection(db, 'trips', tripId, 'locations'),
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => docSnapshot.data() as TripLocation))
    },
    onError,
  )
}

const EARTH_RADIUS_METERS = 6371000

interface LatLng {
  latitude: number
  longitude: number
}

// Great-circle distance between two coordinates, used to decide whether a
// new GPS fix has moved far enough to be worth writing to Firestore.
export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180

  const deltaLat = toRadians(b.latitude - a.latitude)
  const deltaLng = toRadians(b.longitude - a.longitude)

  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine))
}
