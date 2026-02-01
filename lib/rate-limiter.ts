import clientPromise from '@/lib/db/mongodb'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds?: number
}

let indexCreated = false

async function ensureIndex() {
  if (indexCreated) return
  
  const client = await clientPromise
  const collection = client.db('auth').collection('rate_limits')
  
  await collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  )
  
  indexCreated = true
}

export async function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  await ensureIndex()
  
  const client = await clientPromise
  const collection = client.db('auth').collection('rate_limits')
  
  const windowStart = new Date(Date.now() - windowMs)
  
  const count = await collection.countDocuments({
    key,
    timestamp: { $gte: windowStart }
  })
  
  if (count >= maxRequests) {
    const oldestInWindow = await collection.findOne(
      { key, timestamp: { $gte: windowStart } },
      { sort: { timestamp: 1 } }
    )
    
    let retryAfterSeconds = Math.ceil(windowMs / 1000)
    if (oldestInWindow) {
      const oldestTime = new Date(oldestInWindow.timestamp).getTime()
      const unlockTime = oldestTime + windowMs
      retryAfterSeconds = Math.ceil((unlockTime - Date.now()) / 1000)
    }
    
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds)
    }
  }
  
  return {
    allowed: true,
    remaining: maxRequests - count
  }
}

export async function recordRequest(key: string): Promise<void> {
  const client = await clientPromise
  const collection = client.db('auth').collection('rate_limits')
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
  
  await collection.insertOne({
    key,
    timestamp: now,
    expiresAt
  })
}

export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  return 'unknown'
}
