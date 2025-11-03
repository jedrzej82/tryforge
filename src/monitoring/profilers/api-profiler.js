/**
 * TryForge API Profiler
 * API endpoint profiling, request/response monitoring, rate limiting
 */

const logger = require('../../utils/logger');

class APIProfiler {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      trackHeaders: false,
      trackPayloads: false,
      maxPayloadSize: 1024, // 1KB
      slowEndpointThreshold: 1000, // 1000ms
      errorRateThreshold: 0.05, // 5%
      ...options
    };

    this.requests = [];
    this.endpoints = new Map();
    this.errors = [];
    this.rateLimits = new Map();
    this.isMonitoring = false;
    this.startTime = null;
  }

  /**
   * Start API profiling
   */
  start() {
    if (this.isMonitoring) {
      logger.warn('API profiling already started');
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();
    this.requests = [];
    this.errors = [];

    logger.info('Starting API profiling');
  }

  /**
   * Stop API profiling
   */
  stop() {
    if (!this.isMonitoring) {
      logger.warn('API profiling not started');
      return null;
    }

    this.isMonitoring = false;

    const duration = Date.now() - this.startTime;
    const profile = this.generateProfile(duration);

    logger.info('Stopped API profiling', {
      duration,
      requests: this.requests.length,
      errors: this.errors.length
    });

    return profile;
  }

  /**
   * Track API request
   */
  trackRequest(endpoint, method, duration, statusCode, metadata = {}) {
    if (!this.isMonitoring) return;

    const request = {
      timestamp: Date.now(),
      endpoint: this.normalizeEndpoint(endpoint),
      rawEndpoint: endpoint,
      method,
      duration,
      statusCode,
      success: statusCode >= 200 && statusCode < 300,
      metadata: {
        userAgent: metadata.userAgent,
        ip: metadata.ip,
        requestSize: metadata.requestSize || 0,
        responseSize: metadata.responseSize || 0,
        query: metadata.query,
        params: metadata.params,
        ...metadata
      }
    };

    this.requests.push(request);

    // Track endpoint statistics
    this.trackEndpointStats(request);

    // Track errors
    if (!request.success) {
      this.errors.push({
        ...request,
        error: metadata.error
      });
    }

    // Check rate limiting
    this.trackRateLimit(request);

    return request;
  }

  /**
   * Normalize endpoint (remove IDs and dynamic segments)
   */
  normalizeEndpoint(endpoint) {
    return endpoint
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
      .replace(/\/[a-f0-9]{24}/g, '/:objectid'); // Replace MongoDB ObjectIDs
  }

  /**
   * Track endpoint statistics
   */
  trackEndpointStats(request) {
    const key = `${request.method} ${request.endpoint}`;

    if (!this.endpoints.has(key)) {
      this.endpoints.set(key, {
        endpoint: request.endpoint,
        method: request.method,
        requests: [],
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        totalDuration: 0,
        durations: []
      });
    }

    const stats = this.endpoints.get(key);
    stats.requests.push(request);
    stats.totalRequests++;
    stats.totalDuration += request.duration;
    stats.durations.push(request.duration);

    if (request.success) {
      stats.successCount++;
    } else {
      stats.errorCount++;
    }

    // Keep only recent requests
    if (stats.requests.length > 1000) {
      stats.requests.shift();
    }

    // Keep only recent durations for percentile calculations
    if (stats.durations.length > 1000) {
      stats.durations.shift();
    }
  }

  /**
   * Track rate limiting
   */
  trackRateLimit(request) {
    const ip = request.metadata.ip || 'unknown';
    const minute = Math.floor(request.timestamp / 60000);
    const key = `${ip}:${minute}`;

    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, {
        ip,
        minute,
        count: 0,
        requests: []
      });
    }

    const rateLimit = this.rateLimits.get(key);
    rateLimit.count++;
    rateLimit.requests.push(request);

    // Clean old rate limit data
    const currentMinute = Math.floor(Date.now() / 60000);
    for (const [k, v] of this.rateLimits.entries()) {
      if (v.minute < currentMinute - 5) { // Keep last 5 minutes
        this.rateLimits.delete(k);
      }
    }
  }

  /**
   * Get endpoint statistics
   */
  getEndpointStats(endpoint, method) {
    const key = `${method} ${this.normalizeEndpoint(endpoint)}`;
    const stats = this.endpoints.get(key);

    if (!stats) return null;

    const sortedDurations = [...stats.durations].sort((a, b) => a - b);
    const p50Index = Math.floor(sortedDurations.length * 0.50);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);

    const errorRate = stats.totalRequests > 0
      ? stats.errorCount / stats.totalRequests
      : 0;

    return {
      endpoint: stats.endpoint,
      method: stats.method,
      totalRequests: stats.totalRequests,
      successCount: stats.successCount,
      errorCount: stats.errorCount,
      errorRate: Math.round(errorRate * 10000) / 100,
      avgDuration: Math.round(stats.totalDuration / stats.totalRequests),
      minDuration: Math.min(...stats.durations),
      maxDuration: Math.max(...stats.durations),
      p50Duration: sortedDurations[p50Index] || 0,
      p95Duration: sortedDurations[p95Index] || 0,
      p99Duration: sortedDurations[p99Index] || 0
    };
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit = 10) {
    const endpointStats = Array.from(this.endpoints.values())
      .map(stats => {
        const avgDuration = stats.totalDuration / stats.totalRequests;
        return {
          endpoint: `${stats.method} ${stats.endpoint}`,
          avgDuration: Math.round(avgDuration),
          requests: stats.totalRequests,
          errorRate: Math.round((stats.errorCount / stats.totalRequests) * 10000) / 100
        };
      })
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);

    return endpointStats;
  }

  /**
   * Get endpoints with highest error rate
   */
  getHighestErrorRateEndpoints(limit = 10) {
    const endpointStats = Array.from(this.endpoints.values())
      .map(stats => {
        const errorRate = stats.errorCount / stats.totalRequests;
        return {
          endpoint: `${stats.method} ${stats.endpoint}`,
          errorRate: Math.round(errorRate * 10000) / 100,
          errorCount: stats.errorCount,
          totalRequests: stats.totalRequests
        };
      })
      .filter(e => e.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);

    return endpointStats;
  }

  /**
   * Get most requested endpoints
   */
  getMostRequestedEndpoints(limit = 10) {
    const endpointStats = Array.from(this.endpoints.values())
      .map(stats => ({
        endpoint: `${stats.method} ${stats.endpoint}`,
        requests: stats.totalRequests,
        avgDuration: Math.round(stats.totalDuration / stats.totalRequests),
        errorRate: Math.round((stats.errorCount / stats.totalRequests) * 10000) / 100
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);

    return endpointStats;
  }

  /**
   * Get rate limit violations
   */
  getRateLimitViolations(threshold = 100) {
    const violations = [];

    for (const [key, rateLimit] of this.rateLimits.entries()) {
      if (rateLimit.count > threshold) {
        violations.push({
          ip: rateLimit.ip,
          minute: rateLimit.minute,
          requestCount: rateLimit.count,
          threshold
        });
      }
    }

    return violations.sort((a, b) => b.requestCount - a.requestCount);
  }

  /**
   * Generate API profile
   */
  generateProfile(duration) {
    const totalRequests = this.requests.length;
    const successfulRequests = this.requests.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const overallErrorRate = totalRequests > 0
      ? (failedRequests / totalRequests) * 100
      : 0;

    // Calculate response time statistics
    const durations = this.requests.map(r => r.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p50Index = Math.floor(sortedDurations.length * 0.50);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);

    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    // Request rate (requests per second)
    const requestRate = totalRequests / (duration / 1000);

    // Method breakdown
    const methodBreakdown = this.requests.reduce((acc, r) => {
      if (!acc[r.method]) acc[r.method] = 0;
      acc[r.method]++;
      return acc;
    }, {});

    // Status code breakdown
    const statusCodeBreakdown = this.requests.reduce((acc, r) => {
      const code = Math.floor(r.statusCode / 100) * 100;
      const key = `${code}xx`;
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {});

    // Calculate payload sizes
    const totalRequestSize = this.requests.reduce((sum, r) => sum + (r.metadata.requestSize || 0), 0);
    const totalResponseSize = this.requests.reduce((sum, r) => sum + (r.metadata.responseSize || 0), 0);

    return {
      duration,
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        errorRate: Math.round(overallErrorRate * 100) / 100,
        requestRate: Math.round(requestRate * 100) / 100,
        avgResponseTime: Math.round(avgDuration),
        p50ResponseTime: sortedDurations[p50Index] || 0,
        p95ResponseTime: sortedDurations[p95Index] || 0,
        p99ResponseTime: sortedDurations[p99Index] || 0,
        minResponseTime: Math.min(...durations) || 0,
        maxResponseTime: Math.max(...durations) || 0
      },
      methods: methodBreakdown,
      statusCodes: statusCodeBreakdown,
      payload: {
        totalRequestSize,
        totalResponseSize,
        avgRequestSize: totalRequests > 0 ? Math.round(totalRequestSize / totalRequests) : 0,
        avgResponseSize: totalRequests > 0 ? Math.round(totalResponseSize / totalRequests) : 0
      },
      endpoints: {
        total: this.endpoints.size,
        slowest: this.getSlowestEndpoints(10),
        mostRequested: this.getMostRequestedEndpoints(10),
        highestErrorRate: this.getHighestErrorRateEndpoints(10)
      },
      errors: {
        total: this.errors.length,
        byStatusCode: this.errors.reduce((acc, e) => {
          if (!acc[e.statusCode]) acc[e.statusCode] = 0;
          acc[e.statusCode]++;
          return acc;
        }, {}),
        recent: this.errors.slice(-10).map(e => ({
          timestamp: e.timestamp,
          endpoint: e.rawEndpoint,
          method: e.method,
          statusCode: e.statusCode,
          duration: e.duration,
          error: e.error
        }))
      },
      rateLimit: {
        violations: this.getRateLimitViolations(100),
        topIPs: this.getTopRequestingIPs(10)
      },
      recommendations: this.generateRecommendations(
        avgDuration,
        overallErrorRate,
        this.getSlowestEndpoints(3)
      )
    };
  }

  /**
   * Get top requesting IPs
   */
  getTopRequestingIPs(limit = 10) {
    const ipCounts = this.requests.reduce((acc, r) => {
      const ip = r.metadata.ip || 'unknown';
      if (!acc[ip]) acc[ip] = 0;
      acc[ip]++;
      return acc;
    }, {});

    return Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, requests: count }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(avgDuration, errorRate, slowestEndpoints) {
    const recommendations = [];

    if (avgDuration > this.options.slowEndpointThreshold) {
      recommendations.push({
        type: 'high_average_response_time',
        severity: 'warning',
        message: `Average response time (${Math.round(avgDuration)}ms) exceeds threshold.`,
        avgDuration
      });
    }

    if (errorRate > this.options.errorRateThreshold * 100) {
      recommendations.push({
        type: 'high_error_rate',
        severity: 'critical',
        message: `Error rate (${errorRate.toFixed(2)}%) exceeds threshold. Investigate failing endpoints.`,
        errorRate
      });
    }

    if (slowestEndpoints.length > 0) {
      const slowest = slowestEndpoints[0];
      if (slowest.avgDuration > this.options.slowEndpointThreshold) {
        recommendations.push({
          type: 'slow_endpoint',
          severity: 'warning',
          message: `Endpoint "${slowest.endpoint}" is slow (${slowest.avgDuration}ms avg). Consider optimization.`,
          endpoint: slowest.endpoint,
          avgDuration: slowest.avgDuration
        });
      }
    }

    return recommendations;
  }

  /**
   * Export profile data
   */
  exportProfile(format = 'json') {
    const profile = this.generateProfile(Date.now() - this.startTime);

    if (format === 'json') {
      return JSON.stringify(profile, null, 2);
    }

    return profile;
  }
}

/**
 * Create Express middleware for API profiling
 */
function createExpressMiddleware(profiler) {
  return (req, res, next) => {
    const startTime = Date.now();

    // Capture request size
    let requestSize = 0;
    if (req.headers['content-length']) {
      requestSize = parseInt(req.headers['content-length'], 10);
    }

    // Capture original methods
    const originalSend = res.send;
    const originalJson = res.json;

    let responseSize = 0;

    // Override send
    res.send = function(data) {
      responseSize = Buffer.byteLength(data || '', 'utf8');
      return originalSend.apply(res, arguments);
    };

    // Override json
    res.json = function(data) {
      responseSize = Buffer.byteLength(JSON.stringify(data || {}), 'utf8');
      return originalJson.apply(res, arguments);
    };

    // Capture response
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      profiler.trackRequest(
        req.path,
        req.method,
        duration,
        res.statusCode,
        {
          userAgent: req.get('user-agent'),
          ip: req.ip || req.connection.remoteAddress,
          query: req.query,
          params: req.params,
          requestSize,
          responseSize
        }
      );
    });

    next();
  };
}

module.exports = {
  APIProfiler,
  createExpressMiddleware
};
