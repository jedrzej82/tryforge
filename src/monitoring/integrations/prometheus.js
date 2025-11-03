/**
 * TryForge Prometheus Integration
 * Export metrics in Prometheus format
 */

const logger = require('../../utils/logger');

class PrometheusIntegration {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      prefix: 'tryforge_',
      ...options
    };

    this.metrics = new Map();
  }

  /**
   * Register metric
   */
  registerMetric(name, type, help) {
    this.metrics.set(name, { type, help, values: [] });
  }

  /**
   * Export metrics in Prometheus format
   */
  exportMetrics(monitor) {
    const lines = [];
    const summary = monitor.getSummary();

    // System metrics
    this.addMetric(lines, 'system_cpu_usage', 'gauge', 'CPU usage percentage', summary.system.cpu.average);
    this.addMetric(lines, 'system_memory_usage', 'gauge', 'Memory usage percentage', summary.system.memory.average);
    this.addMetric(lines, 'system_uptime_seconds', 'counter', 'System uptime in seconds', summary.system.uptime);

    // API metrics
    this.addMetric(lines, 'api_requests_total', 'counter', 'Total API requests', summary.api.totalRequests);
    this.addMetric(lines, 'api_requests_successful', 'counter', 'Successful API requests', summary.api.successfulRequests);
    this.addMetric(lines, 'api_requests_failed', 'counter', 'Failed API requests', summary.api.failedRequests);
    this.addMetric(lines, 'api_error_rate', 'gauge', 'API error rate percentage', summary.api.errorRate);
    this.addMetric(lines, 'api_response_time_ms', 'gauge', 'Average API response time in milliseconds', summary.api.avgResponseTime);
    this.addMetric(lines, 'api_response_time_p95_ms', 'gauge', '95th percentile API response time', summary.api.p95ResponseTime);
    this.addMetric(lines, 'api_response_time_p99_ms', 'gauge', '99th percentile API response time', summary.api.p99ResponseTime);

    // Database metrics
    this.addMetric(lines, 'database_queries_total', 'counter', 'Total database queries', summary.database.totalQueries);
    this.addMetric(lines, 'database_query_time_ms', 'gauge', 'Average query time in milliseconds', summary.database.avgQueryTime);
    this.addMetric(lines, 'database_slow_queries_total', 'counter', 'Total slow queries', summary.database.slowQueries);

    // Alert metrics
    this.addMetric(lines, 'alerts_total', 'gauge', 'Total alerts', summary.alerts.total);
    this.addMetric(lines, 'alerts_unacknowledged', 'gauge', 'Unacknowledged alerts', summary.alerts.unacknowledged);
    this.addMetric(lines, 'alerts_critical', 'gauge', 'Critical alerts', summary.alerts.bySeverity.critical || 0);
    this.addMetric(lines, 'alerts_warning', 'gauge', 'Warning alerts', summary.alerts.bySeverity.warning || 0);

    return lines.join('\n');
  }

  /**
   * Add metric to output
   */
  addMetric(lines, name, type, help, value, labels = {}) {
    const metricName = `${this.options.prefix}${name}`;

    // Add HELP and TYPE
    lines.push(`# HELP ${metricName} ${help}`);
    lines.push(`# TYPE ${metricName} ${type}`);

    // Add metric value
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    const metricLine = labelStr ?
      `${metricName}{${labelStr}} ${value}` :
      `${metricName} ${value}`;

    lines.push(metricLine);
    lines.push(''); // Empty line
  }

  /**
   * Create Express endpoint
   */
  createEndpoint(monitor) {
    return (req, res) => {
      try {
        const metrics = this.exportMetrics(monitor);
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metrics);
      } catch (error) {
        logger.error('Error exporting Prometheus metrics', error);
        res.status(500).send('Error exporting metrics');
      }
    };
  }
}

module.exports = {
  PrometheusIntegration
};
