import { Redis } from 'ioredis'
import { NextRequest } from 'next/server'

let redisClient: Redis | null = null
let redisDisabled = false

function getRedis(): Redis {
  if (redisDisabled) {
    throw new Error('Redis rate limiter disabled after connection failures')
  }

  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 500,
      commandTimeout: 500,
      retryStrategy(times) {
        if (times > 1) return null
        return 100
      },
    })
    redisClient.on('error', (err) => {
      console.error('Redis error:', err)
    })
  }
  return redisClient
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset: number // Unix timestamp
  limit: number
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - windowSeconds
  const redisKey = `rl:${key}`

  try {
    const redis = getRedis()
    if (redis.status !== 'ready') {
      await redis.connect()
    }

    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(redisKey, '-inf', windowStart)
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`)
    pipeline.zcard(redisKey)
    pipeline.expire(redisKey, windowSeconds)

    const results = await pipeline.exec()
    const count = (results?.[2]?.[1] as number) ?? 0

    const reset = now + windowSeconds

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      reset,
      limit,
    }
  } catch (err) {
    console.error('Rate limit check failed, allowing request:', err)
    redisDisabled = true
    if (redisClient) {
      redisClient.disconnect(false)
      redisClient = null
    }
    // Fail open — don't block requests if Redis is down
    return { allowed: true, remaining: limit, reset: now + windowSeconds, limit }
  }
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return '127.0.0.1'
}

// Auth-specific rate limiter: 5 attempts per 15 minutes
export async function authRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const ip = getClientIp(req)
  return rateLimit(`auth:${ip}`, 5, 15 * 60)
}

// General API rate limiter: 100 requests per minute
export async function apiRateLimit(req: NextRequest, userId: string): Promise<RateLimitResult> {
  return rateLimit(`api:${userId}`, 100, 60)
}
