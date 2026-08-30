import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import LiveLocationMap from '../components/LiveLocationMap'
import { useAuth } from '../hooks/useAuth'
import { useGeolocation, type GeolocationErrorType } from '../hooks/useGeolocation'
import { useTripLocations } from '../hooks/useTripLocations'
import { haversineDistanceMeters, shareLocation, stopSharing } from '../services/locations'
import { getTripById, getTripMembers } from '../services/trips'
import type { Trip, TripMember } from '../types/trip'

const MIN_WRITE_INTERVAL_MS = 10_000
const MIN_WRITE_DISTANCE_METERS = 20

const GEO_ERROR_MESSAGES: Record<GeolocationErrorType, string> = {
  unsupported: 'Your browser does not support location sharing.',
  'permission-denied':
    'Location permission was denied. Enable location access for this site in your browser settings, then try again.',
  'position-unavailable':
    'Your location is currently unavailable. Please try again.',
  timeout: 'Getting your location took too long. Please try again.',
  unknown: 'Could not get your location. Please try again.',
}

interface LastWritten {
  latitude: number
  longitude: number
  time: number
}

function TripPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuth()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!tripId) {
      return
    }

    let cancelled = false

    Promise.all([getTripById(tripId), getTripMembers(tripId)])
      .then(([foundTrip, tripMembers]) => {
        if (cancelled) {
          return
        }

        if (!foundTrip) {
          setNotFound(true)
          return
        }

        setTrip(foundTrip)
        setMembers(tripMembers)
      })
      .catch((err) => {
        console.error('Failed to load trip:', err)
        if (!cancelled) {
          setError('Could not load this trip. Please try again.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [tripId])

  const {
    position,
    error: geoError,
    isSupported,
    start: startGeolocation,
    stop: stopGeolocation,
  } = useGeolocation()
  const { locations, error: locationsError } = useTripLocations(tripId)

  const [wantsToShare, setWantsToShare] = useState(false)
  const [sharingConfirmed, setSharingConfirmed] = useState(false)
  const [shareError, setShareError] = useState('')

  const lastWrittenRef = useRef<LastWritten | null>(null)

  useEffect(() => {
    if (!wantsToShare || !position || !tripId || !user) {
      return
    }

    const { latitude, longitude, accuracy } = position
    const now = Date.now()
    const lastWritten = lastWrittenRef.current

    const shouldWrite =
      !lastWritten ||
      now - lastWritten.time >= MIN_WRITE_INTERVAL_MS ||
      haversineDistanceMeters(lastWritten, { latitude, longitude }) >=
        MIN_WRITE_DISTANCE_METERS

    if (!shouldWrite) {
      return
    }

    shareLocation(tripId, user.uid, latitude, longitude, accuracy)
      .then(() => {
        lastWrittenRef.current = { latitude, longitude, time: now }
        setSharingConfirmed(true)
        setShareError('')
      })
      .catch((err) => {
        console.error('shareLocation failed:', err)
        setShareError('Could not update your location. Please try again.')

        // The first write never succeeded: don't claim we're sharing.
        if (!lastWrittenRef.current) {
          stopGeolocation()
          setWantsToShare(false)
        }
      })
  }, [wantsToShare, position, tripId, user, stopGeolocation])

  function handleStartSharing() {
    setShareError('')
    setWantsToShare(true)
    startGeolocation()
  }

  function handleStopSharing() {
    stopGeolocation()
    setWantsToShare(false)
    setSharingConfirmed(false)
    lastWrittenRef.current = null

    if (tripId && user) {
      stopSharing(tripId, user.uid).catch((err) => {
        console.error('stopSharing failed:', err)
      })
    }
  }

  if (loading) {
    return <p className="auth-loading">Loading trip...</p>
  }

  if (notFound) {
    return <p className="auth-loading">Trip not found.</p>
  }

  if (error || !trip) {
    return (
      <p className="auth-loading auth-error">
        {error || 'Could not load this trip. Please try again.'}
      </p>
    )
  }

  // Once an error arrives before a first successful write, drop back to
  // the "Share My Location" state instead of staying stuck on "Locating…".
  const isLocating = wantsToShare && !sharingConfirmed && !geoError

  return (
    <section className="page-placeholder">
      <h1>Trip Details</h1>

      <div className="trip-detail-card">
        <h2>{trip.name}</h2>
        {trip.description && <p>{trip.description}</p>}
        <p>
          {trip.startDate} – {trip.endDate}
        </p>
        <p>Invite code: {trip.inviteCode}</p>
      </div>

      <h2>Members</h2>

      <div className="member-list">
        {members.length === 0 && <p>No members yet.</p>}
        {members.map((member) => (
          <div key={member.userId} className="member-row">
            <span className="member-id">{member.userId}</span>
            <span className="member-role">{member.role}</span>
            <span className="member-joined">
              {member.joinedAt.toDate().toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      <h2>Live Location</h2>

      <div className="live-location-section">
        <button
          type="button"
          className="live-location-toggle"
          disabled={!isSupported || isLocating}
          onClick={sharingConfirmed ? handleStopSharing : handleStartSharing}
        >
          {sharingConfirmed
            ? 'Stop Sharing'
            : isLocating
              ? 'Locating…'
              : 'Share My Location'}
        </button>

        <p className="location-status">
          Status: {sharingConfirmed ? 'Sharing my location' : 'Not sharing'}
        </p>

        {geoError && <p className="auth-error">{GEO_ERROR_MESSAGES[geoError]}</p>}
        {shareError && <p className="auth-error">{shareError}</p>}
        {locationsError && <p className="auth-error">{locationsError}</p>}

        <LiveLocationMap locations={locations} />
      </div>
    </section>
  )
}

export default TripPage
