import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from './firestore'
import type { NewTrip, Trip } from '../types/trip'

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const INVITE_CODE_LENGTH = 6

function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)]
  }
  return code
}

function toTrip(id: string, data: Omit<Trip, 'id'>): Trip {
  return { id, ...data }
}

export async function createTrip(
  newTrip: NewTrip,
  userId: string,
): Promise<Trip> {
  const createdAt = Timestamp.now()
  const inviteCode = generateInviteCode()

  const tripRef = await addDoc(collection(db, 'trips'), {
    ...newTrip,
    createdBy: userId,
    inviteCode,
    createdAt,
  })

  await setDoc(doc(db, 'trips', tripRef.id, 'members', userId), {
    userId,
    role: 'admin',
    joinedAt: createdAt,
  })

  // A separate, narrowly-scoped lookup so a user who is not yet a trip
  // member can resolve an invite code to a tripId without needing read
  // access to the trips collection itself (see firestore.rules).
  await setDoc(doc(db, 'inviteCodes', inviteCode), {
    tripId: tripRef.id,
  })

  return toTrip(tripRef.id, {
    ...newTrip,
    createdBy: userId,
    inviteCode,
    createdAt,
  })
}

export async function getTripsForUser(userId: string): Promise<Trip[]> {
  const createdQuery = query(
    collection(db, 'trips'),
    where('createdBy', '==', userId),
  )
  const memberQuery = query(
    collectionGroup(db, 'members'),
    where('userId', '==', userId),
  )

  const [createdResult, memberResult] = await Promise.allSettled([
    getDocs(createdQuery),
    getDocs(memberQuery),
  ])

  if (createdResult.status === 'rejected') {
    throw createdResult.reason
  }

  const tripsById = new Map<string, Trip>()

  for (const docSnapshot of createdResult.value.docs) {
    tripsById.set(
      docSnapshot.id,
      toTrip(docSnapshot.id, docSnapshot.data() as Omit<Trip, 'id'>),
    )
  }

  if (memberResult.status === 'fulfilled') {
    const joinedTripDocs = await Promise.all(
      memberResult.value.docs
        .map((memberDoc) => memberDoc.ref.parent.parent)
        .filter((tripRef) => tripRef !== null && !tripsById.has(tripRef.id))
        .map((tripRef) => getDoc(tripRef!)),
    )

    for (const tripDoc of joinedTripDocs) {
      if (tripDoc.exists()) {
        tripsById.set(
          tripDoc.id,
          toTrip(tripDoc.id, tripDoc.data() as Omit<Trip, 'id'>),
        )
      }
    }
  } else {
    // The collection-group query on members.userId requires a Firestore
    // index with COLLECTION_GROUP scope (see firestore.indexes.json). If
    // that index hasn't been deployed yet, degrade gracefully: still show
    // the user's own created trips instead of failing the whole list.
    console.error(
      'Could not load joined trips (members collection-group query failed; ' +
        'a Firestore index may be missing — see firestore.indexes.json):',
      memberResult.reason,
    )
  }

  return Array.from(tripsById.values()).sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
  )
}

export async function joinTripByInviteCode(
  inviteCode: string,
  userId: string,
): Promise<Trip> {
  const normalizedCode = inviteCode.trim().toUpperCase()

  const inviteCodeSnapshot = await getDoc(doc(db, 'inviteCodes', normalizedCode))

  if (!inviteCodeSnapshot.exists()) {
    throw new Error('Invalid invite code.')
  }

  const { tripId } = inviteCodeSnapshot.data() as { tripId: string }

  const memberRef = doc(db, 'trips', tripId, 'members', userId)
  const memberSnapshot = await getDoc(memberRef)

  if (memberSnapshot.exists()) {
    throw new Error('You are already a member of this trip.')
  }

  await setDoc(memberRef, {
    userId,
    role: 'member',
    joinedAt: Timestamp.now(),
  })

  // Only readable once membership exists (see firestore.rules), so this
  // must happen after the member document is created above.
  const tripSnapshot = await getDoc(doc(db, 'trips', tripId))

  if (!tripSnapshot.exists()) {
    throw new Error('Invalid invite code.')
  }

  return toTrip(tripSnapshot.id, tripSnapshot.data() as Omit<Trip, 'id'>)
}
