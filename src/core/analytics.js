/**
 * Real-Time Analytics Engine
 * Stream processing and real-time metrics
 */

const Redis = require('ioredis');
const EventEmitter = require('events');
const Logger = require('../utils/logger');

class AnalyticsEngine extends EventEmitter {
  constructor(redisConfig = {}) {
    super();
    
    this.redis = new Redis({
      host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig.port || process.env.REDIS_PORT || 6379,
      password: redisConfig.password || process.env.REDIS_PASSWORD
    });
    
    this.subscriber = this.redis.duplicate();
    this.logger = new Logger();
    this.metrics = new Map();
    this.streams = new Map();
  }

  /**
   * Track event in real-time
   */
  async trackEvent(eventName, data = {}, options = {}) {
    const timestamp = Date.now();
    const event = {
      name: eventName,
      timestamp,
      data,
      ...options
    };

    // Store in Redis stream
    const streamKey = `analytics:stream:${eventName}`;
    await this.redis.xadd(
      streamKey,
      'MAXLEN', '~', options.maxLength || 10000,
      '*',
      'data', JSON.stringify(event)
    );

    // Update counters
    await this.incrementCounter(eventName);
    
    // Update metrics
    if (options.value) {
      await this.updateMetric(eventName, options.value);
    }

    // Emit event for real-time subscribers
    this.emit('event', event);
    
    return event;
  }

  /**
   * Increment counter
   */
  async incrementCounter(name, amount = 1) {
    const key = `analytics:counter:${name}`;
    return await this.redis.incrby(key, amount);
  }

  /**
   * Get counter value
   */
  async getCounter(name) {
    const key = `analytics:counter:${name}`;
    const value = await this.redis.get(key);
    return parseInt(value) || 0;
  }

  /**
   * Update metric (for averages, sums, etc.)
   */
  async updateMetric(name, value) {
    const key = `analytics:metric:${name}`;
    
    // Store in sorted set with timestamp as score
    await this.redis.zadd(key, Date.now(), JSON.stringify({
      value,
      timestamp: Date.now()
    }));
    
    // Keep only recent values (last hour)
    const hourAgo = Date.now() - 3600000;
    await this.redis.zremrangebyscore(key, 0, hourAgo);
  }

  /**
   * Calculate metric statistics
   */
  async getMetricStats(name, windowMs = 3600000) {
    const key = `analytics:metric:${name}`;
    const since = Date.now() - windowMs;
    
    const values = await this.redis.zrangebyscore(key, since, '+inf');
    
    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }
    
    const numbers = values.map(v => JSON.parse(v).value);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    
    return {
      count: numbers.length,
      sum,
      avg,
      min,
      max,
      window: `${windowMs / 1000}s`
    };
  }

  /**
   * Time-series data aggregation
   */
  async aggregateTimeSeries(eventName, interval = 60000, windowMs = 3600000) {
    const streamKey = `analytics:stream:${eventName}`;
    const since = Date.now() - windowMs;
    
    // Get events from stream
    const events = await this.redis.xrange(streamKey, since, '+');
    
    // Group by interval
    const buckets = new Map();
    
    for (const [id, fields] of events) {
      const data = JSON.parse(fields[1]); // fields[1] is the 'data' field
      const bucketTime = Math.floor(data.timestamp / interval) * interval;
      
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime).push(data);
    }
    
    // Calculate aggregates for each bucket
    const result = [];
    for (const [time, events] of buckets) {
      result.push({
        timestamp: time,
        count: events.length,
        events
      });
    }
    
    return result.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Real-time dashboard data
   */
  async getDashboardData() {
    const stats = {
      timestamp: Date.now(),
      counters: {},
      metrics: {},
      topEvents: []
    };

    // Get all counter keys
    const counterKeys = await this.redis.keys('analytics:counter:*');
    for (const key of counterKeys) {
      const name = key.replace('analytics:counter:', '');
      stats.counters[name] = await this.getCounter(name);
    }

    // Get all metric keys
    const metricKeys = await this.redis.keys('analytics:metric:*');
    for (const key of metricKeys) {
      const name = key.replace('analytics:metric:', '');
      stats.metrics[name] = await this.getMetricStats(name);
    }

    // Get top events (last 10 minutes)
    const streams = await this.redis.keys('analytics:stream:*');
    for (const stream of streams.slice(0, 5)) {
      const name = stream.replace('analytics:stream:', '');
      const recent = await this.redis.xrevrange(stream, '+', '-', 'COUNT', 10);
      
      if (recent.length > 0) {
        stats.topEvents.push({
          name,
          count: recent.length,
          latest: JSON.parse(recent[0][1][1])
        });
      }
    }

    return stats;
  }

  /**
   * Subscribe to real-time events
   */
  async subscribeToEvents(pattern = '*', callback) {
    await this.subscriber.psubscribe(`analytics:events:${pattern}`);
    
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      const event = JSON.parse(message);
      callback(event);
    });
  }

  /**
   * Publish event for subscribers
   */
  async publishEvent(eventName, data) {
    const event = { name: eventName, data, timestamp: Date.now() };
    await this.redis.publish(
      `analytics:events:${eventName}`,
      JSON.stringify(event)
    );
  }

  /**
   * User session tracking
   */
  async trackSession(userId, sessionData = {}) {
    const sessionKey = `analytics:session:${userId}`;
    
    await this.redis.hmset(sessionKey, {
      userId,
      startTime: Date.now(),
      ...sessionData
    });
    
    await this.redis.expire(sessionKey, 3600); // 1 hour TTL
  }

  /**
   * Get active users count
   */
  async getActiveUsers(windowMs = 300000) {
    // Get unique user IDs from recent events
    const since = Date.now() - windowMs;
    const streams = await this.redis.keys('analytics:stream:*');
    
    const userIds = new Set();
    
    for (const stream of streams) {
      const events = await this.redis.xrange(stream, since, '+');
      for (const [id, fields] of events) {
        const data = JSON.parse(fields[1]);
        if (data.data && data.data.userId) {
          userIds.add(data.data.userId);
        }
      }
    }
    
    return userIds.size;
  }

  /**
   * Funnel analysis
   */
  async analyzeFunnel(steps, windowMs = 86400000) {
    const since = Date.now() - windowMs;
    const result = [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const count = await this.redis.zcount(
        `analytics:metric:${step}`,
        since,
        '+inf'
      );
      
      const dropoff = i > 0 ? ((result[i - 1].count - count) / result[i - 1].count * 100) : 0;
      
      result.push({
        step,
        count,
        dropoff: dropoff.toFixed(2) + '%'
      });
    }
    
    return result;
  }

  /**
   * Close connections
   */
  async close() {
    await this.redis.quit();
    await this.subscriber.quit();
    this.logger.info('Analytics engine closed');
  }
}

module.exports = AnalyticsEngine;
