/**
 * Database Metrics Collector
 * Collects, stores, and exports database metrics for monitoring and analysis
 */

const { Client } = require('pg');
const fs = require('fs-extra');
const path = require('path');

class MetricsCollector {
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      collectionInterval: options.collectionInterval || 60000, // 1 minute
      retentionPeriod: options.retentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
      storagePath: options.storagePath || path.join(process.cwd(), 'data', 'metrics'),
      enablePrometheus: options.enablePrometheus || true,
      maxHistorySize: options.maxHistorySize || 10080, // 7 days at 1-minute intervals
    };

    this.metricsHistory = [];
    this.isCollecting = false;
    this.collectionInterval = null;

    this.initializeStorage();
  }

  /**
   * Initialize metrics storage
   */
  async initializeStorage() {
    try {
      await fs.ensureDir(this.options.storagePath);
    } catch (error) {
      console.error('Failed to create metrics storage directory:', error.message);
    }
  }

  /**
   * Start collecting metrics
   */
  startCollection() {
    if (this.isCollecting) {
      return;
    }

    this.isCollecting = true;

    // Collect immediately
    this.collect().catch(err => console.error('Initial metric collection failed:', err));

    // Set up periodic collection
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collect();
      } catch (error) {
        console.error('Metric collection failed:', error.message);
      }
    }, this.options.collectionInterval);
  }

  /**
   * Stop collecting metrics
   */
  stopCollection() {
    if (!this.isCollecting) {
      return;
    }

    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Collect all metrics
   * @returns {Object} Collected metrics
   */
  async collect() {
    const timestamp = new Date();

    try {
      const metrics = {
        timestamp,
        queries: await this.collectQueryMetrics(),
        connections: await this.collectConnectionMetrics(),
        tables: await this.collectTableMetrics(),
        performance: await this.collectPerformanceMetrics(),
        system: await this.collectSystemMetrics(),
      };

      // Store in history
      this.metricsHistory.push(metrics);

      // Trim history to max size
      if (this.metricsHistory.length > this.options.maxHistorySize) {
        this.metricsHistory.shift();
      }

      // Persist to disk
      await this.persistMetrics(metrics);

      // Clean old metrics
      await this.cleanOldMetrics();

      return metrics;
    } catch (error) {
      console.error('Failed to collect metrics:', error.message);
      return {
        timestamp,
        error: error.message,
      };
    }
  }

  /**
   * Collect query metrics
   * @returns {Object} Query metrics
   */
  async collectQueryMetrics() {
    try {
      const client = new Client(this.config);
      await client.connect();

      // Try to get query statistics from pg_stat_statements
      try {
        const result = await client.query(`
          SELECT
            COUNT(*) as total_queries,
            SUM(calls) as total_calls,
            AVG(mean_exec_time) as avg_time,
            MAX(max_exec_time) as max_time,
            SUM(calls) FILTER (WHERE mean_exec_time > 1000) as slow_queries
          FROM pg_stat_statements
        `);

        await client.end();

        const row = result.rows[0] || {};

        return {
          totalQueries: parseInt(row.total_queries) || 0,
          totalCalls: parseInt(row.total_calls) || 0,
          avgTime: parseFloat(row.avg_time) || 0,
          maxTime: parseFloat(row.max_time) || 0,
          slowQueries: parseInt(row.slow_queries) || 0,
        };
      } catch (err) {
        // pg_stat_statements not available
        await client.end();

        return {
          totalQueries: 0,
          totalCalls: 0,
          avgTime: 0,
          maxTime: 0,
          slowQueries: 0,
          note: 'pg_stat_statements extension not available',
        };
      }
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  /**
   * Collect connection metrics
   * @returns {Object} Connection metrics
   */
  async collectConnectionMetrics() {
    try {
      const client = new Client(this.config);
      await client.connect();

      const result = await client.query(`
        SELECT
          COUNT(*) as total_connections,
          COUNT(*) FILTER (WHERE state = 'active') as active,
          COUNT(*) FILTER (WHERE state = 'idle') as idle,
          COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          COUNT(*) FILTER (WHERE wait_event IS NOT NULL) as waiting,
          MAX(EXTRACT(EPOCH FROM (NOW() - backend_start))) as max_connection_age
        FROM pg_stat_activity
        WHERE pid != pg_backend_pid()
      `);

      await client.end();

      const row = result.rows[0] || {};

      return {
        total: parseInt(row.total_connections) || 0,
        active: parseInt(row.active) || 0,
        idle: parseInt(row.idle) || 0,
        idleInTransaction: parseInt(row.idle_in_transaction) || 0,
        waiting: parseInt(row.waiting) || 0,
        maxAge: parseFloat(row.max_connection_age) || 0,
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  /**
   * Collect table metrics
   * @returns {Object} Table metrics
   */
  async collectTableMetrics() {
    try {
      const client = new Client(this.config);
      await client.connect();

      const result = await client.query(`
        SELECT
          COUNT(*) as total_tables,
          SUM(n_tup_ins) as total_inserts,
          SUM(n_tup_upd) as total_updates,
          SUM(n_tup_del) as total_deletes,
          SUM(n_live_tup) as total_live_tuples,
          SUM(n_dead_tup) as total_dead_tuples,
          SUM(seq_scan) as total_seq_scans,
          SUM(idx_scan) as total_index_scans
        FROM pg_stat_user_tables
      `);

      await client.end();

      const row = result.rows[0] || {};

      return {
        totalTables: parseInt(row.total_tables) || 0,
        inserts: parseInt(row.total_inserts) || 0,
        updates: parseInt(row.total_updates) || 0,
        deletes: parseInt(row.total_deletes) || 0,
        liveTuples: parseInt(row.total_live_tuples) || 0,
        deadTuples: parseInt(row.total_dead_tuples) || 0,
        seqScans: parseInt(row.total_seq_scans) || 0,
        indexScans: parseInt(row.total_index_scans) || 0,
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  /**
   * Collect performance metrics
   * @returns {Object} Performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const client = new Client(this.config);
      await client.connect();

      // Database size
      const sizeResult = await client.query(`
        SELECT pg_database_size(current_database()) as size
      `);

      // Cache hit ratio
      const cacheResult = await client.query(`
        SELECT
          SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0) as cache_hit_ratio
        FROM pg_statio_user_tables
      `);

      // Transaction stats
      const txResult = await client.query(`
        SELECT
          xact_commit as commits,
          xact_rollback as rollbacks,
          blks_read,
          blks_hit,
          tup_returned,
          tup_fetched,
          tup_inserted,
          tup_updated,
          tup_deleted
        FROM pg_stat_database
        WHERE datname = current_database()
      `);

      await client.end();

      const size = parseInt(sizeResult.rows[0]?.size) || 0;
      const cacheHitRatio = parseFloat(cacheResult.rows[0]?.cache_hit_ratio) || 0;
      const tx = txResult.rows[0] || {};

      return {
        databaseSize: size,
        cacheHitRatio: cacheHitRatio * 100,
        transactions: {
          commits: parseInt(tx.commits) || 0,
          rollbacks: parseInt(tx.rollbacks) || 0,
        },
        blocks: {
          read: parseInt(tx.blks_read) || 0,
          hit: parseInt(tx.blks_hit) || 0,
        },
        tuples: {
          returned: parseInt(tx.tup_returned) || 0,
          fetched: parseInt(tx.tup_fetched) || 0,
          inserted: parseInt(tx.tup_inserted) || 0,
          updated: parseInt(tx.tup_updated) || 0,
          deleted: parseInt(tx.tup_deleted) || 0,
        },
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  /**
   * Collect system metrics
   * @returns {Object} System metrics
   */
  async collectSystemMetrics() {
    try {
      const client = new Client(this.config);
      await client.connect();

      const result = await client.query(`
        SELECT
          version() as version,
          current_setting('max_connections') as max_connections,
          current_setting('shared_buffers') as shared_buffers,
          current_setting('work_mem') as work_mem,
          current_setting('maintenance_work_mem') as maintenance_work_mem
      `);

      await client.end();

      const row = result.rows[0] || {};

      return {
        version: row.version,
        settings: {
          maxConnections: row.max_connections,
          sharedBuffers: row.shared_buffers,
          workMem: row.work_mem,
          maintenanceWorkMem: row.maintenance_work_mem,
        },
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  /**
   * Get metrics history
   * @param {string} metric - Specific metric name (optional)
   * @param {number} periodMs - Time period in milliseconds
   * @returns {Array} Metrics history
   */
  getHistory(metric = null, periodMs = 3600000) {
    const cutoff = Date.now() - periodMs;

    let history = this.metricsHistory.filter(
      m => new Date(m.timestamp).getTime() > cutoff
    );

    if (metric) {
      // Extract specific metric from history
      history = history.map(h => ({
        timestamp: h.timestamp,
        value: this.extractMetricValue(h, metric),
      }));
    }

    return history;
  }

  /**
   * Extract specific metric value from metrics object
   * @param {Object} metrics - Metrics object
   * @param {string} path - Metric path (e.g., 'queries.avgTime')
   * @returns {*} Metric value
   */
  extractMetricValue(metrics, path) {
    const parts = path.split('.');
    let value = metrics;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * Export metrics in Prometheus format
   * @returns {string} Prometheus-formatted metrics
   */
  exportPrometheus() {
    if (this.metricsHistory.length === 0) {
      return '';
    }

    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    const lines = [];

    // Helper to add metric
    const addMetric = (name, value, help, type = 'gauge') => {
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} ${type}`);
      lines.push(`${name} ${value}`);
      lines.push('');
    };

    // Query metrics
    if (latest.queries && !latest.queries.error) {
      addMetric('db_queries_total', latest.queries.totalQueries, 'Total number of queries', 'counter');
      addMetric('db_queries_avg_time_ms', latest.queries.avgTime, 'Average query execution time in milliseconds');
      addMetric('db_queries_max_time_ms', latest.queries.maxTime, 'Maximum query execution time in milliseconds');
      addMetric('db_queries_slow_total', latest.queries.slowQueries, 'Number of slow queries', 'counter');
    }

    // Connection metrics
    if (latest.connections && !latest.connections.error) {
      addMetric('db_connections_total', latest.connections.total, 'Total number of connections');
      addMetric('db_connections_active', latest.connections.active, 'Number of active connections');
      addMetric('db_connections_idle', latest.connections.idle, 'Number of idle connections');
      addMetric('db_connections_waiting', latest.connections.waiting, 'Number of waiting connections');
    }

    // Table metrics
    if (latest.tables && !latest.tables.error) {
      addMetric('db_tables_total', latest.tables.totalTables, 'Total number of tables');
      addMetric('db_tuples_live', latest.tables.liveTuples, 'Number of live tuples');
      addMetric('db_tuples_dead', latest.tables.deadTuples, 'Number of dead tuples');
      addMetric('db_scans_sequential', latest.tables.seqScans, 'Number of sequential scans', 'counter');
      addMetric('db_scans_index', latest.tables.indexScans, 'Number of index scans', 'counter');
    }

    // Performance metrics
    if (latest.performance && !latest.performance.error) {
      addMetric('db_size_bytes', latest.performance.databaseSize, 'Database size in bytes');
      addMetric('db_cache_hit_ratio', latest.performance.cacheHitRatio / 100, 'Cache hit ratio (0-1)');

      if (latest.performance.transactions) {
        addMetric('db_transactions_commits', latest.performance.transactions.commits, 'Number of committed transactions', 'counter');
        addMetric('db_transactions_rollbacks', latest.performance.transactions.rollbacks, 'Number of rolled back transactions', 'counter');
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate metrics report
   * @param {number} periodMs - Time period to analyze
   * @returns {Object} Metrics report
   */
  async generateReport(periodMs = 24 * 60 * 60 * 1000) {
    const history = this.getHistory(null, periodMs);

    if (history.length === 0) {
      return {
        error: 'No metrics available for the specified period',
      };
    }

    const latest = history[history.length - 1];
    const oldest = history[0];

    // Calculate trends
    const calculateTrend = (metric) => {
      const latestValue = this.extractMetricValue(latest, metric);
      const oldestValue = this.extractMetricValue(oldest, metric);

      if (latestValue !== null && oldestValue !== null && oldestValue !== 0) {
        const change = ((latestValue - oldestValue) / oldestValue) * 100;
        return {
          current: latestValue,
          change: change.toFixed(2) + '%',
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        };
      }

      return { current: latestValue, change: 'N/A', direction: 'unknown' };
    };

    return {
      period: {
        start: oldest.timestamp,
        end: latest.timestamp,
        durationHours: ((new Date(latest.timestamp) - new Date(oldest.timestamp)) / 1000 / 60 / 60).toFixed(2),
      },
      current: latest,
      trends: {
        connections: calculateTrend('connections.total'),
        activeConnections: calculateTrend('connections.active'),
        avgQueryTime: calculateTrend('queries.avgTime'),
        cacheHitRatio: calculateTrend('performance.cacheHitRatio'),
      },
      summary: {
        dataPoints: history.length,
        metricsCollected: this.metricsHistory.length,
      },
    };
  }

  /**
   * Persist metrics to disk
   * @param {Object} metrics - Metrics to persist
   */
  async persistMetrics(metrics) {
    try {
      const date = new Date(metrics.timestamp);
      const filename = `metrics-${date.toISOString().split('T')[0]}.jsonl`;
      const filepath = path.join(this.options.storagePath, filename);

      await fs.appendFile(
        filepath,
        JSON.stringify(metrics) + '\n',
        'utf8'
      );
    } catch (error) {
      console.error('Failed to persist metrics:', error.message);
    }
  }

  /**
   * Clean old metrics files
   */
  async cleanOldMetrics() {
    try {
      const files = await fs.readdir(this.options.storagePath);
      const cutoff = Date.now() - this.options.retentionPeriod;

      for (const file of files) {
        if (!file.startsWith('metrics-')) continue;

        const filepath = path.join(this.options.storagePath, file);
        const stats = await fs.stat(filepath);

        if (stats.mtime.getTime() < cutoff) {
          await fs.unlink(filepath);
        }
      }
    } catch (error) {
      console.error('Failed to clean old metrics:', error.message);
    }
  }

  /**
   * Load metrics from disk
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Array} Loaded metrics
   */
  async loadMetrics(date) {
    try {
      const filename = `metrics-${date}.jsonl`;
      const filepath = path.join(this.options.storagePath, filename);

      if (!(await fs.pathExists(filepath))) {
        return [];
      }

      const content = await fs.readFile(filepath, 'utf8');
      const lines = content.trim().split('\n');

      return lines.map(line => JSON.parse(line));
    } catch (error) {
      console.error('Failed to load metrics:', error.message);
      return [];
    }
  }

  /**
   * Get collection status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isCollecting: this.isCollecting,
      interval: this.options.collectionInterval,
      historySize: this.metricsHistory.length,
      maxHistorySize: this.options.maxHistorySize,
      lastCollection: this.metricsHistory.length > 0
        ? this.metricsHistory[this.metricsHistory.length - 1].timestamp
        : null,
    };
  }
}

module.exports = MetricsCollector;
