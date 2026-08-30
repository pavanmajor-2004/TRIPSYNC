import { useCallback, useEffect, useRef, useState } from 'react'

export interface GeolocationPositionData {
  latitude: number
  longitude: number
  accuracy: number
}

export type GeolocationErrorType =
  | 'unsupported'
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'unknown'

export interface UseGeolocationResult {
  position: GeolocationPositionData | null
  error: GeolocationErrorType | null
  isWatching: boolean
  isSupported: boolean
  start: () => void
  stop: () => void
}

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 0,
}

function toErrorType(error: GeolocationPositionError): GeolocationErrorType {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'permission-denied'
    case error.POSITION_UNAVAILABLE:
      return 'position-unavailable'
    case error.TIMEOUT:
      return 'timeout'
    default:
      return 'unknown'
  }
}

export function useGeolocation(): UseGeolocationResult {
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const [position, setPosition] = useState<GeolocationPositionData | null>(null)
  const [error, setError] = useState<GeolocationErrorType | null>(null)
  const [isWatching, setIsWatching] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  // Once the user has explicitly denied permission, don't re-trigger the
  // browser prompt loop on further start() calls in this session.
  const deniedRef = useRef(false)

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsWatching(false)
  }, [])

  const start = useCallback(() => {
    if (!isSupported) {
      setError('unsupported')
      return
    }

    if (deniedRef.current) {
      setError('permission-denied')
      return
    }

    if (watchIdRef.current !== null) {
      return
    }

    setError(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setError(null)
      },
      (err) => {
        const errorType = toErrorType(err)
        if (errorType === 'permission-denied') {
          deniedRef.current = true
          stop()
        }
        setError(errorType)
      },
      WATCH_OPTIONS,
    )
    setIsWatching(true)
  }, [isSupported, stop])

  // Safety net: always clear an active watch on unmount, even if the
  // caller forgets to call stop() (e.g. navigating away from TripPage).
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  return { position, error, isWatching, isSupported, start, stop }
}
