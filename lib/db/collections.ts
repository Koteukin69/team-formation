import { Collection } from 'mongodb'
import { getDb } from './client'
import type {
  User,
  AuthCode,
  RateLimit,
  Marathon,
  Participant,
  Team,
  OpenPosition,
  TeamRequest,
  Application,
  Invitation,
} from '@/types'

export async function getCollection<T extends object>(name: string): Promise<Collection<T>> {
  const db = await getDb()
  return db.collection<T>(name)
}

export const collections = {
  users: () => getCollection<User>('users'),
  authCodes: () => getCollection<AuthCode>('auth_codes'),
  rateLimits: () => getCollection<RateLimit>('rate_limits'),
  marathons: () => getCollection<Marathon>('marathons'),
  participants: () => getCollection<Participant>('participants'),
  teams: () => getCollection<Team>('teams'),
  openPositions: () => getCollection<OpenPosition>('open_positions'),
  teamRequests: () => getCollection<TeamRequest>('team_requests'),
  applications: () => getCollection<Application>('applications'),
  invitations: () => getCollection<Invitation>('invitations'),
}

// Initialize indexes
export async function initializeIndexes(): Promise<void> {
  const db = await getDb()

  // Users
  await db.collection('users').createIndex({ email: 1 }, { unique: true })

  // Auth codes
  await db.collection('auth_codes').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  await db.collection('auth_codes').createIndex({ email: 1 })

  // Rate limits
  await db.collection('rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  await db.collection('rate_limits').createIndex({ key: 1, type: 1 }, { unique: true })

  // Marathons
  await db.collection('marathons').createIndex({ slug: 1 }, { unique: true })
  await db.collection('marathons').createIndex({ creatorId: 1 })

  // Participants
  await db.collection('participants').createIndex({ marathonId: 1, userId: 1 }, { unique: true })
  await db.collection('participants').createIndex(
    { marathonId: 1, nickname: 1 },
    { unique: true, sparse: true }
  )
  await db.collection('participants').createIndex({ marathonId: 1, teamId: 1 })
  await db.collection('participants').createIndex({ marathonId: 1, roles: 1 })
  await db.collection('participants').createIndex({ marathonId: 1, technologies: 1 })

  // Teams
  await db.collection('teams').createIndex({ marathonId: 1 })
  await db.collection('teams').createIndex({ marathonId: 1, managementType: 1 })
  await db.collection('teams').createIndex({ marathonId: 1, decisionSystem: 1 })
  await db.collection('teams').createIndex({ marathonId: 1, genre: 1 })

  // Open positions
  await db.collection('open_positions').createIndex({ teamId: 1 })
  await db.collection('open_positions').createIndex({ marathonId: 1, role: 1 })

  // Team requests
  await db.collection('team_requests').createIndex({ teamId: 1, status: 1 })

  // Applications
  await db.collection('applications').createIndex({ teamId: 1, status: 1 })
  await db.collection('applications').createIndex({ participantId: 1, status: 1 })
  await db.collection('applications').createIndex(
    { marathonId: 1, participantId: 1, teamId: 1 },
    { unique: true }
  )

  // Invitations
  await db.collection('invitations').createIndex({ participantId: 1, status: 1 })
  await db.collection('invitations').createIndex({ teamId: 1, status: 1 })
}
