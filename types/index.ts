import { ObjectId } from 'mongodb'

// User
export interface User {
  _id: ObjectId
  email: string
  createdAt: Date
  updatedAt: Date
}

// Auth Code
export interface AuthCode {
  _id: ObjectId
  email: string
  code: string
  expiresAt: Date
  attempts: number
  createdAt: Date
}

// Rate Limit
export interface RateLimit {
  _id: ObjectId
  key: string
  type: 'email_minute' | 'email_hour' | 'api_minute'
  count: number
  windowStart: Date
  expiresAt: Date
}

// Marathon
export interface Marathon {
  _id: ObjectId
  name: string
  slug: string
  minTeamSize: number
  maxTeamSize: number
  creatorId: ObjectId
  organizers: ObjectId[]
  createdAt: Date
  updatedAt: Date
}

// Participant
export interface Participant {
  _id: ObjectId
  marathonId: ObjectId
  userId: ObjectId
  name?: string
  nickname?: string
  roles: string[]
  technologies: string[]
  description?: string
  teamId?: ObjectId
  isBanned: boolean
  banReason?: string
  isSuspended: boolean
  suspendReason?: string
  createdAt: Date
  updatedAt: Date
}

// Team
export type ManagementType = 'scrum' | 'kanban' | 'agile' | 'waterfall' | 'free'
export type DecisionSystem = 'dictatorship' | 'democracy'

export interface Team {
  _id: ObjectId
  marathonId: ObjectId
  name: string
  leaderId?: ObjectId
  managementType: ManagementType
  decisionSystem: DecisionSystem
  genre?: string
  description?: string
  pitchDoc?: string
  designDoc?: string
  chatLink?: string
  gitLink?: string
  isSuspended: boolean
  suspendReason?: string
  memberCount: number
  createdAt: Date
  updatedAt: Date
}

// Open Position
export interface OpenPosition {
  _id: ObjectId
  teamId: ObjectId
  marathonId: ObjectId
  role: string
  description?: string
  createdAt: Date
}

// Team Request
export type TeamRequestType =
  | 'invite'
  | 'open_position'
  | 'close_position'
  | 'kick'
  | 'update_settings'
  | 'accept_application'
  | 'reject_application'
  | 'transfer_lead'
  | 'change_decision_system'

export type TeamRequestStatus = 'pending' | 'approved' | 'rejected'

export interface TeamRequestVote {
  participantId: ObjectId
  vote: 'approve' | 'reject'
  votedAt: Date
}

export interface TeamRequest {
  _id: ObjectId
  teamId: ObjectId
  authorId: ObjectId
  type: TeamRequestType
  status: TeamRequestStatus
  data: {
    participantId?: ObjectId
    positionId?: ObjectId
    role?: string
    description?: string
    applicationId?: ObjectId
    memberId?: ObjectId
    changes?: Record<string, unknown>
    decisionSystem?: DecisionSystem
    leaderId?: ObjectId
    message?: string
  }
  votes: TeamRequestVote[]
  decidedBy?: ObjectId
  decidedAt?: Date
  createdAt: Date
  resolvedAt?: Date
}

// Application
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface Application {
  _id: ObjectId
  marathonId: ObjectId
  teamId: ObjectId
  participantId: ObjectId
  message?: string
  status: ApplicationStatus
  createdAt: Date
  resolvedAt?: Date
}

// Invitation
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'invalidated'

export interface Invitation {
  _id: ObjectId
  marathonId: ObjectId
  teamId: ObjectId
  participantId: ObjectId
  requestId: ObjectId
  message?: string
  status: InvitationStatus
  createdAt: Date
  resolvedAt?: Date
}

// Session payload
export interface SessionPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

// API Response types
export interface ApiError {
  error: string
  details?: unknown
}

export interface ApiSuccess<T = unknown> {
  status: 'ok'
  data?: T
}
