/**
 * Database Health Check Manager
 * Comprehensive health monitoring for database operations
 */

const { Client, Pool } = require('pg');
const os = require('os');

class DatabaseHealthCheck {
  constructor(config, pool = null) {
    this.config = config;
    this.pool = pool;
    this.thresholds = {
      queryTimeout: 5000, // 5 seconds
      diskSpaceWarning: 10, // 10%
      connectionPoolWarning: 80, // 80%
      replicationLagWarning: 1000, // 1 second
      lockDurationWarning: 30000, // 30 seconds
    };
  }

  /**
   * Run all health checks
   * @returns {Object} Overall health status
   */
  async checkHealth() {
    const startTime = Date.now();

    try {
      const checks = await Promise.allSettled([
        this.checkConnection(),
        this.checkQueryPerformance(),
        this.checkDiskSpace(),
        this.checkReplication(),
        this.checkLocks(),
        this.checkConnectionPool(),
      ]);

      const results = checks.map((result, index) => {
        const checkNames = [
          'connection',
          'query_performance',
          'disk_space',
          'replication',
          'locks',
          'connection_pool',
        ];

        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: checkNames[index],
            healthy: false,
            error: result.reason.message,
            timestamp: new Date(),
          };
        }
      });

      const allHealthy = results.every(c => c.healthy);
      const hasWarnings = results.some(c => c.warning);

      return {
        status: allHealthy ? (hasWarnings ? 'degraded' : 'healthy') : 'unhealthy',
        checks: results,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Check database connection
   * @returns {Object} Connection health status
   */
  async checkConnection() {
    const startTime = Date.now();

    try {
      const client = new Client(this.config);
      await client.connect();

      // Simple query to test connection
      const result = await client.query('SELECT 1 as test, NOW() as server_time');
      const responseTime = Date.now() - startTime;

      await client.end();

      return {
        name: 'connection',
        healthy: true,
        responseTime,
        warning: responseTime > this.thresholds.queryTimeout,
        details: {
          serverTime: result.rows[0].server_time,
          responseTime: `${responseTime}ms`,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'connection',
        healthy: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check query performance
   * @returns {Object} Query performance status
   */
  async checkQueryPerformance() {
    try {
      const client = new Client(this.config);
      await client.connect();

      // Get slow query statistics
      const slowQuerySQL = `
        SELECT
          COUNT(*) as slow_query_count,
          AVG(mean_exec_time) as avg_exec_time,
          MAX(max_exec_time) as max_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > $1
        LIMIT 1
      `;

      let slowQueries = { rows: [{ slow_query_count: 0, avg_exec_time: 0, max_exec_time: 0 }] };

      try {
        // Try to query pg_stat_statements if available
        slowQueries = await client.query(slowQuerySQL, [this.thresholds.queryTimeout]);
      } catch (err) {
        // pg_stat_statements extension not available, use basic check
        const basicQuery = await client.query('SELECT COUNT(*) FROM pg_database');
        const queryTime = basicQuery.duration || 0;

        await client.end();

        return {
          name: 'query_performance',
          healthy: true,
          warning: queryTime > this.thresholds.queryTimeout,
          details: {
            message: 'pg_stat_statements not available, using basic check',
            sampleQueryTime: `${queryTime}ms`,
          },
          timestamp: new Date(),
        };
      }

      await client.end();

      const slowQueryCount = parseInt(slowQueries.rows[0].slow_query_count) || 0;
      const avgExecTime = parseFloat(slowQueries.rows[0].avg_exec_time) || 0;
      const maxExecTime = parseFloat(slowQueries.rows[0].max_exec_time) || 0;

      return {
        name: 'query_performance',
        healthy: true,
        warning: slowQueryCount > 10 || maxExecTime > 10000,
        details: {
          slowQueryCount,
          avgExecTime: `${avgExecTime.toFixed(2)}ms`,
          maxExecTime: `${maxExecTime.toFixed(2)}ms`,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'query_performance',
        healthy: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check available disk space
   * @returns {Object} Disk space status
   */
  async checkDiskSpace() {
    try {
      const client = new Client(this.config);
      await client.connect();

      // Get database size
      const sizeQuery = await client.query(`
        SELECT
          pg_database_size(current_database()) as db_size,
          pg_size_pretty(pg_database_size(current_database())) as db_size_pretty
      `);

      await client.end();

      const dbSize = parseInt(sizeQuery.rows[0].db_size);
      const dbSizePretty = sizeQuery.rows[0].db_size_pretty;

      // Get system disk space
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;

      // Warn if less than threshold
      const warning = usedMemPercent > (100 - this.thresholds.diskSpaceWarning);

      return {
        name: 'disk_space',
        healthy: true,
        warning,
        details: {
          databaseSize: dbSizePretty,
          systemMemoryUsed: `${usedMemPercent.toFixed(2)}%`,
          availableMemory: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)}GB`,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'disk_space',
        healthy: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check replication lag (if replication is configured)
   * @returns {Object} Replication status
   */
  async checkReplication() {
    try {
      const client = new Client(this.config);
      await client.connect();

      // Check if this is a replica
      const isReplicaQuery = await client.query('SELECT pg_is_in_recovery() as is_replica');
      const isReplica = isReplicaQuery.rows[0].is_replica;

      if (!isReplica) {
        // Check for replication slots if this is primary
        const replicationQuery = await client.query(`
          SELECT
            slot_name,
            active,
            restart_lsn,
            confirmed_flush_lsn
          FROM pg_replication_slots
        `);

        await client.end();

        return {
          name: 'replication',
          healthy: true,
          warning: false,
          details: {
            role: 'primary',
            replicationSlots: replicationQuery.rows.length,
            slots: replicationQuery.rows,
          },
          timestamp: new Date(),
        };
      } else {
        // Check replica lag
        const lagQuery = await client.query(`
          SELECT
            EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000 as lag_ms
        `);

        await client.end();

        const lagMs = parseFloat(lagQuery.rows[0].lag_ms) || 0;
        const warning = lagMs > this.thresholds.replicationLagWarning;

        return {
          name: 'replication',
          healthy: true,
          warning,
          details: {
            role: 'replica',
            lagMs: `${lagMs.toFixed(2)}ms`,
          },
          timestamp: new Date(),
        };
      }
    } catch (error) {
      return {
        name: 'replication',
        healthy: true,
        warning: false,
        details: {
          message: 'Replication not configured or not accessible',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check for database locks
   * @returns {Object} Lock status
   */
  async checkLocks() {
    try {
      const client = new Client(this.config);
      await client.connect();

      const lockQuery = await client.query(`
        SELECT
          COUNT(*) as lock_count,
          COUNT(*) FILTER (WHERE NOT granted) as waiting_locks,
          COUNT(*) FILTER (WHERE mode = 'ExclusiveLock') as exclusive_locks
        FROM pg_locks
        WHERE locktype = 'relation'
      `);

      // Get blocking queries
      const blockingQuery = await client.query(`
        SELECT
          COUNT(*) as blocking_queries
        FROM pg_stat_activity
        WHERE state = 'active'
          AND query_start < NOW() - INTERVAL '${this.thresholds.lockDurationWarning}ms'
      `);

      await client.end();

      const lockCount = parseInt(lockQuery.rows[0].lock_count) || 0;
      const waitingLocks = parseInt(lockQuery.rows[0].waiting_locks) || 0;
      const exclusiveLocks = parseInt(lockQuery.rows[0].exclusive_locks) || 0;
      const blockingQueries = parseInt(blockingQuery.rows[0].blocking_queries) || 0;

      const warning = waitingLocks > 5 || blockingQueries > 0;

      return {
        name: 'locks',
        healthy: true,
        warning,
        details: {
          totalLocks: lockCount,
          waitingLocks,
          exclusiveLocks,
          blockingQueries,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'locks',
        healthy: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check connection pool status
   * @returns {Object} Connection pool status
   */
  async checkConnectionPool() {
    try {
      if (!this.pool) {
        return {
          name: 'connection_pool',
          healthy: true,
          warning: false,
          details: {
            message: 'Connection pool not configured',
          },
          timestamp: new Date(),
        };
      }

      const totalCount = this.pool.totalCount;
      const idleCount = this.pool.idleCount;
      const waitingCount = this.pool.waitingCount;
      const maxSize = this.pool.options.max;

      const usagePercent = (totalCount / maxSize) * 100;
      const warning = usagePercent > this.thresholds.connectionPoolWarning;

      return {
        name: 'connection_pool',
        healthy: true,
        warning,
        details: {
          total: totalCount,
          idle: idleCount,
          waiting: waitingCount,
          maxSize,
          usagePercent: `${usagePercent.toFixed(2)}%`,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'connection_pool',
        healthy: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Set custom thresholds
   * @param {Object} thresholds - Custom threshold values
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   * @returns {Object} Current threshold values
   */
  getThresholds() {
    return { ...this.thresholds };
  }
}

module.exports = DatabaseHealthCheck;
