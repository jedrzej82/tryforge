/**
 * TryForge Performance Monitor - Core Monitoring System
 * Central performance monitoring and metric collection
 */

const EventEmitter = require('events');
const os = require('os');
const v8 = require('v8');
const logger = require('../utils/logger');

class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      enabled: true,
      collectInterval: 5000, // 5 seconds
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      performanceBudgets: {},
      alertThresholds: {
        cpu: 80, // 80% CPU usage
        memory: 80, // 80% memory usage
        responseTime: 1000, // 1000ms
        errorRate: 0.01, // 1% error rate
        ...options.alertThresholds
      },
      ...options
    };

    this.metrics = {
      system: [],
      application: [],
      custom: [],
      api: [],
      database: []
    };

    this.alerts = [];
    this.isMonitoring = false;
    this.collectionInterval = null;
    this.startTime = Date.now();
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring already started');
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();

    logger.info('Starting performance monitoring', {
      interval: this.options.collectInterval,
      retentionPeriod: this.options.retentionPeriod
    });

    // Start periodic metric collection
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkAlertThresholds();
      this.cleanOldMetrics();
    }, this.options.collectInterval);

    // Initial collection
    this.collectSystemMetrics();

    this.emit('started', { timestamp: Date.now() });
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      logger.warn('Performance monitoring not started');
      return;
    }

    this.isMonitoring = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    logger.info('Stopped performance monitoring');
    this.emit('stopped', { timestamp: Date.now() });
  }

  /**
   * Collect system metrics (CPU, memory, etc.)
   */
  collectSystemMetrics() {
    const timestamp = Date.now();

    // CPU metrics
    const cpus = os.cpus();
    const cpuUsage = this.calculateCPUUsage(cpus);

    // Memory metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    // V8 heap statistics
    const heapStats = v8.getHeapStatistics();
    const heapUsage = (heapStats.used_heap_size / heapStats.heap_size_limit) * 100;

    // Process metrics
    const processMemory = process.memoryUsage();

    const systemMetric = {
      timestamp,
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAvg: os.loadavg()
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usage: memoryUsage
      },
      heap: {
        total: heapStats.total_heap_size,
        used: heapStats.used_heap_size,
        limit: heapStats.heap_size_limit,
        usage: heapUsage
      },
      process: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external,
        arrayBuffers: processMemory.arrayBuffers
      },
      uptime: process.uptime()
    };

    this.metrics.system.push(systemMetric);
    this.emit('metric:system', systemMetric);

    return systemMetric;
  }

  /**
   * Calculate CPU usage percentage
   */
  calculateCPUUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  /**
   * Track application metric
   */
  trackMetric(name, value, tags = {}) {
    const metric = {
      timestamp: Date.now(),
      name,
      value,
      tags
    };

    this.metrics.application.push(metric);
    this.emit('metric:application', metric);

    return metric;
  }

  /**
   * Track custom metric
   */
  trackCustomMetric(category, name, value, metadata = {}) {
    const metric = {
      timestamp: Date.now(),
      category,
      name,
      value,
      metadata
    };

    this.metrics.custom.push(metric);
    this.emit('metric:custom', metric);

    return metric;
  }

  /**
   * Track API request
   */
  trackAPIRequest(endpoint, method, duration, statusCode, metadata = {}) {
    const metric = {
      timestamp: Date.now(),
      endpoint,
      method,
      duration,
      statusCode,
      success: statusCode >= 200 && statusCode < 300,
      metadata
    };

    this.metrics.api.push(metric);
    this.emit('metric:api', metric);

    // Check performance budget
    if (this.options.performanceBudgets[endpoint]) {
      const budget = this.options.performanceBudgets[endpoint];
      if (duration > budget) {
        this.createAlert('performance_budget_exceeded', {
          endpoint,
          duration,
          budget,
          exceeded: duration - budget
        });
      }
    }

    return metric;
  }

  /**
   * Track database query
   */
  trackDatabaseQuery(query, duration, metadata = {}) {
    const metric = {
      timestamp: Date.now(),
      query,
      duration,
      metadata
    };

    this.metrics.database.push(metric);
    this.emit('metric:database', metric);

    return metric;
  }

  /**
   * Check alert thresholds
   */
  checkAlertThresholds() {
    if (this.metrics.system.length === 0) return;

    const latestSystem = this.metrics.system[this.metrics.system.length - 1];

    // Check CPU threshold
    if (latestSystem.cpu.usage > this.options.alertThresholds.cpu) {
      this.createAlert('high_cpu_usage', {
        current: latestSystem.cpu.usage,
        threshold: this.options.alertThresholds.cpu
      });
    }

    // Check memory threshold
    if (latestSystem.memory.usage > this.options.alertThresholds.memory) {
      this.createAlert('high_memory_usage', {
        current: latestSystem.memory.usage,
        threshold: this.options.alertThresholds.memory
      });
    }

    // Check API response time
    const recentAPI = this.getRecentMetrics('api', 60000); // Last minute
    if (recentAPI.length > 0) {
      const avgResponseTime = recentAPI.reduce((sum, m) => sum + m.duration, 0) / recentAPI.length;
      if (avgResponseTime > this.options.alertThresholds.responseTime) {
        this.createAlert('high_response_time', {
          current: avgResponseTime,
          threshold: this.options.alertThresholds.responseTime
        });
      }

      // Check error rate
      const errors = recentAPI.filter(m => !m.success).length;
      const errorRate = errors / recentAPI.length;
      if (errorRate > this.options.alertThresholds.errorRate) {
        this.createAlert('high_error_rate', {
          current: errorRate,
          threshold: this.options.alertThresholds.errorRate,
          errors,
          total: recentAPI.length
        });
      }
    }
  }

  /**
   * Create alert
   */
  createAlert(type, data) {
    const alert = {
      id: `${type}_${Date.now()}`,
      type,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type),
      data,
      acknowledged: false
    };

    this.alerts.push(alert);
    this.emit('alert', alert);

    logger.warn(`Performance alert: ${type}`, data);

    return alert;
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const severityMap = {
      high_cpu_usage: 'warning',
      high_memory_usage: 'warning',
      high_response_time: 'warning',
      high_error_rate: 'critical',
      performance_budget_exceeded: 'warning',
      memory_leak: 'critical',
      database_slow_query: 'warning'
    };

    return severityMap[type] || 'info';
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(type, timeWindow) {
    const now = Date.now();
    const metrics = this.metrics[type] || [];

    return metrics.filter(m => now - m.timestamp < timeWindow);
  }

  /**
   * Clean old metrics based on retention period
   */
  cleanOldMetrics() {
    const cutoff = Date.now() - this.options.retentionPeriod;

    for (const type in this.metrics) {
      this.metrics[type] = this.metrics[type].filter(m => m.timestamp >= cutoff);
    }

    // Clean old alerts (keep for 7 days)
    const alertCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp >= alertCutoff);
  }

  /**
   * Get performance summary
   */
  getSummary(timeWindow = 3600000) { // Default 1 hour
    const now = Date.now();
    const systemMetrics = this.getRecentMetrics('system', timeWindow);
    const apiMetrics = this.getRecentMetrics('api', timeWindow);
    const dbMetrics = this.getRecentMetrics('database', timeWindow);

    // System metrics
    const avgCPU = systemMetrics.length > 0
      ? systemMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / systemMetrics.length
      : 0;

    const avgMemory = systemMetrics.length > 0
      ? systemMetrics.reduce((sum, m) => sum + m.memory.usage, 0) / systemMetrics.length
      : 0;

    const avgHeap = systemMetrics.length > 0
      ? systemMetrics.reduce((sum, m) => sum + m.heap.usage, 0) / systemMetrics.length
      : 0;

    // API metrics
    const totalRequests = apiMetrics.length;
    const successfulRequests = apiMetrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

    const avgResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length
      : 0;

    const sortedResponseTimes = apiMetrics.map(m => m.duration).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99);
    const p95ResponseTime = sortedResponseTimes[p95Index] || 0;
    const p99ResponseTime = sortedResponseTimes[p99Index] || 0;

    // Database metrics
    const totalQueries = dbMetrics.length;
    const avgQueryTime = dbMetrics.length > 0
      ? dbMetrics.reduce((sum, m) => sum + m.duration, 0) / dbMetrics.length
      : 0;

    const slowQueries = dbMetrics.filter(m => m.duration > 100).length;

    // Alerts
    const recentAlerts = this.alerts.filter(a => now - a.timestamp < timeWindow);
    const unacknowledgedAlerts = recentAlerts.filter(a => !a.acknowledged);

    return {
      timeWindow,
      period: {
        start: now - timeWindow,
        end: now
      },
      system: {
        cpu: {
          average: Math.round(avgCPU * 100) / 100,
          threshold: this.options.alertThresholds.cpu,
          status: avgCPU > this.options.alertThresholds.cpu ? 'warning' : 'ok'
        },
        memory: {
          average: Math.round(avgMemory * 100) / 100,
          threshold: this.options.alertThresholds.memory,
          status: avgMemory > this.options.alertThresholds.memory ? 'warning' : 'ok'
        },
        heap: {
          average: Math.round(avgHeap * 100) / 100
        },
        uptime: process.uptime()
      },
      api: {
        totalRequests,
        successfulRequests,
        failedRequests,
        errorRate: Math.round(errorRate * 10000) / 100, // Percentage
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        p99ResponseTime: Math.round(p99ResponseTime),
        status: errorRate > this.options.alertThresholds.errorRate ? 'warning' : 'ok'
      },
      database: {
        totalQueries,
        avgQueryTime: Math.round(avgQueryTime),
        slowQueries,
        status: slowQueries > totalQueries * 0.1 ? 'warning' : 'ok'
      },
      alerts: {
        total: recentAlerts.length,
        unacknowledged: unacknowledgedAlerts.length,
        bySeverity: {
          critical: recentAlerts.filter(a => a.severity === 'critical').length,
          warning: recentAlerts.filter(a => a.severity === 'warning').length,
          info: recentAlerts.filter(a => a.severity === 'info').length
        }
      },
      status: this.getOverallStatus(avgCPU, avgMemory, errorRate, slowQueries, totalQueries)
    };
  }

  /**
   * Get overall system status
   */
  getOverallStatus(cpu, memory, errorRate, slowQueries, totalQueries) {
    const issues = [];

    if (cpu > this.options.alertThresholds.cpu) {
      issues.push('high_cpu');
    }
    if (memory > this.options.alertThresholds.memory) {
      issues.push('high_memory');
    }
    if (errorRate > this.options.alertThresholds.errorRate) {
      issues.push('high_error_rate');
    }
    if (totalQueries > 0 && slowQueries > totalQueries * 0.1) {
      issues.push('slow_queries');
    }

    if (issues.length === 0) return 'healthy';
    if (issues.length <= 2) return 'degraded';
    return 'critical';
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return {
      system: this.metrics.system,
      application: this.metrics.application,
      custom: this.metrics.custom,
      api: this.metrics.api,
      database: this.metrics.database
    };
  }

  /**
   * Get alerts
   */
  getAlerts(filter = {}) {
    let alerts = [...this.alerts];

    if (filter.severity) {
      alerts = alerts.filter(a => a.severity === filter.severity);
    }

    if (filter.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === filter.acknowledged);
    }

    if (filter.since) {
      alerts = alerts.filter(a => a.timestamp >= filter.since);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      this.emit('alert:acknowledged', alert);
    }
    return alert;
  }

  /**
   * Set performance budget
   */
  setPerformanceBudget(endpoint, budget) {
    this.options.performanceBudgets[endpoint] = budget;
    logger.info(`Performance budget set for ${endpoint}: ${budget}ms`);
  }

  /**
   * Export metrics for external systems
   */
  exportMetrics(format = 'json') {
    const data = {
      timestamp: Date.now(),
      monitoring: {
        enabled: this.isMonitoring,
        startTime: this.startTime,
        uptime: Date.now() - this.startTime
      },
      summary: this.getSummary(),
      metrics: this.getAllMetrics(),
      alerts: this.getAlerts()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    return data;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      system: [],
      application: [],
      custom: [],
      api: [],
      database: []
    };
    this.alerts = [];
    logger.info('Performance metrics reset');
  }
}

// Singleton instance
let monitorInstance = null;

/**
 * Get or create monitor instance
 */
function getMonitor(options) {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor(options);
  }
  return monitorInstance;
}

/**
 * Track performance of async function
 */
async function trackPerformance(name, fn, metadata = {}) {
  const monitor = getMonitor();
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    monitor.trackMetric(name, duration, {
      ...metadata,
      success: true
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    monitor.trackMetric(name, duration, {
      ...metadata,
      success: false,
      error: error.message
    });

    throw error;
  }
}

/**
 * Express middleware for API monitoring
 */
function expressMiddleware(options = {}) {
  const monitor = getMonitor(options);

  return (req, res, next) => {
    const startTime = Date.now();

    // Capture original end function
    const originalEnd = res.end;

    res.end = function(...args) {
      const duration = Date.now() - startTime;

      monitor.trackAPIRequest(
        req.path,
        req.method,
        duration,
        res.statusCode,
        {
          query: req.query,
          params: req.params,
          userAgent: req.get('user-agent'),
          ip: req.ip
        }
      );

      originalEnd.apply(res, args);
    };

    next();
  };
}

module.exports = {
  PerformanceMonitor,
  getMonitor,
  trackPerformance,
  expressMiddleware
};
