/**
 * TryForge Log Collector
 * Centralized log collection, aggregation, and analysis
 */

const logger = require('../../utils/logger');

class LogCollector {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxLogs: 100000,
      levels: ['error', 'warn', 'info', 'debug'],
      aggregationInterval: 60000, // 1 minute
      ...options
    };

    this.logs = [];
    this.errorLogs = [];
    this.logStats = new Map();
    this.isCollecting = false;
    this.startTime = null;
    this.aggregationInterval = null;
  }

  /**
   * Start log collection
   */
  start() {
    if (this.isCollecting) {
      logger.warn('Log collection already started');
      return;
    }

    this.isCollecting = true;
    this.startTime = Date.now();

    logger.info('Starting log collection');

    // Start periodic aggregation
    this.aggregationInterval = setInterval(() => {
      this.aggregateLogs();
      this.cleanOldLogs();
    }, this.options.aggregationInterval);
  }

  /**
   * Stop log collection
   */
  stop() {
    if (!this.isCollecting) {
      logger.warn('Log collection not started');
      return;
    }

    this.isCollecting = false;

    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }

    logger.info('Stopped log collection');
  }

  /**
   * Collect log entry
   */
  collectLog(level, message, metadata = {}) {
    if (!this.isCollecting) return;

    if (!this.options.levels.includes(level)) {
      return;
    }

    const logEntry = {
      timestamp: Date.now(),
      level,
      message,
      metadata: {
        service: metadata.service || 'unknown',
        context: metadata.context,
        traceId: metadata.traceId,
        spanId: metadata.spanId,
        ...metadata
      }
    };

    this.logs.push(logEntry);

    // Track error logs separately
    if (level === 'error') {
      this.errorLogs.push(logEntry);
    }

    // Update statistics
    this.updateLogStats(logEntry);

    // Limit log storage
    if (this.logs.length > this.options.maxLogs) {
      this.logs.shift();
    }

    return logEntry;
  }

  /**
   * Update log statistics
   */
  updateLogStats(logEntry) {
    const key = `${logEntry.level}:${logEntry.metadata.service}`;

    if (!this.logStats.has(key)) {
      this.logStats.set(key, {
        level: logEntry.level,
        service: logEntry.metadata.service,
        count: 0,
        lastTimestamp: null
      });
    }

    const stats = this.logStats.get(key);
    stats.count++;
    stats.lastTimestamp = logEntry.timestamp;
  }

  /**
   * Aggregate logs
   */
  aggregateLogs() {
    const now = Date.now();
    const intervalStart = now - this.options.aggregationInterval;

    const recentLogs = this.logs.filter(log => log.timestamp >= intervalStart);

    // Aggregate by level
    const byLevel = recentLogs.reduce((acc, log) => {
      if (!acc[log.level]) acc[log.level] = 0;
      acc[log.level]++;
      return acc;
    }, {});

    // Aggregate by service
    const byService = recentLogs.reduce((acc, log) => {
      const service = log.metadata.service;
      if (!acc[service]) acc[service] = 0;
      acc[service]++;
      return acc;
    }, {});

    return {
      timestamp: now,
      interval: this.options.aggregationInterval,
      total: recentLogs.length,
      byLevel,
      byService
    };
  }

  /**
   * Search logs
   */
  searchLogs(query = {}) {
    let results = [...this.logs];

    // Filter by level
    if (query.level) {
      const levels = Array.isArray(query.level) ? query.level : [query.level];
      results = results.filter(log => levels.includes(log.level));
    }

    // Filter by service
    if (query.service) {
      results = results.filter(log => log.metadata.service === query.service);
    }

    // Filter by message content
    if (query.message) {
      const pattern = query.message instanceof RegExp
        ? query.message
        : new RegExp(query.message, 'i');
      results = results.filter(log => pattern.test(log.message));
    }

    // Filter by trace ID
    if (query.traceId) {
      results = results.filter(log => log.metadata.traceId === query.traceId);
    }

    // Filter by time range
    if (query.startTime) {
      results = results.filter(log => log.timestamp >= query.startTime);
    }
    if (query.endTime) {
      results = results.filter(log => log.timestamp <= query.endTime);
    }

    // Sort
    if (query.sort === 'asc') {
      results.sort((a, b) => a.timestamp - b.timestamp);
    } else {
      results.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit = 100) {
    return this.errorLogs
      .slice(-limit)
      .reverse()
      .map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        service: log.metadata.service,
        context: log.metadata.context,
        traceId: log.metadata.traceId,
        stack: log.metadata.stack
      }));
  }

  /**
   * Get log statistics
   */
  getStatistics(timeRange = 3600000) { // Default 1 hour
    const now = Date.now();
    const cutoff = now - timeRange;

    const recentLogs = this.logs.filter(log => log.timestamp >= cutoff);
    const recentErrors = this.errorLogs.filter(log => log.timestamp >= cutoff);

    // Count by level
    const byLevel = recentLogs.reduce((acc, log) => {
      if (!acc[log.level]) acc[log.level] = 0;
      acc[log.level]++;
      return acc;
    }, {});

    // Count by service
    const byService = recentLogs.reduce((acc, log) => {
      const service = log.metadata.service;
      if (!acc[service]) {
        acc[service] = {
          total: 0,
          errors: 0,
          warnings: 0
        };
      }
      acc[service].total++;
      if (log.level === 'error') acc[service].errors++;
      if (log.level === 'warn') acc[service].warnings++;
      return acc;
    }, {});

    // Find most common errors
    const errorMessages = recentErrors.reduce((acc, log) => {
      const message = log.message;
      if (!acc[message]) {
        acc[message] = {
          message,
          count: 0,
          lastSeen: null
        };
      }
      acc[message].count++;
      acc[message].lastSeen = log.timestamp;
      return acc;
    }, {});

    const topErrors = Object.values(errorMessages)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate error rate
    const errorRate = recentLogs.length > 0
      ? (recentErrors.length / recentLogs.length) * 100
      : 0;

    return {
      timeRange,
      total: recentLogs.length,
      byLevel,
      byService,
      errors: {
        total: recentErrors.length,
        rate: Math.round(errorRate * 100) / 100,
        topErrors
      }
    };
  }

  /**
   * Analyze log patterns
   */
  analyzePatterns(timeRange = 3600000) {
    const now = Date.now();
    const cutoff = now - timeRange;

    const recentLogs = this.logs.filter(log => log.timestamp >= cutoff);

    // Find repeated error patterns
    const errorPatterns = new Map();

    recentLogs
      .filter(log => log.level === 'error')
      .forEach(log => {
        // Normalize error message (remove numbers, IDs, etc.)
        const normalized = log.message
          .replace(/\d+/g, 'N')
          .replace(/[a-f0-9-]{36}/g, 'UUID')
          .replace(/[a-f0-9]{24}/g, 'ID');

        if (!errorPatterns.has(normalized)) {
          errorPatterns.set(normalized, {
            pattern: normalized,
            count: 0,
            examples: [],
            services: new Set()
          });
        }

        const pattern = errorPatterns.get(normalized);
        pattern.count++;
        pattern.services.add(log.metadata.service);

        if (pattern.examples.length < 3) {
          pattern.examples.push({
            timestamp: log.timestamp,
            message: log.message,
            service: log.metadata.service
          });
        }
      });

    return Array.from(errorPatterns.values())
      .map(p => ({
        ...p,
        services: Array.from(p.services)
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Clean old logs
   */
  cleanOldLogs() {
    const cutoff = Date.now() - this.options.retentionPeriod;

    this.logs = this.logs.filter(log => log.timestamp >= cutoff);
    this.errorLogs = this.errorLogs.filter(log => log.timestamp >= cutoff);

    // Clean log stats
    for (const [key, stats] of this.logStats.entries()) {
      if (stats.lastTimestamp < cutoff) {
        this.logStats.delete(key);
      }
    }
  }

  /**
   * Export logs
   */
  exportLogs(format = 'json', query = {}) {
    const logs = this.searchLogs(query);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    if (format === 'csv') {
      const header = 'timestamp,level,service,message\n';
      const rows = logs.map(log =>
        `${log.timestamp},${log.level},${log.metadata.service},"${log.message.replace(/"/g, '""')}"`
      ).join('\n');
      return header + rows;
    }

    if (format === 'text') {
      return logs.map(log =>
        `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] [${log.metadata.service}] ${log.message}`
      ).join('\n');
    }

    return logs;
  }

  /**
   * Get log summary
   */
  getSummary() {
    return {
      totalLogs: this.logs.length,
      errorLogs: this.errorLogs.length,
      services: new Set(this.logs.map(log => log.metadata.service)).size,
      logStats: Array.from(this.logStats.values()),
      isCollecting: this.isCollecting,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Reset collector
   */
  reset() {
    this.logs = [];
    this.errorLogs = [];
    this.logStats.clear();
    logger.info('Log collector reset');
  }
}

/**
 * Create Winston transport for log collection
 */
function createWinstonTransport(collector) {
  const Transport = require('winston-transport');

  return class LogCollectorTransport extends Transport {
    constructor(opts) {
      super(opts);
    }

    log(info, callback) {
      collector.collectLog(
        info.level,
        info.message,
        {
          ...info,
          timestamp: info.timestamp || Date.now()
        }
      );

      callback();
    }
  };
}

module.exports = {
  LogCollector,
  createWinstonTransport
};
