import {
  addDoc,
  collection,
  doc,
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
    role: 'admin',
    joinedAt: createdAt,
  })

  return {
    id: tripRef.id,
    ...newTrip,
    createdBy: userId,
    inviteCode,
    createdAt,
  }
}

export async function getTripsForUser(userId: string): Promise<Trip[]> {
  const tripsQuery = query(
    collection(db, 'trips'),
    where('createdBy', '==', userId),
  )
  const snapshot = await getDocs(tripsQuery)

  const trips = snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Trip, 'id'>),
  }))

  return trips.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
}
