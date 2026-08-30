import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { createTrip, getTripsForUser, joinTripByInviteCode } from '../services/trips'
import type { Trip } from '../types/trip'

const KNOWN_JOIN_ERRORS = new Set([
  'Invalid invite code.',
  'You are already a member of this trip.',
])

function TripsPage() {
  const { user } = useAuth()

  const [trips, setTrips] = useState<Trip[]>([])
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false

    getTripsForUser(user.uid)
      .then((userTrips) => {
        if (!cancelled) {
          setTrips(userTrips)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not load your trips. Please try again.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTrips(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user])

  function resetForm() {
    setName('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setFormError('')
  }

  async function handleCreateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      setFormError('You must be signed in to create a trip.')
      return
    }

    if (!name.trim()) {
      setFormError('Trip name is required.')
      return
    }

    if (!startDate) {
      setFormError('Start date is required.')
      return
    }

    if (!endDate) {
      setFormError('End date is required.')
      return
    }

    if (endDate < startDate) {
      setFormError('End date cannot be before start date.')
      return
    }

    setFormError('')
    setSubmitting(true)

    try {
      const trip = await createTrip(
        {
          name: name.trim(),
          description: description.trim(),
          startDate,
          endDate,
        },
        user.uid,
      )

      setTrips((current) => [trip, ...current])
      resetForm()
      setShowForm(false)
    } catch {
      setFormError('Could not create the trip. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleJoinTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setJoinSuccess('')

    if (!user) {
      setJoinError('You must be signed in to join a trip.')
      return
    }

    const normalizedCode = joinCode.trim().toUpperCase()

    if (!normalizedCode) {
      setJoinError('Enter an invite code.')
      return
    }

    setJoinError('')
    setJoining(true)

    try {
      const trip = await joinTripByInviteCode(normalizedCode, user.uid)

      setTrips((current) =>
        current.some((existing) => existing.id === trip.id)
          ? current
          : [trip, ...current],
      )
      setJoinSuccess(`You joined "${trip.name}".`)
      setJoinCode('')
    } catch (err) {
      if (err instanceof Error && KNOWN_JOIN_ERRORS.has(err.message)) {
        setJoinError(err.message)
      } else {
        setJoinError('Could not join the trip. Please try again.')
      }
    } finally {
      setJoining(false)
    }
  }

  return (
    <section className="page-placeholder">
      <h1>Trips Page</h1>
      <p>Browse the trips you are part of.</p>

      <button type="button" onClick={() => setShowForm((current) => !current)}>
        {showForm ? 'Cancel' : 'Create Trip'}
      </button>

      {showForm && (
        <form className="auth-form" onSubmit={handleCreateTrip}>
          <label className="auth-field">
            Trip name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            Description
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label className="auth-field">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            End date
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </label>

          {formError && <p className="auth-error">{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Trip'}
          </button>
        </form>
      )}

      <form className="auth-form" onSubmit={handleJoinTrip}>
        <label className="auth-field">
          Invite code
          <input
            type="text"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="e.g. BBCGQY"
            maxLength={6}
          />
        </label>

        {joinError && <p className="auth-error">{joinError}</p>}
        {joinSuccess && <p className="auth-success">{joinSuccess}</p>}

        <button type="submit" disabled={joining}>
          {joining ? 'Joining…' : 'Join Trip'}
        </button>
      </form>

      <div className="trip-list">
        {loadingTrips && <p>Loading your trips…</p>}
        {!loadingTrips && loadError && <p className="auth-error">{loadError}</p>}
        {!loadingTrips && !loadError && trips.length === 0 && (
          <p>You don't have any trips yet.</p>
        )}
        {!loadingTrips &&
          !loadError &&
          trips.map((trip) => (
            <div key={trip.id} className="trip-card">
              <h3>{trip.name}</h3>
              {trip.description && <p>{trip.description}</p>}
              <p>
                {trip.startDate} – {trip.endDate}
              </p>
              <p>Invite code: {trip.inviteCode}</p>
            </div>
          ))}
      </div>
    </section>
  )
}

export default TripsPage
