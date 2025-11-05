import { Redis } from '@upstash/redis'

const DAILY_GUEST_LIMIT = 10

/**
 * Get client identifier from request headers
 * Uses IP address or X-Forwarded-For header
 */
function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * Internal function to check rate limit using Upstash Redis
 */
async function checkGuestChatLimit(identifier: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}> {
  // If not in cloud deployment mode, allow unlimited requests
  if (process.env.MORPHIC_CLOUD_DEPLOYMENT !== 'true') {
    return { allowed: true, remaining: Infinity, resetAt: 0, limit: DAILY_GUEST_LIMIT }
  }

  // If Upstash is not configured, allow unlimited requests
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return { allowed: true, remaining: Infinity, resetAt: 0, limit: DAILY_GUEST_LIMIT }
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    })

    // Create daily key with date
    const dateKey = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const key = `rl:guest:chat:${identifier}:${dateKey}`

    // Increment counter with timeout
    const count = await Promise.race([
      redis.incr(key),
      new Promise<number>((_, reject) =>
        setTimeout(() => reject(new Error('Redis timeout')), 3000)
      )
    ])

    // Set expiry on first request of the day
    if (count === 1) {
      const secondsUntilMidnight = getSecondsUntilMidnight()
      await redis.expire(key, secondsUntilMidnight)
    }

    const remaining = Math.max(0, DAILY_GUEST_LIMIT - count)
    const resetAt = getNextMidnightTimestamp()

    return {
      allowed: count <= DAILY_GUEST_LIMIT,
      remaining,
      resetAt,
      limit: DAILY_GUEST_LIMIT
    }
  } catch (error) {
    // On error, allow request to proceed (availability over strict limiting)
    console.error('Guest rate limit check failed:', error)
    return { allowed: true, remaining: Infinity, resetAt: 0, limit: DAILY_GUEST_LIMIT }
  }
}

/**
 * Get seconds until next midnight UTC
 */
function getSecondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}

/**
 * Get timestamp of next midnight UTC
 */
function getNextMidnightTimestamp(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  return midnight.getTime()
}

/**
 * Check and enforce guest chat rate limit
 * Returns a 429 Response if limit is exceeded, null if allowed
 */
export async function checkAndEnforceGuestLimit(
  req: Request
): Promise<Response | null> {
  const identifier = getClientIdentifier(req)
  const result = await checkGuestChatLimit(identifier)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: `You've reached your daily limit of ${result.limit} chat requests. Sign in for unlimited access.`,
        remaining: 0,
        resetAt: result.resetAt,
        limit: result.limit
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt)
        }
      }
    )
  }

  return null
}





