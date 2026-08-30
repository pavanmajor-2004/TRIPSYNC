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

  const [createdSnapshot, memberSnapshot] = await Promise.all([
    getDocs(createdQuery),
    getDocs(memberQuery),
  ])

  const tripsById = new Map<string, Trip>()

  for (const docSnapshot of createdSnapshot.docs) {
    tripsById.set(
      docSnapshot.id,
      toTrip(docSnapshot.id, docSnapshot.data() as Omit<Trip, 'id'>),
    )
  }

  const joinedTripDocs = await Promise.all(
    memberSnapshot.docs
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

  return Array.from(tripsById.values()).sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
  )
}

export async function joinTripByInviteCode(
  inviteCode: string,
  userId: string,
): Promise<Trip> {
  const normalizedCode = inviteCode.trim().toUpperCase()

  const tripsQuery = query(
    collection(db, 'trips'),
    where('inviteCode', '==', normalizedCode),
  )
  const snapshot = await getDocs(tripsQuery)

  if (snapshot.empty) {
    throw new Error('Invalid invite code.')
  }

  const tripDoc = snapshot.docs[0]
  const trip = toTrip(tripDoc.id, tripDoc.data() as Omit<Trip, 'id'>)

  const memberRef = doc(db, 'trips', trip.id, 'members', userId)
  const memberSnapshot = await getDoc(memberRef)

  if (memberSnapshot.exists()) {
    throw new Error('You are already a member of this trip.')
  }

  await setDoc(memberRef, {
    userId,
    role: 'member',
    joinedAt: Timestamp.now(),
  })

  return trip
}
