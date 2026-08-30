import { useEffect, useState } from 'react'
import { subscribeToTripLocations } from '../services/locations'
import type { TripLocation } from '../types/location'

export interface UseTripLocationsResult {
  locations: TripLocation[]
  loading: boolean
  error: string
}

export function useTripLocations(
  tripId: string | undefined,
): UseTripLocationsResult {
  const [locations, setLocations] = useState<TripLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tripId) {
      return
    }

    const unsubscribe = subscribeToTripLocations(
      tripId,
      (tripLocations) => {
        setLocations(tripLocations)
        setLoading(false)
      },
      (err) => {
        // TEMPORARY diagnostic logging — remove once the read-path bug is
        // confirmed and fixed. Logs the raw Firestore error code/message
        // (e.g. 'permission-denied', 'failed-precondition') so it isn't
        // hidden behind the generic user-facing message below.
        const firestoreErr = err as { code?: string; message?: string }
        console.error('[DIAGNOSTIC] subscribeToTripLocations failed:', {
          code: firestoreErr?.code,
          message: firestoreErr?.message,
          fullError: err,
        })
        setError('Could not load live locations.')
        setLoading(false)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [tripId])

  return { locations, loading, error }
}
