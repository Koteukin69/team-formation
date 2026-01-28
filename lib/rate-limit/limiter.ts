import { collections } from '@/lib/db/collections'
import type { RateLimit } from '@/types'

interface RateLimitConfig {
  limit: number
  windowMs: number
}

const RATE_LIMITS: Record<RateLimit['type'], RateLimitConfig> = {
  email_minute: { limit: 1, windowMs: 60 * 1000 },
  email_hour: { limit: 10, windowMs: 60 * 60 * 1000 },
  api_minute: { limit: 100, windowMs: 60 * 1000 },
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkRateLimit(
  key: string,
  type: RateLimit['type']
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type]
  const rateLimitsCollection = await collections.rateLimits()
  const now = new Date()

  const existing = await rateLimitsCollection.findOne({ key, type })

  if (!existing || existing.expiresAt < now) {
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    }
  }

  const allowed = existing.count < config.limit
  return {
    allowed,
    remaining: Math.max(0, config.limit - existing.count - (allowed ? 1 : 0)),
    resetAt: existing.expiresAt,
  }
}

export async function incrementRateLimit(
  key: string,
  type: RateLimit['type']
): Promise<void> {
  const config = RATE_LIMITS[type]
  const rateLimitsCollection = await collections.rateLimits()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + config.windowMs)

  await rateLimitsCollection.updateOne(
    { key, type },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        windowStart: now,
        expiresAt,
      },
    },
    { upsert: true }
  )
}

export async function checkAndIncrementRateLimit(
  key: string,
  type: RateLimit['type']
): Promise<RateLimitResult> {
  const result = await checkRateLimit(key, type)
  if (result.allowed) {
    await incrementRateLimit(key, type)
  }
  return result
}
