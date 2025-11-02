# TryForge Database Monitoring Guide

Complete guide for database monitoring, health checks, and performance optimization in TryForge.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Components](#components)
4. [Configuration](#configuration)
5. [CLI Commands](#cli-commands)
6. [Health Checks](#health-checks)
7. [Performance Monitoring](#performance-monitoring)
8. [Metrics Collection](#metrics-collection)
9. [Alerts](#alerts)
10. [Dashboard](#dashboard)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

---

## Overview

TryForge's database monitoring system provides comprehensive monitoring, health checks, and performance analytics for PostgreSQL databases. It includes:

- **Health Checks**: Connection, performance, disk space, replication, locks, and connection pool monitoring
- **Performance Monitoring**: Query tracking, slow query detection, index usage analysis
- **Connection Monitoring**: Pool usage, leak detection, connection tracking
- **Metrics Collection**: Historical data collection with Prometheus export
- **Query Logging**: Configurable query logging with pattern analysis
- **Alerts**: Rule-based alerting with multiple notification channels
- **Dashboard Data**: Aggregated data for monitoring dashboards

---

## Quick Start

### 1. Basic Health Check

```bash
# Check database health
tryforge db:health

# View database statistics
tryforge db:stats

# Check connection pool status
tryforge db:connections
```

### 2. Start Monitoring Server

```bash
# Start monitoring with health check endpoints
tryforge db:monitor
```

This starts a server on port 9090 (configurable) with:
- Health endpoint: `http://localhost:9090/health`
- Metrics endpoint: `http://localhost:9090/metrics`
- Dashboard: `http://localhost:9090/dashboard`

### 3. Programmatic Usage

```javascript
const { initializeMonitoring, startMonitoring } = require('./src/database/monitoring');

// Initialize monitoring
const monitoring = initializeMonitoring({
  database: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'dbuser',
    password: 'dbpass',
  },
});

// Start monitoring
startMonitoring(monitoring);

// Use components
const { healthCheck, performanceMonitor, metricsCollector } = monitoring.components;

// Check health
const health = await healthCheck.checkHealth();
console.log(health);
```

---

## Components

### 1. DatabaseHealthCheck

Performs comprehensive health checks on database operations.

```javascript
const { DatabaseHealthCheck } = require('./src/database/monitoring');

const healthCheck = new DatabaseHealthCheck(dbConfig);

// Run all health checks
const health = await healthCheck.checkHealth();

// Run individual checks
const connectionCheck = await healthCheck.checkConnection();
const performanceCheck = await healthCheck.checkQueryPerformance();
const diskCheck = await healthCheck.checkDiskSpace();
```

**Health Check Results:**
- `healthy`: All checks passed
- `degraded`: Checks passed but with warnings
- `unhealthy`: One or more checks failed

### 2. PerformanceMonitor

Tracks query performance and provides optimization insights.

```javascript
const { PerformanceMonitor } = require('./src/database/monitoring');

const perfMonitor = new PerformanceMonitor(dbConfig, {
  slowQueryThreshold: 1000, // 1 second
  logPath: './logs/performance',
});

// Track a query
await perfMonitor.trackQuery(
  'SELECT * FROM users WHERE id = $1',
  1500, // duration in ms
  [123], // params
  true // success
);

// Get slow queries
const slowQueries = perfMonitor.getSlowQueries();

// Get query statistics
const stats = perfMonitor.getQueryStats();

// Analyze a specific query
const analysis = await perfMonitor.analyzeQuery('SELECT * FROM users');
```

### 3. ConnectionMonitor

Monitors connection pool usage and detects leaks.

```javascript
const { ConnectionMonitor } = require('./src/database/monitoring');
const { Pool } = require('pg');

const pool = new Pool(dbConfig);
const connMonitor = new ConnectionMonitor(pool, {
  warningThreshold: 0.8,
  leakDetectionTimeout: 60000,
});

// Start monitoring
connMonitor.startMonitoring();

// Get pool statistics
const stats = connMonitor.getPoolStats();

// Detect connection leaks
const leaks = connMonitor.detectLeaks();

// Listen to events
connMonitor.on('alert', (alert) => {
  console.log('Alert:', alert);
});

connMonitor.on('leak-detected', (suspects) => {
  console.log('Potential leaks:', suspects);
});
```

### 4. MetricsCollector

Collects and stores database metrics over time.

```javascript
const { MetricsCollector } = require('./src/database/monitoring');

const collector = new MetricsCollector(dbConfig, {
  collectionInterval: 60000, // 1 minute
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Start collection
collector.startCollection();

// Get current metrics
const metrics = await collector.collect();

// Get metrics history
const history = collector.getHistory('queries.avgTime', 3600000); // Last hour

// Export to Prometheus format
const prometheusMetrics = collector.exportPrometheus();

// Generate report
const report = await collector.generateReport(24 * 60 * 60 * 1000); // 24 hours
```

### 5. QueryLogger

Logs queries with configurable detail levels.

```javascript
const { QueryLogger } = require('./src/database/monitoring');

const logger = new QueryLogger({
  logAllQueries: false,
  logSlowQueries: true,
  slowQueryThreshold: 1000,
  includeStackTrace: false,
});

// Log a query
await logger.logQuery(
  'SELECT * FROM users',
  [123],
  1500, // duration
  true, // success
  null // error
);

// Get query logs
const logs = logger.getQueryLogs({
  minDuration: 1000,
  limit: 50,
});

// Analyze query patterns
const patterns = logger.analyzePatterns();
```

### 6. AlertManager

Manages monitoring alerts with configurable rules.

```javascript
const { AlertManager } = require('./src/database/monitoring');

const alertManager = new AlertManager({
  checkInterval: 60000,
  cooldownPeriod: 300000, // 5 minutes
});

// Add alert rule
alertManager.addRule({
  name: 'high_connection_usage',
  condition: (context) => context.pool.usagePercent > 80,
  message: 'Connection pool usage exceeds 80%',
  severity: 'warning',
  action: ['log', 'email'],
});

// Start checking rules
alertManager.startChecking(async () => ({
  pool: await getPoolStats(),
  // ... other context data
}));

// Listen to alerts
alertManager.on('alert', (alert) => {
  console.log('Alert triggered:', alert);
});
```

### 7. DashboardData

Provides aggregated data for monitoring dashboards.

```javascript
const { DashboardData } = require('./src/database/monitoring');

const dashboard = new DashboardData({
  healthCheck,
  performanceMonitor,
  connectionMonitor,
  metricsCollector,
  queryLogger,
  alertManager,
});

// Get dashboard overview
const overview = await dashboard.getOverview();

// Get key metrics
const metrics = await dashboard.getKeyMetrics();

// Get recommendations
const recommendations = await dashboard.getRecommendations();
```

---

## Configuration

### Environment Variables

```bash
# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=dbuser
DB_PASSWORD=dbpass

# Monitoring settings
HEALTH_CHECK_PORT=9090
MONITORING_LOG_LEVEL=info

# Alert notifications
ALERT_EMAIL=admin@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Paths
MONITORING_LOGS_PATH=./logs
MONITORING_METRICS_PATH=./data/metrics
```

### Configuration File

See `src/database/monitoring/monitoring-config.js` for complete configuration options:

```javascript
const monitoringConfig = {
  healthCheck: {
    enabled: true,
    interval: 60000,
    thresholds: {
      queryTimeout: 5000,
      diskSpaceWarning: 10,
      connectionPoolWarning: 80,
    },
  },
  performance: {
    enabled: true,
    slowQueryThreshold: 1000,
    logSlowQueries: true,
  },
  // ... more options
};
```

---

## CLI Commands

### Health Commands

```bash
# Check overall database health
tryforge db:health

# View detailed statistics
tryforge db:stats

# Check connection pool
tryforge db:connections

# View slow queries
tryforge db:slow-queries
```

### Monitoring Commands

```bash
# Start monitoring server
tryforge db:monitor

# View current metrics
tryforge db:metrics

# Export metrics to file
tryforge db:metrics:export [path]

# Export in Prometheus format
tryforge db:metrics --format=prometheus
```

### Analysis Commands

```bash
# Analyze a specific query
tryforge db:analyze "SELECT * FROM users WHERE email = 'test@example.com'"
```

---

## Health Checks

### Available Checks

1. **Connection Check**
   - Tests database connectivity
   - Measures response time
   - Status: healthy if connection succeeds

2. **Query Performance Check**
   - Analyzes slow queries
   - Checks average execution times
   - Warning if slow queries exceed threshold

3. **Disk Space Check**
   - Monitors database size
   - Checks available disk space
   - Warning if free space < 10%

4. **Replication Check**
   - Monitors replication lag (if configured)
   - Checks replication slot status
   - Warning if lag exceeds threshold

5. **Lock Check**
   - Detects long-running locks
   - Identifies blocking queries
   - Warning if locks exceed threshold

6. **Connection Pool Check**
   - Monitors pool usage
   - Checks active/idle connections
   - Warning if usage > 80%

### Health Check Endpoints

```bash
# Overall health (returns 200 if healthy, 503 if unhealthy)
GET http://localhost:9090/health

# Individual checks
GET http://localhost:9090/health/connection
GET http://localhost:9090/health/performance

# Kubernetes liveness probe
GET http://localhost:9090/health/live

# Kubernetes readiness probe
GET http://localhost:9090/health/ready
```

---

## Performance Monitoring

### Tracking Queries

```javascript
// Manual tracking
await performanceMonitor.trackQuery(
  query,
  duration,
  params,
  success
);
```

### Analyzing Slow Queries

```javascript
// Get slow queries
const slowQueries = performanceMonitor.getSlowQueries(1000); // > 1 second

// Get query statistics
const stats = performanceMonitor.getQueryStats();
// Returns:
// {
//   totalQueries: 1000,
//   uniqueQueries: 50,
//   slowQueries: 10,
//   avgQueryTime: 123.45,
//   queryFrequency: [...]
// }
```

### Index Usage Analysis

```javascript
// Get index usage statistics
const indexUsage = await performanceMonitor.getIndexUsage();

// Find unused indexes
console.log('Unused indexes:', indexUsage.unused);

// Get recommendations
console.log('Recommendations:', indexUsage.recommendations);
```

### Query Analysis

```javascript
// Analyze query execution plan
const analysis = await performanceMonitor.analyzeQuery(
  'SELECT * FROM users WHERE email = $1',
  ['test@example.com']
);

console.log('Execution time:', analysis.analysis.executionTime);
console.log('Sequential scans:', analysis.analysis.seqScans);
console.log('Recommendations:', analysis.recommendations);
```

---

## Metrics Collection

### Available Metrics

**Query Metrics:**
- Total queries
- Average execution time
- Maximum execution time
- Slow query count

**Connection Metrics:**
- Total connections
- Active connections
- Idle connections
- Waiting connections

**Table Metrics:**
- Total tables
- Insert/Update/Delete counts
- Live/Dead tuples
- Sequential/Index scans

**Performance Metrics:**
- Database size
- Cache hit ratio
- Transaction commits/rollbacks
- Block reads/hits

### Collecting Metrics

```javascript
// Collect current metrics
const metrics = await collector.collect();

// Start periodic collection
collector.startCollection();

// Stop collection
collector.stopCollection();
```

### Exporting Metrics

```javascript
// Prometheus format
const promMetrics = collector.exportPrometheus();

// JSON format
const metrics = await collector.collect();
await fs.writeJson('metrics.json', metrics);

// Historical report
const report = await collector.generateReport(24 * 60 * 60 * 1000);
```

### Prometheus Integration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'tryforge-db'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
```

---

## Alerts

### Default Alert Rules

1. **high_connection_pool_usage** (Warning)
   - Condition: Pool usage > 80%
   - Actions: log, email

2. **database_connection_failed** (Critical)
   - Condition: Connection check fails
   - Actions: log, email, slack

3. **slow_queries_detected** (Warning)
   - Condition: > 10 slow queries
   - Actions: log

4. **very_slow_query** (Warning)
   - Condition: Query > 5 seconds
   - Actions: log, email

5. **low_cache_hit_ratio** (Warning)
   - Condition: Cache hit ratio < 80%
   - Actions: log

### Adding Custom Rules

```javascript
alertManager.addRule({
  name: 'custom_rule',
  condition: (context) => {
    // Custom condition
    return context.someMetric > threshold;
  },
  message: 'Custom alert message',
  severity: 'warning', // info, warning, critical
  action: ['log', 'email', 'slack'],
  metadata: {
    category: 'performance',
    documentation: 'https://...',
  },
});
```

### Expression-Based Rules

```javascript
alertManager.addRule({
  name: 'simple_rule',
  condition: 'connections.total > 50', // String expression
  message: 'Too many connections',
  severity: 'warning',
  action: ['log'],
});
```

### Notification Channels

**Log:** Writes alerts to log files

**Email:** Sends alerts via email (requires SMTP configuration)

**Slack:** Posts alerts to Slack channel (requires webhook URL)

**Webhook:** POSTs alerts to custom webhook

**Custom:** Provide your own function

```javascript
alertManager.addRule({
  name: 'custom_notification',
  condition: (context) => someCondition,
  message: 'Alert message',
  action: [
    async (alert) => {
      // Custom notification logic
      await sendToCustomService(alert);
    }
  ],
});
```

---

## Dashboard

### Dashboard Endpoints

```bash
# Complete overview
GET http://localhost:9090/dashboard

# Performance summary
GET http://localhost:9090/dashboard/performance

# System recommendations
GET http://localhost:9090/dashboard/recommendations
```

### Dashboard Data

```javascript
const dashboard = new DashboardData(components);

// Get overview
const overview = await dashboard.getOverview();
// Returns:
// {
//   status: { ... },
//   metrics: { ... },
//   alerts: [ ... ],
//   slowQueries: [ ... ],
//   connections: { ... }
// }

// Get key metrics
const metrics = await dashboard.getKeyMetrics();
// Returns:
// {
//   queriesPerSecond: 10.5,
//   avgQueryTime: 45.2,
//   activeConnections: 5,
//   cacheHitRate: 95.5,
//   diskUsage: { size: 1024000, formatted: '1 MB' }
// }

// Get recommendations
const recommendations = await dashboard.getRecommendations();
```

### Chart Data

```javascript
// Get time-series data for charts
const chartData = await dashboard.getChartsData(
  'queries.avgTime',
  3600000 // Last hour
);

// Returns:
// [
//   { timestamp: '2025-11-02T10:00:00Z', value: 45.2 },
//   { timestamp: '2025-11-02T10:01:00Z', value: 48.1 },
//   ...
// ]
```

---

## Troubleshooting

### Common Issues

#### 1. "pg_stat_statements extension not available"

**Solution:**
```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Add to postgresql.conf
shared_preload_libraries = 'pg_stat_statements'

-- Restart PostgreSQL
```

#### 2. High Connection Pool Usage

**Diagnosis:**
```bash
tryforge db:connections
```

**Solutions:**
- Increase max pool size in configuration
- Check for connection leaks
- Review application connection handling

#### 3. Slow Queries

**Diagnosis:**
```bash
tryforge db:slow-queries
tryforge db:analyze "YOUR_SLOW_QUERY"
```

**Solutions:**
- Add missing indexes
- Optimize query structure
- Use query plan recommendations

#### 4. Monitoring Server Won't Start

**Check:**
- Port availability (default: 9090)
- Database connectivity
- Configuration file syntax

**Solutions:**
```bash
# Use different port
HEALTH_CHECK_PORT=9091 tryforge db:monitor

# Check database connection
tryforge db:health
```

---

## Best Practices

### 1. Health Checks

- Run health checks regularly (every 1-5 minutes)
- Set appropriate thresholds for your workload
- Use health check endpoints for load balancer probes
- Monitor trends, not just current status

### 2. Performance Monitoring

- Enable `pg_stat_statements` extension
- Set reasonable slow query thresholds (1-5 seconds)
- Review slow queries weekly
- Analyze query patterns for optimization opportunities
- Keep query logs size manageable with rotation

### 3. Connection Monitoring

- Set pool size based on workload (start with 10-20)
- Monitor for connection leaks regularly
- Configure leak detection timeout appropriately
- Always close connections properly in application code

### 4. Metrics Collection

- Choose appropriate collection interval (1-5 minutes)
- Set retention period based on storage capacity
- Export to time-series database for long-term storage
- Monitor disk space for metrics storage

### 5. Alerting

- Start with default alert rules
- Adjust thresholds based on your baseline
- Use cooldown periods to prevent alert fatigue
- Configure multiple notification channels for critical alerts
- Document alert response procedures

### 6. Production Deployment

**Recommended Setup:**

```javascript
const monitoring = initializeMonitoring({
  database: dbConfig,
  healthCheck: {
    enabled: true,
    interval: 60000, // 1 minute
  },
  performance: {
    enabled: true,
    slowQueryThreshold: 2000, // 2 seconds
    logSlowQueries: true,
  },
  metrics: {
    enabled: true,
    collectionInterval: 60000, // 1 minute
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  alerts: {
    enabled: true,
    enableNotifications: true,
    notificationChannels: ['log', 'email', 'slack'],
  },
});
```

**Health Check Server:**
```javascript
// Start on separate port
const server = startHealthServer(monitoring, 9090);

// Use in Kubernetes
// livenessProbe: GET /health/live
// readinessProbe: GET /health/ready
```

**Prometheus Integration:**
```yaml
scrape_configs:
  - job_name: 'tryforge-db'
    scrape_interval: 15s
    static_configs:
      - targets: ['app:9090']
```

### 7. Security

- Secure health check endpoints (use authentication if public)
- Sanitize sensitive data in logs
- Restrict access to metrics endpoints
- Use environment variables for credentials
- Rotate alert notification credentials

### 8. Maintenance

- Review and tune alert thresholds monthly
- Clean up old log files regularly
- Vacuum database tables based on recommendations
- Update unused indexes based on analysis
- Archive historical metrics periodically

---

## Support

For issues, questions, or contributions:

- GitHub: https://github.com/yourusername/tryforge
- Documentation: https://docs.tryforge.dev
- Issues: https://github.com/yourusername/tryforge/issues

---

## License

MIT License - see LICENSE file for details
