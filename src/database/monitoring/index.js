/**
 * Database Monitoring - Main Export
 * Exports all monitoring components and utilities
 */

const DatabaseHealthCheck = require('./health-check');
const PerformanceMonitor = require('./performance-monitor');
const ConnectionMonitor = require('./connection-monitor');
const MetricsCollector = require('./metrics-collector');
const QueryLogger = require('./query-logger');
const AlertManager = require('./alert-manager');
const DashboardData = require('./dashboard-data');
const { createHealthEndpoint, createHealthServer } = require('./health-endpoint');
const monitoringConfig = require('./monitoring-config');

const { Pool } = require('pg');

/**
 * Initialize all monitoring components
 * @param {Object} config - Configuration options
 * @returns {Object} Initialized monitoring components
 */
function initializeMonitoring(config = {}) {
  // Merge with default config
  const finalConfig = {
    ...monitoringConfig,
    ...config,
  };

  // Database configuration
  const dbConfig = finalConfig.database;

  // Create connection pool if needed
  let pool = null;
  if (finalConfig.features.connectionMonitoring) {
    pool = new Pool(dbConfig);
  }

  // Initialize components
  const components = {};

  // Health Check
  if (finalConfig.features.healthCheck && finalConfig.healthCheck.enabled) {
    components.healthCheck = new DatabaseHealthCheck(dbConfig, pool);

    if (finalConfig.healthCheck.thresholds) {
      components.healthCheck.setThresholds(finalConfig.healthCheck.thresholds);
    }
  }

  // Performance Monitor
  if (finalConfig.features.performanceMonitoring && finalConfig.performance.enabled) {
    components.performanceMonitor = new PerformanceMonitor(dbConfig, {
      slowQueryThreshold: finalConfig.performance.slowQueryThreshold,
      logPath: finalConfig.paths.logs,
      enableDetailedLogging: finalConfig.performance.includeStackTrace,
    });
  }

  // Connection Monitor
  if (finalConfig.features.connectionMonitoring && finalConfig.connections.enabled && pool) {
    components.connectionMonitor = new ConnectionMonitor(pool, {
      warningThreshold: finalConfig.connections.warningThreshold,
      criticalThreshold: finalConfig.connections.criticalThreshold,
      leakDetectionTimeout: finalConfig.connections.leakDetectionTimeout,
      monitoringInterval: finalConfig.connections.monitoringInterval,
      historySize: finalConfig.connections.historySize,
    });
  }

  // Metrics Collector
  if (finalConfig.features.metricsCollection && finalConfig.metrics.enabled) {
    components.metricsCollector = new MetricsCollector(dbConfig, {
      collectionInterval: finalConfig.metrics.collectionInterval,
      retentionPeriod: finalConfig.metrics.retentionPeriod,
      storagePath: finalConfig.paths.metrics,
      enablePrometheus: finalConfig.metrics.export.prometheus,
      maxHistorySize: finalConfig.metrics.maxHistorySize,
    });
  }

  // Query Logger
  if (finalConfig.features.queryLogging && finalConfig.queryLogger.enabled) {
    components.queryLogger = new QueryLogger({
      logPath: finalConfig.paths.queries,
      logAllQueries: finalConfig.queryLogger.logAllQueries,
      logSlowQueries: finalConfig.queryLogger.logSlowQueries,
      slowQueryThreshold: finalConfig.queryLogger.slowQueryThreshold,
      logFailedQueries: finalConfig.queryLogger.logFailedQueries,
      includeStackTrace: finalConfig.queryLogger.includeStackTrace,
      includeQueryPlan: finalConfig.queryLogger.includeQueryPlan,
      maxLogSize: finalConfig.queryLogger.maxLogSize,
      rotateDaily: finalConfig.queryLogger.rotateDaily,
    });
  }

  // Alert Manager
  if (finalConfig.features.alerting && finalConfig.alerts.enabled) {
    components.alertManager = new AlertManager({
      alertPath: finalConfig.paths.alerts,
      checkInterval: finalConfig.alerts.checkInterval,
      cooldownPeriod: finalConfig.alerts.cooldownPeriod,
      enableNotifications: finalConfig.alerts.enableNotifications,
      notificationChannels: finalConfig.alerts.notificationChannels,
    });

    // Add default alert rules
    if (finalConfig.alerts.rules) {
      finalConfig.alerts.rules.forEach(rule => {
        try {
          components.alertManager.addRule(rule);
        } catch (error) {
          console.error(`Failed to add alert rule ${rule.name}:`, error.message);
        }
      });
    }
  }

  // Dashboard Data
  if (finalConfig.features.dashboardData) {
    components.dashboardData = new DashboardData(components);
  }

  return {
    components,
    pool,
    config: finalConfig,
  };
}

/**
 * Start monitoring
 * @param {Object} monitoring - Monitoring instance from initializeMonitoring
 */
function startMonitoring(monitoring) {
  const { components } = monitoring;

  // Start connection monitoring
  if (components.connectionMonitor) {
    components.connectionMonitor.startMonitoring();
  }

  // Start metrics collection
  if (components.metricsCollector) {
    components.metricsCollector.startCollection();
  }

  // Start alert checking
  if (components.alertManager) {
    // Create context for alert evaluation
    const getAlertContext = async () => {
      const context = {};

      // Add health check data
      if (components.healthCheck) {
        context.health = await components.healthCheck.checkHealth();
      }

      // Add pool stats
      if (components.connectionMonitor) {
        context.pool = components.connectionMonitor.getPoolStats();
      }

      // Add performance data
      if (components.performanceMonitor) {
        context.performance = components.performanceMonitor.getQueryStats();
      }

      // Add connection leak data
      if (components.connectionMonitor) {
        context.connections = {
          leaks: components.connectionMonitor.getLeakSuspects().length,
        };
      }

      return context;
    };

    components.alertManager.startChecking(getAlertContext);
  }

  console.log('Database monitoring started');
}

/**
 * Stop monitoring
 * @param {Object} monitoring - Monitoring instance from initializeMonitoring
 */
function stopMonitoring(monitoring) {
  const { components, pool } = monitoring;

  // Stop connection monitoring
  if (components.connectionMonitor) {
    components.connectionMonitor.stopMonitoring();
  }

  // Stop metrics collection
  if (components.metricsCollector) {
    components.metricsCollector.stopCollection();
  }

  // Stop alert checking
  if (components.alertManager) {
    components.alertManager.stopChecking();
  }

  // Close query logger
  if (components.queryLogger) {
    components.queryLogger.close();
  }

  // Close pool
  if (pool) {
    pool.end();
  }

  console.log('Database monitoring stopped');
}

/**
 * Create and start health check server
 * @param {Object} monitoring - Monitoring instance from initializeMonitoring
 * @param {number} port - Port to listen on
 * @returns {Object} Server instance
 */
function startHealthServer(monitoring, port) {
  const { components, config } = monitoring;
  const serverPort = port || config.healthEndpoint.port;

  return createHealthServer(components, serverPort);
}

// Export all components and utilities
module.exports = {
  // Classes
  DatabaseHealthCheck,
  PerformanceMonitor,
  ConnectionMonitor,
  MetricsCollector,
  QueryLogger,
  AlertManager,
  DashboardData,

  // Utilities
  createHealthEndpoint,
  createHealthServer,
  initializeMonitoring,
  startMonitoring,
  stopMonitoring,
  startHealthServer,

  // Configuration
  monitoringConfig,
};
