/**
 * TryForge Database Profiler
 * SQL query profiling, slow query detection, N+1 detection
 */

const logger = require('../../utils/logger');

class DatabaseProfiler {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      slowQueryThreshold: 100, // 100ms
      trackQueries: true,
      detectN1: true,
      trackConnections: true,
      maxTrackedQueries: 10000,
      ...options
    };

    this.queries = [];
    this.slowQueries = [];
    this.n1Patterns = [];
    this.connectionPool = {
      active: 0,
      idle: 0,
      waiting: 0,
      total: 0
    };
    this.isMonitoring = false;
    this.startTime = null;
    this.queryPatterns = new Map();
  }

  /**
   * Start database profiling
   */
  start() {
    if (this.isMonitoring) {
      logger.warn('Database profiling already started');
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();
    this.queries = [];
    this.slowQueries = [];
    this.n1Patterns = [];

    logger.info('Starting database profiling', {
      slowQueryThreshold: this.options.slowQueryThreshold
    });
  }

  /**
   * Stop database profiling
   */
  stop() {
    if (!this.isMonitoring) {
      logger.warn('Database profiling not started');
      return null;
    }

    this.isMonitoring = false;

    const duration = Date.now() - this.startTime;
    const profile = this.generateProfile(duration);

    logger.info('Stopped database profiling', {
      duration,
      queries: this.queries.length,
      slowQueries: this.slowQueries.length
    });

    return profile;
  }

  /**
   * Track database query
   */
  trackQuery(query, duration, metadata = {}) {
    if (!this.isMonitoring) return;

    const queryData = {
      timestamp: Date.now(),
      query: this.normalizeQuery(query),
      rawQuery: query,
      duration,
      slow: duration > this.options.slowQueryThreshold,
      metadata: {
        database: metadata.database,
        table: this.extractTableName(query),
        operation: this.extractOperation(query),
        ...metadata
      }
    };

    this.queries.push(queryData);

    // Track slow queries
    if (queryData.slow) {
      this.slowQueries.push(queryData);
    }

    // Track query patterns for N+1 detection
    this.trackQueryPattern(queryData);

    // Limit stored queries
    if (this.queries.length > this.options.maxTrackedQueries) {
      this.queries.shift();
    }

    return queryData;
  }

  /**
   * Normalize query (remove specific values)
   */
  normalizeQuery(query) {
    return query
      .replace(/\d+/g, '?') // Replace numbers with ?
      .replace(/'[^']*'/g, '?') // Replace string values with ?
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract table name from query
   */
  extractTableName(query) {
    const match = query.match(/(?:FROM|INTO|UPDATE|JOIN)\s+([a-zA-Z0-9_]+)/i);
    return match ? match[1] : 'unknown';
  }

  /**
   * Extract operation type from query
   */
  extractOperation(query) {
    const normalized = query.trim().toUpperCase();
    if (normalized.startsWith('SELECT')) return 'SELECT';
    if (normalized.startsWith('INSERT')) return 'INSERT';
    if (normalized.startsWith('UPDATE')) return 'UPDATE';
    if (normalized.startsWith('DELETE')) return 'DELETE';
    return 'OTHER';
  }

  /**
   * Track query pattern for N+1 detection
   */
  trackQueryPattern(queryData) {
    const pattern = queryData.query;
    const timestamp = queryData.timestamp;

    if (!this.queryPatterns.has(pattern)) {
      this.queryPatterns.set(pattern, {
        pattern,
        count: 0,
        timestamps: [],
        durations: []
      });
    }

    const patternData = this.queryPatterns.get(pattern);
    patternData.count++;
    patternData.timestamps.push(timestamp);
    patternData.durations.push(queryData.duration);

    // Keep only recent timestamps (last 5 seconds)
    const recentThreshold = timestamp - 5000;
    patternData.timestamps = patternData.timestamps.filter(t => t >= recentThreshold);

    // Detect N+1 if same query executed many times in short period
    if (patternData.timestamps.length >= 10) {
      this.detectN1Pattern(pattern, patternData);
    }
  }

  /**
   * Detect N+1 query pattern
   */
  detectN1Pattern(pattern, patternData) {
    // Check if this N+1 pattern already detected
    const exists = this.n1Patterns.find(p => p.pattern === pattern);
    if (exists) return;

    const n1Pattern = {
      timestamp: Date.now(),
      pattern,
      count: patternData.count,
      recentExecutions: patternData.timestamps.length,
      avgDuration: patternData.durations.reduce((sum, d) => sum + d, 0) / patternData.durations.length,
      totalDuration: patternData.durations.reduce((sum, d) => sum + d, 0),
      severity: patternData.timestamps.length > 50 ? 'critical' : 'warning'
    };

    this.n1Patterns.push(n1Pattern);

    logger.warn('N+1 query pattern detected', {
      pattern,
      executions: patternData.timestamps.length
    });

    return n1Pattern;
  }

  /**
   * Update connection pool stats
   */
  updateConnectionPool(stats) {
    this.connectionPool = {
      active: stats.active || 0,
      idle: stats.idle || 0,
      waiting: stats.waiting || 0,
      total: stats.total || 0,
      timestamp: Date.now()
    };
  }

  /**
   * Analyze query performance
   */
  analyzeQueryPerformance(query) {
    const pattern = this.normalizeQuery(query);
    const matchingQueries = this.queries.filter(q => q.query === pattern);

    if (matchingQueries.length === 0) {
      return null;
    }

    const durations = matchingQueries.map(q => q.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);

    return {
      pattern,
      executions: matchingQueries.length,
      statistics: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        median: sortedDurations[Math.floor(sortedDurations.length / 2)],
        p95: sortedDurations[Math.floor(sortedDurations.length * 0.95)],
        p99: sortedDurations[Math.floor(sortedDurations.length * 0.99)]
      },
      slowCount: matchingQueries.filter(q => q.slow).length
    };
  }

  /**
   * Get slowest queries
   */
  getSlowestQueries(limit = 10) {
    return [...this.slowQueries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(q => ({
        query: q.rawQuery,
        normalizedQuery: q.query,
        duration: q.duration,
        timestamp: q.timestamp,
        table: q.metadata.table,
        operation: q.metadata.operation
      }));
  }

  /**
   * Get most frequent queries
   */
  getMostFrequentQueries(limit = 10) {
    const patterns = Array.from(this.queryPatterns.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return patterns.map(p => ({
      pattern: p.pattern,
      count: p.count,
      avgDuration: p.durations.reduce((sum, d) => sum + d, 0) / p.durations.length,
      totalDuration: p.durations.reduce((sum, d) => sum + d, 0)
    }));
  }

  /**
   * Generate database profile
   */
  generateProfile(duration) {
    const totalQueries = this.queries.length;
    const slowQueryCount = this.slowQueries.length;
    const slowQueryPercent = totalQueries > 0 ? (slowQueryCount / totalQueries) * 100 : 0;

    // Calculate statistics
    const durations = this.queries.map(q => q.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);

    // Query breakdown by operation
    const operationBreakdown = this.queries.reduce((acc, q) => {
      const op = q.metadata.operation;
      if (!acc[op]) acc[op] = 0;
      acc[op]++;
      return acc;
    }, {});

    // Table access frequency
    const tableAccess = this.queries.reduce((acc, q) => {
      const table = q.metadata.table;
      if (!acc[table]) {
        acc[table] = { reads: 0, writes: 0, total: 0 };
      }
      acc[table].total++;
      if (q.metadata.operation === 'SELECT') {
        acc[table].reads++;
      } else {
        acc[table].writes++;
      }
      return acc;
    }, {});

    return {
      duration,
      queries: {
        total: totalQueries,
        slow: slowQueryCount,
        slowPercent: Math.round(slowQueryPercent * 100) / 100,
        avgDuration: Math.round(avgDuration),
        p95Duration: sortedDurations[p95Index] || 0,
        p99Duration: sortedDurations[p99Index] || 0,
        minDuration: Math.min(...durations) || 0,
        maxDuration: Math.max(...durations) || 0
      },
      operations: operationBreakdown,
      tables: tableAccess,
      slowQueries: this.getSlowestQueries(10),
      frequentQueries: this.getMostFrequentQueries(10),
      n1Patterns: this.n1Patterns.map(p => ({
        pattern: p.pattern,
        executions: p.recentExecutions,
        avgDuration: Math.round(p.avgDuration),
        totalDuration: Math.round(p.totalDuration),
        severity: p.severity
      })),
      connectionPool: this.connectionPool,
      recommendations: this.generateRecommendations(
        slowQueryPercent,
        this.n1Patterns.length,
        avgDuration
      )
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(slowQueryPercent, n1Count, avgDuration) {
    const recommendations = [];

    if (slowQueryPercent > 10) {
      recommendations.push({
        type: 'high_slow_query_rate',
        severity: 'warning',
        message: `${slowQueryPercent.toFixed(1)}% of queries are slow. Consider adding indexes or optimizing queries.`,
        slowQueryPercent
      });
    }

    if (n1Count > 0) {
      recommendations.push({
        type: 'n1_queries_detected',
        severity: 'critical',
        message: `${n1Count} N+1 query patterns detected. Use eager loading or batch queries.`,
        n1Count
      });
    }

    if (avgDuration > 50) {
      recommendations.push({
        type: 'high_average_duration',
        severity: 'info',
        message: `Average query duration is ${avgDuration.toFixed(0)}ms. Consider query optimization.`,
        avgDuration
      });
    }

    // Check connection pool
    if (this.connectionPool.waiting > 0) {
      recommendations.push({
        type: 'connection_pool_saturation',
        severity: 'warning',
        message: 'Connection pool has waiting connections. Consider increasing pool size.',
        waiting: this.connectionPool.waiting
      });
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

  /**
   * Get query execution plan (mock - would use EXPLAIN in real implementation)
   */
  async getExecutionPlan(query) {
    return {
      query,
      plan: 'Execution plan would be retrieved from database',
      estimatedCost: 0,
      actualRows: 0,
      indexes: []
    };
  }
}

/**
 * Create database profiler middleware for common ORMs
 */
function createORMMiddleware(profiler, orm = 'generic') {
  return (query, duration, metadata) => {
    profiler.trackQuery(query, duration, metadata);
  };
}

module.exports = {
  DatabaseProfiler,
  createORMMiddleware
};
