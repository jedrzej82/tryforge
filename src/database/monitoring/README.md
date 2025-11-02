# Database Monitoring System

Comprehensive database monitoring, health checks, and performance analytics for TryForge.

## Quick Start

```javascript
const { initializeMonitoring, startMonitoring } = require('./src/database/monitoring');

// Initialize and start monitoring
const monitoring = initializeMonitoring({
  database: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'dbuser',
    password: 'dbpass',
  },
});

startMonitoring(monitoring);
```

## CLI Commands

```bash
# Health checks
tryforge db:health              # Overall health check
tryforge db:stats               # Database statistics
tryforge db:connections         # Connection pool status
tryforge db:slow-queries        # Slow query analysis

# Monitoring
tryforge db:monitor             # Start monitoring server
tryforge db:metrics             # View current metrics
tryforge db:metrics:export      # Export metrics to file

# Analysis
tryforge db:analyze "SELECT..." # Analyze query performance
```

## Components

### 1. Health Check Manager
- Connection health checks
- Query performance checks
- Disk space monitoring
- Replication lag detection
- Lock detection
- Connection pool monitoring

### 2. Performance Monitor
- Query execution tracking
- Slow query detection
- Index usage analysis
- Table statistics
- Query plan analysis

### 3. Connection Monitor
- Pool usage tracking
- Connection leak detection
- Pool statistics
- Event-based monitoring

### 4. Metrics Collector
- Historical metrics collection
- Prometheus export
- Report generation
- Configurable retention

### 5. Query Logger
- Configurable query logging
- Pattern analysis
- N+1 query detection
- Inefficient query identification

### 6. Alert Manager
- Rule-based alerting
- Multiple notification channels
- Cooldown periods
- Alert history

### 7. Dashboard Data
- Aggregated monitoring data
- Key metrics
- Recommendations
- Time-series data

### 8. Health Endpoints
- HTTP health check API
- Prometheus metrics endpoint
- Dashboard API
- Kubernetes probe support

## Features

- ✅ Real-time health monitoring
- ✅ Performance analytics
- ✅ Connection pool monitoring
- ✅ Metrics collection with Prometheus export
- ✅ Configurable alerting
- ✅ Query logging and analysis
- ✅ HTTP endpoints for external monitoring
- ✅ CLI integration
- ✅ Comprehensive documentation

## Architecture

```
src/database/monitoring/
├── index.js                    # Main export and initialization
├── health-check.js             # Database health checks
├── performance-monitor.js      # Query performance monitoring
├── connection-monitor.js       # Connection pool monitoring
├── metrics-collector.js        # Metrics collection and export
├── query-logger.js             # Query logging system
├── alert-manager.js            # Alert management
├── dashboard-data.js           # Dashboard data provider
├── health-endpoint.js          # HTTP health check endpoints
├── monitoring-config.js        # Configuration
├── cli-extension.js            # CLI commands
└── docs/
    └── MONITORING_GUIDE.md     # Complete guide
```

## Configuration

See `monitoring-config.js` for all configuration options:

```javascript
module.exports = {
  healthCheck: {
    enabled: true,
    interval: 60000,
    thresholds: { /* ... */ },
  },
  performance: {
    enabled: true,
    slowQueryThreshold: 1000,
  },
  metrics: {
    enabled: true,
    export: { prometheus: true },
  },
  alerts: {
    enabled: true,
    rules: [ /* ... */ ],
  },
  // ... more options
};
```

## Health Check Endpoints

When running `tryforge db:monitor`, the following endpoints are available:

- `GET /health` - Overall health status
- `GET /health/connection` - Connection check
- `GET /health/performance` - Performance check
- `GET /health/live` - Liveness probe (Kubernetes)
- `GET /health/ready` - Readiness probe (Kubernetes)
- `GET /metrics` - Prometheus metrics
- `GET /dashboard` - Dashboard overview
- `GET /performance/slow-queries` - Slow queries
- `GET /connections` - Connection pool stats
- `GET /alerts` - Active alerts

## Integration Examples

### Express.js

```javascript
const express = require('express');
const { createHealthEndpoint, initializeMonitoring } = require('./src/database/monitoring');

const app = express();
const monitoring = initializeMonitoring({ database: dbConfig });

// Mount health endpoints
app.use('/db', createHealthEndpoint(monitoring.components));

app.listen(3000);
```

### Kubernetes

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    livenessProbe:
      httpGet:
        path: /health/live
        port: 9090
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 9090
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Prometheus

```yaml
scrape_configs:
  - job_name: 'tryforge-db'
    static_configs:
      - targets: ['app:9090']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

## Alert Rules

Default alert rules are configured for:

- High connection pool usage (>80%, >95%)
- Database connection failures
- Slow query detection (>10 queries, >5 seconds)
- Low cache hit ratio (<80%)
- High disk usage (>90%)
- Connection leaks
- Replication lag
- Database locks

Custom rules can be added:

```javascript
alertManager.addRule({
  name: 'custom_alert',
  condition: (context) => context.customMetric > threshold,
  message: 'Custom alert triggered',
  severity: 'warning',
  action: ['log', 'email'],
});
```

## Best Practices

1. **Enable pg_stat_statements**: Required for detailed query statistics
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
   ```

2. **Set appropriate thresholds**: Adjust based on your workload and baseline

3. **Use health endpoints**: Configure load balancers and orchestrators to use health checks

4. **Monitor trends**: Don't just look at current values, monitor trends over time

5. **Regular reviews**: Review slow queries, unused indexes, and recommendations weekly

6. **Proper cleanup**: Ensure query logger and metrics files are rotated/cleaned

7. **Secure endpoints**: Add authentication for production deployments

## Documentation

Complete documentation is available in:
- [`docs/MONITORING_GUIDE.md`](./docs/MONITORING_GUIDE.md) - Comprehensive guide

## Requirements

- Node.js 14+
- PostgreSQL 10+
- `pg` npm package
- `express` npm package (for HTTP endpoints)

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=dbuser
DB_PASSWORD=dbpass

# Monitoring
HEALTH_CHECK_PORT=9090
NODE_ENV=production

# Alerts
ALERT_EMAIL=admin@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

## License

MIT
