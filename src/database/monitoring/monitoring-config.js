/**
 * Monitoring Configuration
 * Central configuration for all monitoring components
 */

module.exports = {
  // Health check settings
  healthCheck: {
    enabled: true,
    interval: 60000, // 1 minute
    timeout: 5000, // 5 seconds
    thresholds: {
      queryTimeout: 5000, // 5 seconds
      diskSpaceWarning: 10, // 10% free space
      connectionPoolWarning: 80, // 80% usage
      replicationLagWarning: 1000, // 1 second
      lockDurationWarning: 30000, // 30 seconds
    },
  },

  // Performance monitoring
  performance: {
    enabled: true,
    slowQueryThreshold: 1000, // 1 second
    logAllQueries: false,
    logSlowQueries: true,
    includeStackTrace: false,
    includeQueryPlan: false,
    maxLogEntries: 10000,
  },

  // Connection monitoring
  connections: {
    enabled: true,
    warningThreshold: 0.8, // 80% pool usage
    criticalThreshold: 0.95, // 95% pool usage
    leakDetectionTimeout: 60000, // 1 minute
    monitoringInterval: 30000, // 30 seconds
    checkInterval: 30000, // 30 seconds
    historySize: 1000,
  },

  // Metrics collection
  metrics: {
    enabled: true,
    collectionInterval: 60000, // 1 minute
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxHistorySize: 10080, // 7 days at 1-minute intervals
    export: {
      prometheus: true,
      port: 9090,
      path: '/metrics',
    },
  },

  // Query logging
  queryLogger: {
    enabled: true,
    logAllQueries: false,
    logSlowQueries: true,
    logFailedQueries: true,
    slowQueryThreshold: 1000, // 1 second
    includeStackTrace: false,
    includeQueryPlan: false,
    maxLogSize: 100 * 1024 * 1024, // 100MB
    rotateDaily: true,
  },

  // Alerts configuration
  alerts: {
    enabled: true,
    checkInterval: 60000, // 1 minute
    cooldownPeriod: 300000, // 5 minutes
    enableNotifications: true,
    notificationChannels: ['log', 'email'],

    // Alert rules
    rules: [
      {
        name: 'high_connection_pool_usage',
        condition: 'pool.usagePercent > 80',
        message: 'Connection pool usage exceeds 80%',
        severity: 'warning',
        action: ['log', 'email'],
        threshold: 80,
        metadata: {
          category: 'connections',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#connection-pool',
        },
      },
      {
        name: 'critical_connection_pool_usage',
        condition: 'pool.usagePercent > 95',
        message: 'Connection pool usage exceeds 95% - immediate action required',
        severity: 'critical',
        action: ['log', 'email', 'slack'],
        threshold: 95,
        metadata: {
          category: 'connections',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#connection-pool',
        },
      },
      {
        name: 'database_connection_failed',
        condition: 'health.connection.healthy === false',
        message: 'Database connection failed',
        severity: 'critical',
        action: ['log', 'email', 'slack'],
        metadata: {
          category: 'availability',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#database-down',
        },
      },
      {
        name: 'slow_queries_detected',
        condition: 'performance.slowQueries > 10',
        message: 'More than 10 slow queries detected',
        severity: 'warning',
        action: ['log'],
        threshold: 10,
        metadata: {
          category: 'performance',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#slow-queries',
        },
      },
      {
        name: 'very_slow_query',
        condition: 'query.duration > 5000',
        message: 'Query execution time exceeds 5 seconds',
        severity: 'warning',
        action: ['log', 'email'],
        threshold: 5000,
        metadata: {
          category: 'performance',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#slow-queries',
        },
      },
      {
        name: 'low_cache_hit_ratio',
        condition: 'performance.cacheHitRatio < 80',
        message: 'Cache hit ratio is below 80%',
        severity: 'warning',
        action: ['log'],
        threshold: 80,
        metadata: {
          category: 'performance',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#cache-hit-ratio',
        },
      },
      {
        name: 'high_disk_usage',
        condition: 'disk.usagePercent > 90',
        message: 'Disk usage exceeds 90%',
        severity: 'warning',
        action: ['log', 'email'],
        threshold: 90,
        metadata: {
          category: 'resources',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#disk-space',
        },
      },
      {
        name: 'connection_leaks_detected',
        condition: 'connections.leaks > 0',
        message: 'Potential connection leaks detected',
        severity: 'warning',
        action: ['log', 'email'],
        metadata: {
          category: 'connections',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#connection-leaks',
        },
      },
      {
        name: 'high_replication_lag',
        condition: 'replication.lagMs > 5000',
        message: 'Replication lag exceeds 5 seconds',
        severity: 'warning',
        action: ['log', 'email'],
        threshold: 5000,
        metadata: {
          category: 'replication',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#replication-lag',
        },
      },
      {
        name: 'database_locks_detected',
        condition: 'locks.waiting > 5',
        message: 'More than 5 waiting locks detected',
        severity: 'warning',
        action: ['log'],
        threshold: 5,
        metadata: {
          category: 'locks',
          documentation: 'https://docs.tryforge.dev/monitoring/alerts#locks',
        },
      },
    ],

    // Notification configuration
    notifications: {
      email: {
        enabled: true,
        to: process.env.ALERT_EMAIL || 'admin@example.com',
        from: process.env.ALERT_FROM_EMAIL || 'alerts@tryforge.com',
        smtp: {
          host: process.env.SMTP_HOST || 'smtp.example.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      },

      slack: {
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#alerts',
        username: 'TryForge Monitoring',
        iconEmoji: ':warning:',
      },

      webhook: {
        enabled: !!process.env.ALERT_WEBHOOK_URL,
        url: process.env.ALERT_WEBHOOK_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  },

  // Dashboard configuration
  dashboard: {
    enabled: true,
    refreshInterval: 30000, // 30 seconds
    historyPeriod: 3600000, // 1 hour
    chartDataPoints: 60, // Number of data points in charts
  },

  // Health endpoint configuration
  healthEndpoint: {
    enabled: true,
    port: parseInt(process.env.HEALTH_CHECK_PORT) || 9090,
    path: '/health',
    enablePrometheus: true,
    enableDashboard: true,
  },

  // Storage paths
  paths: {
    logs: process.env.MONITORING_LOGS_PATH || './logs',
    metrics: process.env.MONITORING_METRICS_PATH || './data/metrics',
    alerts: process.env.MONITORING_ALERTS_PATH || './logs/alerts',
    queries: process.env.MONITORING_QUERIES_PATH || './logs/queries',
  },

  // Database connection (should be set from environment)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'app_db',
    user: process.env.DB_USER || 'devuser',
    password: process.env.DB_PASSWORD || 'devpass123',

    // Connection pool settings
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 2000,
    },
  },

  // Feature flags
  features: {
    healthCheck: true,
    performanceMonitoring: true,
    connectionMonitoring: true,
    metricsCollection: true,
    queryLogging: true,
    alerting: true,
    dashboardData: true,
    healthEndpoint: true,
  },

  // Development/Production modes
  mode: process.env.NODE_ENV || 'development',

  // Logging level
  logLevel: process.env.MONITORING_LOG_LEVEL || 'info',
};
