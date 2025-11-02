/**
 * Query Logger
 * Logs database queries with configurable detail levels and analysis
 */

const fs = require('fs-extra');
const path = require('path');
const { createWriteStream } = require('fs');

class QueryLogger {
  constructor(options = {}) {
    this.options = {
      logPath: options.logPath || path.join(process.cwd(), 'logs', 'queries'),
      logAllQueries: options.logAllQueries || false,
      logSlowQueries: options.logSlowQueries !== false,
      slowQueryThreshold: options.slowQueryThreshold || 1000, // 1 second
      logFailedQueries: options.logFailedQueries !== false,
      includeStackTrace: options.includeStackTrace || false,
      includeQueryPlan: options.includeQueryPlan || false,
      maxLogSize: options.maxLogSize || 100 * 1024 * 1024, // 100MB
      rotateDaily: options.rotateDaily !== false,
    };

    this.queryLogs = [];
    this.slowQueryLogs = [];
    this.failedQueryLogs = [];
    this.queryPatterns = new Map();
    this.currentLogStream = null;
    this.currentSlowLogStream = null;
    this.currentDate = null;

    this.initializeLogDirectory();
    this.setupLogRotation();
  }

  /**
   * Initialize log directory
   */
  async initializeLogDirectory() {
    try {
      await fs.ensureDir(this.options.logPath);
      await fs.ensureDir(path.join(this.options.logPath, 'slow-queries'));
      await fs.ensureDir(path.join(this.options.logPath, 'failed-queries'));
    } catch (error) {
      console.error('Failed to create log directories:', error.message);
    }
  }

  /**
   * Set up log rotation
   */
  setupLogRotation() {
    if (!this.options.rotateDaily) {
      return;
    }

    // Check for rotation every hour
    setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      if (today !== this.currentDate) {
        this.rotateLogFiles();
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Rotate log files
   */
  async rotateLogFiles() {
    // Close existing streams
    if (this.currentLogStream) {
      this.currentLogStream.end();
      this.currentLogStream = null;
    }
    if (this.currentSlowLogStream) {
      this.currentSlowLogStream.end();
      this.currentSlowLogStream = null;
    }

    this.currentDate = new Date().toISOString().split('T')[0];
  }

  /**
   * Get or create log stream
   * @param {string} type - Log type (queries, slow, failed)
   * @returns {WriteStream} Log stream
   */
  getLogStream(type = 'queries') {
    const date = new Date().toISOString().split('T')[0];

    if (date !== this.currentDate) {
      this.rotateLogFiles();
    }

    if (type === 'slow' && !this.currentSlowLogStream) {
      const filename = path.join(
        this.options.logPath,
        'slow-queries',
        `slow-queries-${date}.log`
      );
      this.currentSlowLogStream = createWriteStream(filename, { flags: 'a' });
    } else if (!this.currentLogStream) {
      const filename = path.join(
        this.options.logPath,
        `queries-${date}.log`
      );
      this.currentLogStream = createWriteStream(filename, { flags: 'a' });
    }

    return type === 'slow' ? this.currentSlowLogStream : this.currentLogStream;
  }

  /**
   * Log a query
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @param {number} duration - Execution time in ms
   * @param {boolean} success - Whether query succeeded
   * @param {Error} error - Error if query failed
   */
  async logQuery(query, params = [], duration = 0, success = true, error = null) {
    const timestamp = new Date();
    const logEntry = {
      timestamp,
      query: this.sanitizeQuery(query),
      params: this.sanitizeParams(params),
      duration,
      success,
    };

    if (!success && error) {
      logEntry.error = {
        message: error.message,
        code: error.code,
        detail: error.detail,
      };
    }

    if (this.options.includeStackTrace) {
      logEntry.stackTrace = new Error().stack;
    }

    // Add to in-memory logs (keep limited)
    this.queryLogs.push(logEntry);
    if (this.queryLogs.length > 1000) {
      this.queryLogs.shift();
    }

    // Track query patterns
    this.trackQueryPattern(query);

    // Log to file if enabled
    if (this.options.logAllQueries) {
      await this.writeToLog(logEntry);
    }

    // Handle slow queries
    if (duration > this.options.slowQueryThreshold && this.options.logSlowQueries) {
      await this.logSlowQuery(logEntry);
    }

    // Handle failed queries
    if (!success && this.options.logFailedQueries) {
      await this.logFailedQuery(logEntry);
    }
  }

  /**
   * Log a slow query
   * @param {Object} logEntry - Log entry
   */
  async logSlowQuery(logEntry) {
    const slowEntry = {
      ...logEntry,
      type: 'slow_query',
    };

    // Add query plan if enabled
    if (this.options.includeQueryPlan) {
      // Query plan would be added by caller if available
      slowEntry.note = 'Query plan not available in logger';
    }

    this.slowQueryLogs.push(slowEntry);
    if (this.slowQueryLogs.length > 500) {
      this.slowQueryLogs.shift();
    }

    // Write to slow query log
    const stream = this.getLogStream('slow');
    stream.write(JSON.stringify(slowEntry) + '\n');
  }

  /**
   * Log a failed query
   * @param {Object} logEntry - Log entry
   */
  async logFailedQuery(logEntry) {
    const failedEntry = {
      ...logEntry,
      type: 'failed_query',
    };

    this.failedQueryLogs.push(failedEntry);
    if (this.failedQueryLogs.length > 500) {
      this.failedQueryLogs.shift();
    }

    // Write to failed query log
    const filename = path.join(
      this.options.logPath,
      'failed-queries',
      `failed-queries-${new Date().toISOString().split('T')[0]}.log`
    );

    await fs.appendFile(filename, JSON.stringify(failedEntry) + '\n', 'utf8');
  }

  /**
   * Write log entry to file
   * @param {Object} logEntry - Log entry
   */
  async writeToLog(logEntry) {
    try {
      const stream = this.getLogStream();
      stream.write(JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write query log:', error.message);
    }
  }

  /**
   * Get query logs with filters
   * @param {Object} filters - Filter options
   * @returns {Array} Filtered query logs
   */
  getQueryLogs(filters = {}) {
    let logs = [...this.queryLogs];

    // Filter by success
    if (filters.success !== undefined) {
      logs = logs.filter(log => log.success === filters.success);
    }

    // Filter by duration
    if (filters.minDuration) {
      logs = logs.filter(log => log.duration >= filters.minDuration);
    }
    if (filters.maxDuration) {
      logs = logs.filter(log => log.duration <= filters.maxDuration);
    }

    // Filter by date range
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      logs = logs.filter(log => new Date(log.timestamp) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      logs = logs.filter(log => new Date(log.timestamp) <= end);
    }

    // Filter by query pattern
    if (filters.queryPattern) {
      logs = logs.filter(log =>
        log.query.toLowerCase().includes(filters.queryPattern.toLowerCase())
      );
    }

    // Limit results
    const limit = filters.limit || 100;
    return logs.slice(-limit);
  }

  /**
   * Get slow query logs
   * @param {number} limit - Maximum number of logs to return
   * @returns {Array} Slow query logs
   */
  getSlowQueryLogs(limit = 50) {
    return this.slowQueryLogs.slice(-limit);
  }

  /**
   * Get failed query logs
   * @param {number} limit - Maximum number of logs to return
   * @returns {Array} Failed query logs
   */
  getFailedQueryLogs(limit = 50) {
    return this.failedQueryLogs.slice(-limit);
  }

  /**
   * Track query patterns for analysis
   * @param {string} query - SQL query
   */
  trackQueryPattern(query) {
    const pattern = this.extractQueryPattern(query);

    if (!this.queryPatterns.has(pattern)) {
      this.queryPatterns.set(pattern, {
        pattern,
        count: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
    }

    const stats = this.queryPatterns.get(pattern);
    stats.count++;
    stats.lastSeen = new Date();
  }

  /**
   * Analyze query patterns to detect issues
   * @returns {Object} Pattern analysis
   */
  analyzePatterns() {
    const patterns = Array.from(this.queryPatterns.values());

    // Sort by frequency
    patterns.sort((a, b) => b.count - a.count);

    // Detect potential N+1 queries
    const nPlusOnePatterns = this.detectNPlusOne(patterns);

    // Find duplicate queries
    const duplicateQueries = patterns.filter(p => p.count > 10);

    // Find inefficient patterns
    const inefficientPatterns = this.detectInefficient(patterns);

    return {
      totalPatterns: patterns.length,
      mostFrequent: patterns.slice(0, 10),
      nPlusOne: nPlusOnePatterns,
      duplicates: duplicateQueries,
      inefficient: inefficientPatterns,
      recommendations: this.generatePatternRecommendations(
        nPlusOnePatterns,
        duplicateQueries,
        inefficientPatterns
      ),
    };
  }

  /**
   * Detect potential N+1 query patterns
   * @param {Array} patterns - Query patterns
   * @returns {Array} Potential N+1 queries
   */
  detectNPlusOne(patterns) {
    const nPlusOne = [];

    patterns.forEach(pattern => {
      // Look for repeated single-row SELECTs
      if (
        pattern.pattern.includes('SELECT') &&
        pattern.pattern.includes('WHERE') &&
        pattern.count > 20 &&
        !pattern.pattern.includes('JOIN')
      ) {
        nPlusOne.push({
          pattern: pattern.pattern,
          count: pattern.count,
          suspicion: 'high',
        });
      }
    });

    return nPlusOne;
  }

  /**
   * Detect inefficient query patterns
   * @param {Array} patterns - Query patterns
   * @returns {Array} Inefficient patterns
   */
  detectInefficient(patterns) {
    const inefficient = [];

    patterns.forEach(pattern => {
      const issues = [];

      // SELECT *
      if (pattern.pattern.includes('SELECT *')) {
        issues.push('Uses SELECT * instead of specific columns');
      }

      // No WHERE clause
      if (
        pattern.pattern.includes('SELECT') &&
        !pattern.pattern.includes('WHERE') &&
        !pattern.pattern.includes('LIMIT')
      ) {
        issues.push('Missing WHERE clause or LIMIT');
      }

      // Potentially missing indexes
      if (pattern.pattern.includes('LIKE %')) {
        issues.push('Uses leading wildcard LIKE which cannot use indexes');
      }

      if (issues.length > 0) {
        inefficient.push({
          pattern: pattern.pattern,
          issues,
          count: pattern.count,
        });
      }
    });

    return inefficient;
  }

  /**
   * Generate recommendations based on pattern analysis
   * @param {Array} nPlusOne - N+1 patterns
   * @param {Array} duplicates - Duplicate queries
   * @param {Array} inefficient - Inefficient patterns
   * @returns {Array} Recommendations
   */
  generatePatternRecommendations(nPlusOne, duplicates, inefficient) {
    const recommendations = [];

    if (nPlusOne.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'n+1',
        message: `Detected ${nPlusOne.length} potential N+1 query pattern(s). Consider using JOINs or batch loading.`,
        patterns: nPlusOne.slice(0, 5),
      });
    }

    if (duplicates.length > 10) {
      recommendations.push({
        type: 'info',
        category: 'caching',
        message: `Found ${duplicates.length} frequently repeated queries. Consider implementing caching.`,
        count: duplicates.length,
      });
    }

    if (inefficient.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'optimization',
        message: `Detected ${inefficient.length} inefficient query pattern(s).`,
        patterns: inefficient.slice(0, 5),
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'No obvious query pattern issues detected.',
      });
    }

    return recommendations;
  }

  /**
   * Extract query pattern (normalize query)
   * @param {string} query - SQL query
   * @returns {string} Query pattern
   */
  extractQueryPattern(query) {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\d+/g, 'N')
      .replace(/'[^']*'/g, "'?'")
      .replace(/\$\d+/g, '$?')
      .trim()
      .toUpperCase();
  }

  /**
   * Sanitize query for logging
   * @param {string} query - SQL query
   * @returns {string} Sanitized query
   */
  sanitizeQuery(query) {
    // Optionally redact sensitive data
    return query.replace(/\s+/g, ' ').trim();
  }

  /**
   * Sanitize parameters for logging
   * @param {Array} params - Query parameters
   * @returns {Array} Sanitized parameters
   */
  sanitizeParams(params) {
    // Optionally redact sensitive parameters (passwords, tokens, etc.)
    return params.map(param => {
      if (typeof param === 'string' && param.length > 100) {
        return param.substring(0, 100) + '...[truncated]';
      }
      return param;
    });
  }

  /**
   * Load logs from file
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} type - Log type (queries, slow, failed)
   * @returns {Array} Loaded logs
   */
  async loadLogs(date, type = 'queries') {
    try {
      let filename;

      if (type === 'slow') {
        filename = path.join(this.options.logPath, 'slow-queries', `slow-queries-${date}.log`);
      } else if (type === 'failed') {
        filename = path.join(this.options.logPath, 'failed-queries', `failed-queries-${date}.log`);
      } else {
        filename = path.join(this.options.logPath, `queries-${date}.log`);
      }

      if (!(await fs.pathExists(filename))) {
        return [];
      }

      const content = await fs.readFile(filename, 'utf8');
      const lines = content.trim().split('\n');

      return lines.map(line => JSON.parse(line));
    } catch (error) {
      console.error('Failed to load logs:', error.message);
      return [];
    }
  }

  /**
   * Get query statistics
   * @returns {Object} Query statistics
   */
  getStatistics() {
    const total = this.queryLogs.length;
    const successful = this.queryLogs.filter(log => log.success).length;
    const failed = total - successful;
    const slow = this.slowQueryLogs.length;

    const durations = this.queryLogs.map(log => log.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      total,
      successful,
      failed,
      slow,
      avgDuration: avgDuration.toFixed(2),
      patterns: this.queryPatterns.size,
    };
  }

  /**
   * Clear in-memory logs
   */
  clear() {
    this.queryLogs = [];
    this.slowQueryLogs = [];
    this.failedQueryLogs = [];
    this.queryPatterns.clear();
  }

  /**
   * Close log streams
   */
  close() {
    if (this.currentLogStream) {
      this.currentLogStream.end();
      this.currentLogStream = null;
    }
    if (this.currentSlowLogStream) {
      this.currentSlowLogStream.end();
      this.currentSlowLogStream = null;
    }
  }
}

module.exports = QueryLogger;
