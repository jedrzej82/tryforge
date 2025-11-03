/**
 * TryForge Metrics Collector
 * Custom metric collection, system metrics, and time-series storage
 */

const os = require('os');
const logger = require('../../utils/logger');

class MetricsCollector {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      collectInterval: 10000, // 10 seconds
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      aggregationIntervals: [60000, 300000, 3600000], // 1min, 5min, 1hour
      ...options
    };

    this.metrics = new Map();
    this.timeSeries = new Map();
    this.aggregatedMetrics = new Map();
    this.isCollecting = false;
    this.collectionInterval = null;
    this.startTime = null;
  }

  /**
   * Start metrics collection
   */
  start() {
    if (this.isCollecting) {
      logger.warn('Metrics collection already started');
      return;
    }

    this.isCollecting = true;
    this.startTime = Date.now();

    logger.info('Starting metrics collection', {
      interval: this.options.collectInterval
    });

    // Start periodic collection
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.aggregateMetrics();
      this.cleanOldMetrics();
    }, this.options.collectInterval);

    // Initial collection
    this.collectSystemMetrics();
  }

  /**
   * Stop metrics collection
   */
  stop() {
    if (!this.isCollecting) {
      logger.warn('Metrics collection not started');
      return;
    }

    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    logger.info('Stopped metrics collection');
  }

  /**
   * Record metric
   */
  recordMetric(name, value, tags = {}, timestamp = Date.now()) {
    const metricKey = this.getMetricKey(name, tags);

    // Store current value
    this.metrics.set(metricKey, {
      name,
      value,
      tags,
      timestamp
    });

    // Store in time series
    if (!this.timeSeries.has(metricKey)) {
      this.timeSeries.set(metricKey, []);
    }

    const series = this.timeSeries.get(metricKey);
    series.push({ timestamp, value });

    // Limit time series size
    if (series.length > 10000) {
      series.shift();
    }
  }

  /**
   * Increment counter metric
   */
  incrementCounter(name, value = 1, tags = {}) {
    const metricKey = this.getMetricKey(name, tags);
    const current = this.metrics.get(metricKey);

    const newValue = current ? current.value + value : value;
    this.recordMetric(name, newValue, tags);
  }

  /**
   * Record gauge metric (current value)
   */
  recordGauge(name, value, tags = {}) {
    this.recordMetric(name, value, tags);
  }

  /**
   * Record histogram metric (for distributions)
   */
  recordHistogram(name, value, tags = {}) {
    const metricKey = `${this.getMetricKey(name, tags)}:histogram`;

    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, {
        name,
        type: 'histogram',
        values: [],
        tags,
        timestamp: Date.now()
      });
    }

    const histogram = this.metrics.get(metricKey);
    histogram.values.push(value);
    histogram.timestamp = Date.now();

    // Limit histogram size
    if (histogram.values.length > 1000) {
      histogram.values.shift();
    }
  }

  /**
   * Record timing metric
   */
  recordTiming(name, durationMs, tags = {}) {
    this.recordHistogram(`${name}.duration`, durationMs, tags);
    this.recordGauge(`${name}.last_duration`, durationMs, tags);
  }

  /**
   * Get metric key from name and tags
   */
  getMetricKey(name, tags = {}) {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');

    return tagString ? `${name}{${tagString}}` : name;
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const timestamp = Date.now();

    // CPU metrics
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    this.recordGauge('system.cpu.count', cpus.length, {}, timestamp);
    this.recordGauge('system.cpu.load.1m', loadAvg[0], {}, timestamp);
    this.recordGauge('system.cpu.load.5m', loadAvg[1], {}, timestamp);
    this.recordGauge('system.cpu.load.15m', loadAvg[2], {}, timestamp);

    // Memory metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    this.recordGauge('system.memory.total', totalMem, {}, timestamp);
    this.recordGauge('system.memory.free', freeMem, {}, timestamp);
    this.recordGauge('system.memory.used', usedMem, {}, timestamp);
    this.recordGauge('system.memory.usage_percent', (usedMem / totalMem) * 100, {}, timestamp);

    // Process metrics
    const processMemory = process.memoryUsage();

    this.recordGauge('process.memory.rss', processMemory.rss, {}, timestamp);
    this.recordGauge('process.memory.heap_total', processMemory.heapTotal, {}, timestamp);
    this.recordGauge('process.memory.heap_used', processMemory.heapUsed, {}, timestamp);
    this.recordGauge('process.memory.external', processMemory.external, {}, timestamp);

    this.recordGauge('process.uptime', process.uptime(), {}, timestamp);
    this.recordGauge('process.active_handles', process._getActiveHandles().length, {}, timestamp);
    this.recordGauge('process.active_requests', process._getActiveRequests().length, {}, timestamp);
  }

  /**
   * Aggregate metrics over time intervals
   */
  aggregateMetrics() {
    const now = Date.now();

    for (const [key, series] of this.timeSeries.entries()) {
      for (const interval of this.options.aggregationIntervals) {
        const aggregationKey = `${key}:${interval}`;

        if (!this.aggregatedMetrics.has(aggregationKey)) {
          this.aggregatedMetrics.set(aggregationKey, []);
        }

        const aggregated = this.aggregatedMetrics.get(aggregationKey);

        // Filter values in this interval
        const intervalStart = now - interval;
        const values = series
          .filter(point => point.timestamp >= intervalStart)
          .map(point => point.value);

        if (values.length > 0) {
          const stats = this.calculateStatistics(values);

          aggregated.push({
            timestamp: now,
            interval,
            count: values.length,
            ...stats
          });

          // Limit aggregated data
          if (aggregated.length > 1000) {
            aggregated.shift();
          }
        }
      }
    }
  }

  /**
   * Calculate statistics for values
   */
  calculateStatistics(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / values.length;

    // Calculate standard deviation
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      sum,
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev,
      p50: sorted[Math.floor(sorted.length * 0.50)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.90)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Get metric
   */
  getMetric(name, tags = {}) {
    const key = this.getMetricKey(name, tags);
    return this.metrics.get(key);
  }

  /**
   * Get metric time series
   */
  getTimeSeries(name, tags = {}, timeRange = null) {
    const key = this.getMetricKey(name, tags);
    let series = this.timeSeries.get(key) || [];

    if (timeRange) {
      const now = Date.now();
      series = series.filter(point =>
        point.timestamp >= now - timeRange
      );
    }

    return series;
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(name, tags = {}, interval) {
    const key = this.getMetricKey(name, tags);
    const aggregationKey = `${key}:${interval}`;
    return this.aggregatedMetrics.get(aggregationKey) || [];
  }

  /**
   * Query metrics by name pattern
   */
  queryMetrics(namePattern, tags = {}) {
    const results = [];

    for (const [key, metric] of this.metrics.entries()) {
      // Check if name matches pattern
      const nameMatches = namePattern instanceof RegExp
        ? namePattern.test(metric.name)
        : metric.name.includes(namePattern);

      if (!nameMatches) continue;

      // Check if tags match
      const tagsMatch = Object.entries(tags).every(([k, v]) =>
        metric.tags[k] === v
      );

      if (tagsMatch) {
        results.push(metric);
      }
    }

    return results;
  }

  /**
   * Clean old metrics based on retention period
   */
  cleanOldMetrics() {
    const cutoff = Date.now() - this.options.retentionPeriod;

    // Clean time series
    for (const [key, series] of this.timeSeries.entries()) {
      const filtered = series.filter(point => point.timestamp >= cutoff);

      if (filtered.length === 0) {
        this.timeSeries.delete(key);
      } else {
        this.timeSeries.set(key, filtered);
      }
    }

    // Clean aggregated metrics
    for (const [key, aggregated] of this.aggregatedMetrics.entries()) {
      const filtered = aggregated.filter(point => point.timestamp >= cutoff);

      if (filtered.length === 0) {
        this.aggregatedMetrics.delete(key);
      } else {
        this.aggregatedMetrics.set(key, filtered);
      }
    }

    // Clean stale current metrics (no updates in retention period)
    for (const [key, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoff) {
        this.metrics.delete(key);
      }
    }
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    return {
      totalMetrics: this.metrics.size,
      timeSeriesCount: this.timeSeries.size,
      aggregatedMetricsCount: this.aggregatedMetrics.size,
      collectionInterval: this.options.collectInterval,
      retentionPeriod: this.options.retentionPeriod,
      isCollecting: this.isCollecting,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus() {
    const lines = [];

    for (const [key, metric] of this.metrics.entries()) {
      if (metric.type === 'histogram') {
        // Export histogram as summary
        const stats = this.calculateStatistics(metric.values);
        lines.push(`# TYPE ${metric.name} summary`);
        lines.push(`${metric.name}_sum ${stats.sum}`);
        lines.push(`${metric.name}_count ${metric.values.length}`);
        lines.push(`${metric.name}{quantile="0.5"} ${stats.p50}`);
        lines.push(`${metric.name}{quantile="0.9"} ${stats.p90}`);
        lines.push(`${metric.name}{quantile="0.95"} ${stats.p95}`);
        lines.push(`${metric.name}{quantile="0.99"} ${stats.p99}`);
      } else {
        // Export as gauge
        const tagsStr = Object.entries(metric.tags)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');

        const metricName = tagsStr ? `${metric.name}{${tagsStr}}` : metric.name;
        lines.push(`${metricName} ${metric.value} ${metric.timestamp}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Export metrics as JSON
   */
  exportJSON() {
    return {
      timestamp: Date.now(),
      summary: this.getSummary(),
      metrics: this.getAllMetrics(),
      timeSeries: Object.fromEntries(this.timeSeries),
      aggregated: Object.fromEntries(this.aggregatedMetrics)
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.timeSeries.clear();
    this.aggregatedMetrics.clear();
    logger.info('Metrics collector reset');
  }
}

/**
 * Timer helper for measuring durations
 */
class MetricTimer {
  constructor(collector, name, tags = {}) {
    this.collector = collector;
    this.name = name;
    this.tags = tags;
    this.startTime = Date.now();
  }

  stop() {
    const duration = Date.now() - this.startTime;
    this.collector.recordTiming(this.name, duration, this.tags);
    return duration;
  }
}

/**
 * Create timer
 */
function createTimer(collector, name, tags = {}) {
  return new MetricTimer(collector, name, tags);
}

module.exports = {
  MetricsCollector,
  MetricTimer,
  createTimer
};
