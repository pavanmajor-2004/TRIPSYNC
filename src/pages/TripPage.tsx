import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getTripById, getTripMembers } from '../services/trips'
import type { Trip, TripMember } from '../types/trip'

function TripPage() {
  const { tripId } = useParams<{ tripId: string }>()

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

  if (loading) {
    return <p className="auth-loading">Loading trip...</p>
  }

  if (notFound) {
    return <p className="auth-loading">Trip not found.</p>
  }

  if (error || !trip) {
    return <p className="auth-loading auth-error">{error || 'Could not load this trip. Please try again.'}</p>
  }

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
    </section>
  )
}

export default TripPage
