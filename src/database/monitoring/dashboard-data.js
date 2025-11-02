/**
 * Dashboard Data Provider
 * Provides aggregated data for monitoring dashboards
 */

class DashboardData {
  constructor(components = {}) {
    this.healthCheck = components.healthCheck;
    this.performanceMonitor = components.performanceMonitor;
    this.connectionMonitor = components.connectionMonitor;
    this.metricsCollector = components.metricsCollector;
    this.queryLogger = components.queryLogger;
    this.alertManager = components.alertManager;
  }

  /**
   * Get complete dashboard overview
   * @returns {Object} Dashboard data
   */
  async getOverview() {
    try {
      const [
        health,
        metrics,
        alerts,
        slowQueries,
        connections,
      ] = await Promise.allSettled([
        this.getHealthStatus(),
        this.getKeyMetrics(),
        this.getActiveAlerts(),
        this.getSlowQueries(),
        this.getConnectionStats(),
      ]);

      return {
        status: this.resolveSettled(health),
        metrics: this.resolveSettled(metrics),
        alerts: this.resolveSettled(alerts),
        slowQueries: this.resolveSettled(slowQueries),
        connections: this.resolveSettled(connections),
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get health status
   * @returns {Object} Health status
   */
  async getHealthStatus() {
    if (!this.healthCheck) {
      return { status: 'unknown', message: 'Health check not configured' };
    }

    try {
      const health = await this.healthCheck.checkHealth();

      return {
        status: health.status,
        checks: health.checks.map(check => ({
          name: check.name,
          healthy: check.healthy,
          warning: check.warning,
          message: check.error || check.details?.message,
        })),
        duration: health.duration,
        timestamp: health.timestamp,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get key metrics
   * @returns {Object} Key metrics
   */
  async getKeyMetrics() {
    const metrics = {
      queriesPerSecond: await this.getQPS(),
      avgQueryTime: await this.getAvgQueryTime(),
      activeConnections: await this.getActiveConnections(),
      cacheHitRate: await this.getCacheHitRate(),
      diskUsage: await this.getDiskUsage(),
    };

    return metrics;
  }

  /**
   * Get queries per second
   * @returns {number} QPS
   */
  async getQPS() {
    if (!this.metricsCollector || !this.metricsCollector.metricsHistory.length) {
      return 0;
    }

    try {
      const history = this.metricsCollector.getHistory(null, 60000); // Last minute

      if (history.length < 2) {
        return 0;
      }

      const latest = history[history.length - 1];
      const oldest = history[0];

      const queries = latest.queries?.totalCalls || 0;
      const oldQueries = oldest.queries?.totalCalls || 0;
      const timeDiff = (new Date(latest.timestamp) - new Date(oldest.timestamp)) / 1000;

      return timeDiff > 0 ? ((queries - oldQueries) / timeDiff).toFixed(2) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get average query time
   * @returns {number} Average query time in ms
   */
  async getAvgQueryTime() {
    if (this.performanceMonitor) {
      return parseFloat(this.performanceMonitor.calculateAvgQueryTime());
    }

    if (this.metricsCollector && this.metricsCollector.metricsHistory.length > 0) {
      const latest = this.metricsCollector.metricsHistory[
        this.metricsCollector.metricsHistory.length - 1
      ];
      return latest.queries?.avgTime || 0;
    }

    return 0;
  }

  /**
   * Get active connections count
   * @returns {number} Active connections
   */
  async getActiveConnections() {
    if (this.connectionMonitor) {
      const stats = this.connectionMonitor.getPoolStats();
      return stats.active;
    }

    if (this.metricsCollector && this.metricsCollector.metricsHistory.length > 0) {
      const latest = this.metricsCollector.metricsHistory[
        this.metricsCollector.metricsHistory.length - 1
      ];
      return latest.connections?.active || 0;
    }

    return 0;
  }

  /**
   * Get cache hit rate
   * @returns {number} Cache hit rate percentage
   */
  async getCacheHitRate() {
    if (!this.metricsCollector || !this.metricsCollector.metricsHistory.length) {
      return 0;
    }

    try {
      const latest = this.metricsCollector.metricsHistory[
        this.metricsCollector.metricsHistory.length - 1
      ];
      return latest.performance?.cacheHitRatio || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get disk usage
   * @returns {Object} Disk usage info
   */
  async getDiskUsage() {
    if (!this.metricsCollector || !this.metricsCollector.metricsHistory.length) {
      return { size: 0, formatted: '0 B' };
    }

    try {
      const latest = this.metricsCollector.metricsHistory[
        this.metricsCollector.metricsHistory.length - 1
      ];

      const size = latest.performance?.databaseSize || 0;

      return {
        size,
        formatted: this.formatBytes(size),
      };
    } catch (error) {
      return { size: 0, formatted: '0 B' };
    }
  }

  /**
   * Get active alerts
   * @returns {Array} Active alerts
   */
  async getActiveAlerts() {
    if (!this.alertManager) {
      return [];
    }

    try {
      return this.alertManager.getActiveAlerts();
    } catch (error) {
      return [];
    }
  }

  /**
   * Get slow queries
   * @param {number} limit - Maximum number of queries
   * @returns {Array} Slow queries
   */
  async getSlowQueries(limit = 10) {
    if (this.performanceMonitor) {
      return this.performanceMonitor.getSlowQueries().slice(0, limit);
    }

    if (this.queryLogger) {
      return this.queryLogger.getSlowQueryLogs(limit);
    }

    return [];
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection stats
   */
  async getConnectionStats() {
    if (!this.connectionMonitor) {
      return {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0,
        usagePercent: 0,
      };
    }

    try {
      return this.connectionMonitor.getPoolStats();
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  /**
   * Get chart data for a specific metric
   * @param {string} metric - Metric name
   * @param {number} periodMs - Time period in milliseconds
   * @returns {Array} Time-series data
   */
  async getChartsData(metric, periodMs = 3600000) {
    if (!this.metricsCollector) {
      return [];
    }

    try {
      const history = this.metricsCollector.getHistory(metric, periodMs);

      return history.map(entry => ({
        timestamp: entry.timestamp,
        value: entry.value,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  async getPerformanceSummary() {
    const data = {
      queries: {},
      connections: {},
      tables: {},
      cache: {},
    };

    // Query statistics
    if (this.performanceMonitor) {
      data.queries = this.performanceMonitor.getQueryStats();
    } else if (this.queryLogger) {
      data.queries = this.queryLogger.getStatistics();
    }

    // Connection statistics
    if (this.connectionMonitor) {
      data.connections = this.connectionMonitor.getPerformanceReport();
    }

    // Table statistics
    if (this.performanceMonitor) {
      data.tables = await this.performanceMonitor.getTableStats();
    }

    // Cache information
    data.cache.hitRate = await this.getCacheHitRate();

    return data;
  }

  /**
   * Get alert summary
   * @returns {Object} Alert summary
   */
  async getAlertSummary() {
    if (!this.alertManager) {
      return {
        total: 0,
        active: 0,
        bySeverity: {},
      };
    }

    try {
      return this.alertManager.getStatistics();
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  /**
   * Get system status
   * @returns {Object} System status
   */
  async getSystemStatus() {
    const status = {
      database: 'unknown',
      monitoring: 'unknown',
      components: {},
    };

    // Check database health
    if (this.healthCheck) {
      const health = await this.healthCheck.checkHealth();
      status.database = health.status;
    }

    // Check monitoring components
    status.components = {
      healthCheck: !!this.healthCheck,
      performanceMonitor: !!this.performanceMonitor,
      connectionMonitor: !!this.connectionMonitor,
      metricsCollector: !!this.metricsCollector,
      queryLogger: !!this.queryLogger,
      alertManager: !!this.alertManager,
    };

    // Overall monitoring status
    const activeComponents = Object.values(status.components).filter(Boolean).length;
    const totalComponents = Object.keys(status.components).length;

    if (activeComponents === totalComponents) {
      status.monitoring = 'healthy';
    } else if (activeComponents > 0) {
      status.monitoring = 'partial';
    } else {
      status.monitoring = 'inactive';
    }

    return status;
  }

  /**
   * Get recommendations based on current metrics
   * @returns {Array} Recommendations
   */
  async getRecommendations() {
    const recommendations = [];

    try {
      // Check connection pool usage
      if (this.connectionMonitor) {
        const stats = this.connectionMonitor.getPoolStats();
        if (stats.usagePercent > 80) {
          recommendations.push({
            type: 'warning',
            category: 'connections',
            message: 'Connection pool usage is high. Consider increasing pool size.',
            priority: 'high',
          });
        }
      }

      // Check slow queries
      if (this.performanceMonitor) {
        const slowQueries = this.performanceMonitor.getSlowQueries();
        if (slowQueries.length > 10) {
          recommendations.push({
            type: 'warning',
            category: 'performance',
            message: `${slowQueries.length} slow queries detected. Review and optimize.`,
            priority: 'medium',
          });
        }
      }

      // Check cache hit rate
      const cacheHitRate = await this.getCacheHitRate();
      if (cacheHitRate < 90 && cacheHitRate > 0) {
        recommendations.push({
          type: 'info',
          category: 'cache',
          message: `Cache hit rate is ${cacheHitRate.toFixed(2)}%. Consider tuning shared_buffers.`,
          priority: 'low',
        });
      }

      // Check for active alerts
      if (this.alertManager) {
        const activeAlerts = this.alertManager.getActiveAlerts();
        if (activeAlerts.length > 0) {
          recommendations.push({
            type: 'warning',
            category: 'alerts',
            message: `${activeAlerts.length} active alert(s) require attention.`,
            priority: 'high',
          });
        }
      }

      // Default recommendation
      if (recommendations.length === 0) {
        recommendations.push({
          type: 'success',
          category: 'general',
          message: 'System is operating normally.',
          priority: 'info',
        });
      }
    } catch (error) {
      recommendations.push({
        type: 'error',
        category: 'system',
        message: `Error generating recommendations: ${error.message}`,
        priority: 'high',
      });
    }

    return recommendations;
  }

  /**
   * Format bytes to human-readable format
   * @param {number} bytes - Bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Resolve Promise.allSettled result
   * @param {Object} result - Settled result
   * @returns {*} Resolved value or error
   */
  resolveSettled(result) {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { error: result.reason.message };
    }
  }

  /**
   * Export complete dashboard data
   * @returns {Object} Complete dashboard data
   */
  async export() {
    return {
      overview: await this.getOverview(),
      performance: await this.getPerformanceSummary(),
      alerts: await this.getAlertSummary(),
      system: await this.getSystemStatus(),
      recommendations: await this.getRecommendations(),
      exportedAt: new Date(),
    };
  }
}

module.exports = DashboardData;
