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
        console.error('subscribeToTripLocations failed:', err)
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
