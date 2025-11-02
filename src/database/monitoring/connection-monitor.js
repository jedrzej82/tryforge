/**
 * Connection Pool Monitor
 * Monitors database connection pool usage, detects leaks, and alerts on issues
 */

const EventEmitter = require('events');

class ConnectionMonitor extends EventEmitter {
  constructor(pool, options = {}) {
    super();

    this.pool = pool;
    this.options = {
      warningThreshold: options.warningThreshold || 0.8, // 80%
      criticalThreshold: options.criticalThreshold || 0.95, // 95%
      leakDetectionTimeout: options.leakDetectionTimeout || 60000, // 1 minute
      monitoringInterval: options.monitoringInterval || 30000, // 30 seconds
      historySize: options.historySize || 1000,
    };

    this.connectionHistory = [];
    this.activeConnections = new Map();
    this.leakSuspects = new Map();
    this.alertHistory = [];
    this.monitoringInterval = null;
    this.isMonitoring = false;
  }

  /**
   * Start monitoring the connection pool
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Set up pool event listeners
    this.setupPoolListeners();

    // Start periodic checks
    this.monitoringInterval = setInterval(() => {
      this.checkPoolHealth();
      this.detectLeaks();
    }, this.options.monitoringInterval);

    this.emit('monitoring-started');
  }

  /**
   * Stop monitoring the connection pool
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoring-stopped');
  }

  /**
   * Set up pool event listeners
   */
  setupPoolListeners() {
    if (!this.pool) {
      return;
    }

    // Track connections
    this.pool.on('connect', (client) => {
      const connectionId = this.generateConnectionId();

      this.activeConnections.set(connectionId, {
        id: connectionId,
        acquiredAt: Date.now(),
        stackTrace: new Error().stack,
      });

      this.recordHistoryEntry('connect', {
        connectionId,
        timestamp: new Date(),
      });
    });

    this.pool.on('acquire', (client) => {
      this.recordHistoryEntry('acquire', {
        timestamp: new Date(),
        poolStats: this.getPoolStats(),
      });
    });

    this.pool.on('release', (client) => {
      this.recordHistoryEntry('release', {
        timestamp: new Date(),
        poolStats: this.getPoolStats(),
      });
    });

    this.pool.on('remove', (client) => {
      this.recordHistoryEntry('remove', {
        timestamp: new Date(),
      });
    });

    this.pool.on('error', (err, client) => {
      this.recordHistoryEntry('error', {
        timestamp: new Date(),
        error: err.message,
      });

      this.emit('pool-error', err);
    });
  }

  /**
   * Get current pool statistics
   * @returns {Object} Pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0,
        maxSize: 0,
        minSize: 0,
        usagePercent: 0,
      };
    }

    const total = this.pool.totalCount || 0;
    const idle = this.pool.idleCount || 0;
    const waiting = this.pool.waitingCount || 0;
    const maxSize = this.pool.options?.max || 10;
    const minSize = this.pool.options?.min || 2;
    const active = total - idle;

    return {
      total,
      active,
      idle,
      waiting,
      maxSize,
      minSize,
      usagePercent: maxSize > 0 ? (total / maxSize) * 100 : 0,
      activePercent: total > 0 ? (active / total) * 100 : 0,
    };
  }

  /**
   * Check pool health and trigger alerts if needed
   */
  checkPoolHealth() {
    const stats = this.getPoolStats();
    const usageRatio = stats.total / stats.maxSize;

    // Check if usage exceeds thresholds
    if (usageRatio >= this.options.criticalThreshold) {
      this.triggerAlert('critical', 'Pool usage at critical level', stats);
    } else if (usageRatio >= this.options.warningThreshold) {
      this.triggerAlert('warning', 'Pool usage exceeds warning threshold', stats);
    }

    // Check for waiting connections
    if (stats.waiting > 5) {
      this.triggerAlert('warning', `${stats.waiting} connections waiting for available pool slots`, stats);
    }

    // Record current state
    this.recordHistoryEntry('health-check', {
      timestamp: new Date(),
      stats,
    });
  }

  /**
   * Detect potential connection leaks
   */
  detectLeaks() {
    const now = Date.now();
    const suspects = [];

    // Check active connections for long-running ones
    this.activeConnections.forEach((connection, id) => {
      const age = now - connection.acquiredAt;

      if (age > this.options.leakDetectionTimeout) {
        suspects.push({
          id,
          age,
          acquiredAt: new Date(connection.acquiredAt),
          stackTrace: connection.stackTrace,
        });

        this.leakSuspects.set(id, connection);
      }
    });

    if (suspects.length > 0) {
      this.triggerAlert('warning', `Detected ${suspects.length} potential connection leak(s)`, {
        suspects,
      });

      this.emit('leak-detected', suspects);
    }

    return suspects;
  }

  /**
   * Get connection history
   * @param {number} limit - Number of entries to return
   * @returns {Array} Connection history
   */
  getConnectionHistory(limit = 100) {
    return this.connectionHistory.slice(-limit);
  }

  /**
   * Get leak suspects
   * @returns {Array} Suspected connection leaks
   */
  getLeakSuspects() {
    return Array.from(this.leakSuspects.values());
  }

  /**
   * Record a history entry
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  recordHistoryEntry(event, data) {
    this.connectionHistory.push({
      event,
      ...data,
    });

    // Keep history size limited
    if (this.connectionHistory.length > this.options.historySize) {
      this.connectionHistory.shift();
    }
  }

  /**
   * Trigger an alert
   * @param {string} severity - Alert severity (warning, critical)
   * @param {string} message - Alert message
   * @param {Object} data - Additional data
   */
  triggerAlert(severity, message, data = {}) {
    const alert = {
      severity,
      message,
      data,
      timestamp: new Date(),
    };

    this.alertHistory.push(alert);

    // Keep last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }

    this.emit('alert', alert);
  }

  /**
   * Get alert history
   * @param {number} limit - Number of alerts to return
   * @returns {Array} Alert history
   */
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get pool metrics for monitoring
   * @returns {Object} Pool metrics
   */
  getMetrics() {
    const stats = this.getPoolStats();
    const leaks = this.getLeakSuspects();

    return {
      pool: stats,
      leaks: {
        count: leaks.length,
        suspects: leaks,
      },
      alerts: {
        total: this.alertHistory.length,
        recent: this.alertHistory.slice(-10),
      },
      history: {
        size: this.connectionHistory.length,
        recent: this.connectionHistory.slice(-10),
      },
      timestamp: new Date(),
    };
  }

  /**
   * Generate connection performance report
   * @param {number} periodMs - Time period to analyze in milliseconds
   * @returns {Object} Performance report
   */
  getPerformanceReport(periodMs = 3600000) {
    const cutoff = Date.now() - periodMs;
    const recentHistory = this.connectionHistory.filter(
      entry => entry.timestamp && new Date(entry.timestamp).getTime() > cutoff
    );

    const events = {
      connect: 0,
      acquire: 0,
      release: 0,
      remove: 0,
      error: 0,
    };

    recentHistory.forEach(entry => {
      if (events.hasOwnProperty(entry.event)) {
        events[entry.event]++;
      }
    });

    return {
      period: `${periodMs / 1000 / 60} minutes`,
      events,
      currentStats: this.getPoolStats(),
      leaksDetected: this.leakSuspects.size,
      alertsTriggered: this.alertHistory.filter(
        alert => new Date(alert.timestamp).getTime() > cutoff
      ).length,
    };
  }

  /**
   * Clear connection from tracking (for manual cleanup)
   * @param {string} connectionId - Connection ID to clear
   */
  clearConnection(connectionId) {
    this.activeConnections.delete(connectionId);
    this.leakSuspects.delete(connectionId);
  }

  /**
   * Reset all monitoring data
   */
  reset() {
    this.connectionHistory = [];
    this.activeConnections.clear();
    this.leakSuspects.clear();
    this.alertHistory = [];
  }

  /**
   * Generate a unique connection ID
   * @returns {string} Connection ID
   */
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get monitoring status
   * @returns {Object} Monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      poolConfigured: !!this.pool,
      currentStats: this.getPoolStats(),
      thresholds: {
        warning: this.options.warningThreshold,
        critical: this.options.criticalThreshold,
      },
      historySize: this.connectionHistory.length,
      activeLeaks: this.leakSuspects.size,
      totalAlerts: this.alertHistory.length,
    };
  }

  /**
   * Export monitoring data
   * @returns {Object} Complete monitoring data
   */
  export() {
    return {
      status: this.getStatus(),
      metrics: this.getMetrics(),
      history: this.getConnectionHistory(500),
      alerts: this.getAlertHistory(100),
      leaks: this.getLeakSuspects(),
      exportedAt: new Date(),
    };
  }
}

module.exports = ConnectionMonitor;
