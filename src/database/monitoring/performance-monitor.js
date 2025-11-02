/**
 * Database Performance Monitor
 * Tracks query execution, detects slow queries, and provides performance analytics
 */

const { Client } = require('pg');
const fs = require('fs-extra');
const path = require('path');

class PerformanceMonitor {
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      slowQueryThreshold: options.slowQueryThreshold || 1000, // 1 second
      logPath: options.logPath || path.join(process.cwd(), 'logs', 'performance'),
      maxLogEntries: options.maxLogEntries || 10000,
      enableDetailedLogging: options.enableDetailedLogging || false,
    };

    this.queryStats = new Map();
    this.slowQueries = [];
    this.queryHistory = [];

    this.initializeLogDirectory();
  }

  /**
   * Initialize log directory
   */
  async initializeLogDirectory() {
    try {
      await fs.ensureDir(this.options.logPath);
    } catch (error) {
      console.error('Failed to create log directory:', error.message);
    }
  }

  /**
   * Track a query execution
   * @param {string} query - SQL query
   * @param {number} duration - Execution time in ms
   * @param {Array} params - Query parameters
   * @param {boolean} success - Whether query succeeded
   */
  async trackQuery(query, duration, params = [], success = true) {
    const timestamp = new Date();
    const queryHash = this.hashQuery(query);

    // Update query statistics
    if (!this.queryStats.has(queryHash)) {
      this.queryStats.set(queryHash, {
        query: this.normalizeQuery(query),
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        errors: 0,
        lastExecuted: timestamp,
      });
    }

    const stats = this.queryStats.get(queryHash);
    stats.count++;
    stats.totalDuration += duration;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.avgDuration = stats.totalDuration / stats.count;
    stats.lastExecuted = timestamp;

    if (!success) {
      stats.errors++;
    }

    // Track slow queries
    if (duration > this.options.slowQueryThreshold) {
      const slowQuery = {
        query,
        params,
        duration,
        timestamp,
        stackTrace: this.options.enableDetailedLogging ? new Error().stack : null,
      };

      this.slowQueries.push(slowQuery);

      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }

      // Log slow query
      await this.logSlowQuery(slowQuery);
    }

    // Track query history (keep limited)
    this.queryHistory.push({
      queryHash,
      duration,
      timestamp,
      success,
    });

    if (this.queryHistory.length > this.options.maxLogEntries) {
      this.queryHistory.shift();
    }
  }

  /**
   * Get slow queries above threshold
   * @param {number} threshold - Time threshold in ms
   * @returns {Array} Slow queries
   */
  getSlowQueries(threshold = null) {
    const limit = threshold || this.options.slowQueryThreshold;

    return this.slowQueries
      .filter(q => q.duration > limit)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 50); // Return top 50
  }

  /**
   * Get query statistics
   * @returns {Object} Query statistics
   */
  getQueryStats() {
    const stats = Array.from(this.queryStats.values());

    return {
      totalQueries: this.queryHistory.length,
      uniqueQueries: stats.length,
      slowQueries: this.slowQueries.length,
      avgQueryTime: this.calculateAvgQueryTime(),
      queryFrequency: stats.map(s => ({
        query: s.query,
        count: s.count,
        avgDuration: s.avgDuration.toFixed(2),
        maxDuration: s.maxDuration,
        errors: s.errors,
      })).sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Get index usage statistics from database
   * @returns {Array} Index usage information
   */
  async getIndexUsage() {
    try {
      const client = new Client(this.config);
      await client.connect();

      const query = `
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
      `;

      const result = await client.query(query);
      await client.end();

      // Identify unused indexes
      const unusedIndexes = result.rows.filter(row => row.index_scans === '0');
      const usedIndexes = result.rows.filter(row => row.index_scans !== '0');

      return {
        total: result.rows.length,
        unused: unusedIndexes,
        used: usedIndexes,
        recommendations: this.generateIndexRecommendations(unusedIndexes),
      };
    } catch (error) {
      return {
        error: error.message,
        message: 'Failed to get index usage statistics',
      };
    }
  }

  /**
   * Get table statistics from database
   * @returns {Array} Table statistics
   */
  async getTableStats() {
    try {
      const client = new Client(this.config);
      await client.connect();

      const query = `
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      const result = await client.query(query);
      await client.end();

      return {
        tables: result.rows,
        totalTables: result.rows.length,
        recommendations: this.generateTableRecommendations(result.rows),
      };
    } catch (error) {
      return {
        error: error.message,
        message: 'Failed to get table statistics',
      };
    }
  }

  /**
   * Analyze a query and provide execution plan
   * @param {string} query - SQL query to analyze
   * @param {Array} params - Query parameters
   * @returns {Object} Query analysis
   */
  async analyzeQuery(query, params = []) {
    try {
      const client = new Client(this.config);
      await client.connect();

      // Get execution plan
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON) ${query}`;
      const result = await client.query(explainQuery, params);

      await client.end();

      const plan = result.rows[0]['QUERY PLAN'][0];
      const analysis = this.parseExecutionPlan(plan);

      return {
        query,
        plan,
        analysis,
        recommendations: this.generateQueryRecommendations(plan, analysis),
      };
    } catch (error) {
      return {
        error: error.message,
        query,
        message: 'Failed to analyze query',
      };
    }
  }

  /**
   * Parse execution plan and extract insights
   * @param {Object} plan - Execution plan from EXPLAIN
   * @returns {Object} Parsed analysis
   */
  parseExecutionPlan(plan) {
    const analysis = {
      totalCost: plan['Total Cost'],
      executionTime: plan['Execution Time'],
      planningTime: plan['Planning Time'],
      rowsReturned: plan['Actual Rows'],
      seqScans: 0,
      indexScans: 0,
      bufferHits: 0,
      bufferMisses: 0,
      operations: [],
    };

    // Recursively analyze plan nodes
    const analyzePlanNode = (node) => {
      if (!node) return;

      analysis.operations.push({
        type: node['Node Type'],
        cost: node['Total Cost'],
        rows: node['Actual Rows'],
      });

      if (node['Node Type'] === 'Seq Scan') {
        analysis.seqScans++;
      } else if (node['Node Type'].includes('Index')) {
        analysis.indexScans++;
      }

      if (node['Shared Hit Blocks']) {
        analysis.bufferHits += node['Shared Hit Blocks'];
      }
      if (node['Shared Read Blocks']) {
        analysis.bufferMisses += node['Shared Read Blocks'];
      }

      if (node.Plans) {
        node.Plans.forEach(analyzePlanNode);
      }
    };

    analyzePlanNode(plan.Plan);

    return analysis;
  }

  /**
   * Generate query optimization recommendations
   * @param {Object} plan - Execution plan
   * @param {Object} analysis - Parsed analysis
   * @returns {Array} Recommendations
   */
  generateQueryRecommendations(plan, analysis) {
    const recommendations = [];

    if (analysis.seqScans > 0) {
      recommendations.push({
        type: 'warning',
        message: `Query contains ${analysis.seqScans} sequential scan(s). Consider adding indexes.`,
      });
    }

    if (analysis.executionTime > 1000) {
      recommendations.push({
        type: 'warning',
        message: `Slow query execution time: ${analysis.executionTime.toFixed(2)}ms`,
      });
    }

    if (analysis.bufferMisses > analysis.bufferHits) {
      recommendations.push({
        type: 'info',
        message: 'Low buffer cache hit ratio. Consider increasing shared_buffers.',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'Query appears to be well-optimized.',
      });
    }

    return recommendations;
  }

  /**
   * Generate index recommendations
   * @param {Array} unusedIndexes - List of unused indexes
   * @returns {Array} Recommendations
   */
  generateIndexRecommendations(unusedIndexes) {
    if (unusedIndexes.length === 0) {
      return [{ type: 'success', message: 'All indexes are being used.' }];
    }

    return unusedIndexes.map(index => ({
      type: 'warning',
      message: `Consider dropping unused index: ${index.indexname} on ${index.tablename} (size: ${index.index_size})`,
      index: index.indexname,
      table: index.tablename,
    }));
  }

  /**
   * Generate table maintenance recommendations
   * @param {Array} tables - Table statistics
   * @returns {Array} Recommendations
   */
  generateTableRecommendations(tables) {
    const recommendations = [];

    tables.forEach(table => {
      const deadTuples = parseInt(table.dead_tuples) || 0;
      const liveTuples = parseInt(table.live_tuples) || 0;

      if (deadTuples > 0 && liveTuples > 0) {
        const deadRatio = deadTuples / (liveTuples + deadTuples);

        if (deadRatio > 0.2) {
          recommendations.push({
            type: 'warning',
            message: `Table ${table.tablename} has high dead tuple ratio (${(deadRatio * 100).toFixed(2)}%). Consider running VACUUM.`,
            table: table.tablename,
          });
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'All tables appear to be well-maintained.',
      });
    }

    return recommendations;
  }

  /**
   * Log slow query to file
   * @param {Object} slowQuery - Slow query details
   */
  async logSlowQuery(slowQuery) {
    try {
      const logFile = path.join(
        this.options.logPath,
        `slow-queries-${new Date().toISOString().split('T')[0]}.log`
      );

      const logEntry = {
        timestamp: slowQuery.timestamp,
        duration: `${slowQuery.duration}ms`,
        query: slowQuery.query,
        params: slowQuery.params,
      };

      await fs.appendFile(
        logFile,
        JSON.stringify(logEntry) + '\n',
        'utf8'
      );
    } catch (error) {
      console.error('Failed to log slow query:', error.message);
    }
  }

  /**
   * Calculate average query time from history
   * @returns {number} Average query time in ms
   */
  calculateAvgQueryTime() {
    if (this.queryHistory.length === 0) return 0;

    const total = this.queryHistory.reduce((sum, q) => sum + q.duration, 0);
    return (total / this.queryHistory.length).toFixed(2);
  }

  /**
   * Normalize query for comparison
   * @param {string} query - SQL query
   * @returns {string} Normalized query
   */
  normalizeQuery(query) {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\$\d+/g, '?')
      .trim();
  }

  /**
   * Generate hash for query
   * @param {string} query - SQL query
   * @returns {string} Query hash
   */
  hashQuery(query) {
    const normalized = this.normalizeQuery(query);
    let hash = 0;

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return hash.toString(36);
  }

  /**
   * Reset statistics
   */
  reset() {
    this.queryStats.clear();
    this.slowQueries = [];
    this.queryHistory = [];
  }

  /**
   * Export statistics to file
   * @param {string} outputPath - Output file path
   */
  async exportStats(outputPath) {
    try {
      const stats = {
        summary: this.getQueryStats(),
        slowQueries: this.getSlowQueries(),
        exportedAt: new Date(),
      };

      await fs.writeJson(outputPath, stats, { spaces: 2 });
      return { success: true, path: outputPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = PerformanceMonitor;
