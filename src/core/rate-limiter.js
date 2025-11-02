/**
 * Rate Limiter Middleware
 * API rate limiting and quota management
 */

const Redis = require('ioredis');
const Logger = require('../utils/logger');

class RateLimiter {
  constructor(redisConfig = {}) {
    this.redis = new Redis({
      host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig.port || process.env.REDIS_PORT || 6379,
      password: redisConfig.password || process.env.REDIS_PASSWORD
    });
    
    this.logger = new Logger();
  }

  /**
   * Simple rate limiter (requests per window)
   */
  async limit(key, max, windowMs) {
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.pexpire(key, windowMs);
    }
    
    const ttl = await this.redis.pttl(key);
    
    return {
      allowed: current <= max,
      current,
      remaining: Math.max(0, max - current),
      resetAt: Date.now() + ttl
    };
  }

  /**
   * Sliding window rate limiter
   */
  async slidingWindowLimit(key, max, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current entries
    const current = await this.redis.zcard(key);
    
    if (current < max) {
      // Add new entry
      await this.redis.zadd(key, now, `${now}-${Math.random()}`);
      await this.redis.pexpire(key, windowMs);
      
      return {
        allowed: true,
        current: current + 1,
        remaining: max - current - 1,
        resetAt: now + windowMs
      };
    }
    
    // Get oldest entry to calculate reset time
    const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetAt = oldest.length > 0 ? parseInt(oldest[1]) + windowMs : now + windowMs;
    
    return {
      allowed: false,
      current,
      remaining: 0,
      resetAt
    };
  }

  /**
   * Token bucket rate limiter
   */
  async tokenBucket(key, capacity, refillRate, refillInterval) {
    const bucketKey = `bucket:${key}`;
    const timestampKey = `bucket:${key}:ts`;
    
    const now = Date.now();
    const lastRefill = await this.redis.get(timestampKey);
    const tokens = await this.redis.get(bucketKey);
    
    let currentTokens = tokens ? parseInt(tokens) : capacity;
    const lastRefillTime = lastRefill ? parseInt(lastRefill) : now;
    
    // Calculate tokens to add
    const elapsed = now - lastRefillTime;
    const intervalsElapsed = Math.floor(elapsed / refillInterval);
    const tokensToAdd = intervalsElapsed * refillRate;
    
    if (tokensToAdd > 0) {
      currentTokens = Math.min(capacity, currentTokens + tokensToAdd);
      await this.redis.set(timestampKey, now);
    }
    
    if (currentTokens >= 1) {
      currentTokens -= 1;
      await this.redis.set(bucketKey, currentTokens);
      await this.redis.expire(bucketKey, Math.ceil(refillInterval * capacity / refillRate / 1000));
      
      return {
        allowed: true,
        tokensRemaining: currentTokens,
        resetAt: now + refillInterval
      };
    }
    
    return {
      allowed: false,
      tokensRemaining: 0,
      resetAt: now + refillInterval
    };
  }

  /**
   * Express middleware factory
   */
  middleware(options = {}) {
    const {
      max = 100,
      windowMs = 60000, // 1 minute
      keyGenerator = (req) => req.ip,
      handler = null,
      strategy = 'simple' // simple, sliding, token
    } = options;

    return async (req, res, next) => {
      const key = `ratelimit:${keyGenerator(req)}`;
      
      let result;
      
      try {
        switch (strategy) {
          case 'sliding':
            result = await this.slidingWindowLimit(key, max, windowMs);
            break;
          case 'token':
            result = await this.tokenBucket(key, max, 1, windowMs / max);
            break;
          default:
            result = await this.limit(key, max, windowMs);
        }
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', result.remaining || result.tokensRemaining || 0);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());
        
        if (!result.allowed) {
          if (handler) {
            return handler(req, res, next);
          }
          
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
          });
        }
        
        next();
      } catch (error) {
        this.logger.error('Rate limiter error:', error);
        next(error);
      }
    };
  }

  /**
   * Quota system (daily/monthly limits)
   */
  async checkQuota(userId, quotaType, limit, period = 'daily') {
    const now = new Date();
    const periodKey = period === 'daily' 
      ? `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`
      : `${now.getFullYear()}-${now.getMonth()+1}`;
    
    const key = `quota:${userId}:${quotaType}:${periodKey}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      // Set expiration: 48 hours for daily, 35 days for monthly
      const expiry = period === 'daily' ? 48 * 3600 : 35 * 24 * 3600;
      await this.redis.expire(key, expiry);
    }
    
    return {
      allowed: current <= limit,
      used: current,
      remaining: Math.max(0, limit - current),
      limit,
      period,
      periodKey
    };
  }

  /**
   * Close Redis connection
   */
  async close() {
    await this.redis.quit();
    this.logger.info('Rate limiter Redis connection closed');
  }
}

module.exports = RateLimiter;
