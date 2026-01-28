import { cookies } from 'next/headers'
import { signToken, verifyToken } from './jwt'
import { collections } from '@/lib/db/collections'
import { ObjectId } from 'mongodb'
import type { SessionPayload, User } from '@/types'

const COOKIE_NAME = 'session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export async function createSession(user: User): Promise<void> {
  const token = await signToken({
    userId: user._id.toString(),
    email: user.email,
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return verifyToken(token)
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) {
    return null
  }

  const usersCollection = await collections.users()
  const user = await usersCollection.findOne({
    _id: new ObjectId(session.userId),
  })

  return user
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
