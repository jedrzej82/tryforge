/**
 * TryForge Trace Collector
 * Distributed tracing, request flow tracking, and service dependency mapping
 */

const crypto = require('crypto');
const logger = require('../../utils/logger');

class TraceCollector {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      sampleRate: 1.0, // Sample 100% of traces
      maxSpansPerTrace: 1000,
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      ...options
    };

    this.traces = new Map();
    this.activeSpans = new Map();
    this.serviceDependencies = new Map();
    this.isCollecting = false;
    this.startTime = null;
  }

  /**
   * Start trace collection
   */
  start() {
    if (this.isCollecting) {
      logger.warn('Trace collection already started');
      return;
    }

    this.isCollecting = true;
    this.startTime = Date.now();

    logger.info('Starting trace collection', {
      sampleRate: this.options.sampleRate
    });

    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanOldTraces();
    }, 60000); // Every minute
  }

  /**
   * Stop trace collection
   */
  stop() {
    if (!this.isCollecting) {
      logger.warn('Trace collection not started');
      return;
    }

    this.isCollecting = false;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    logger.info('Stopped trace collection');
  }

  /**
   * Generate trace ID
   */
  generateTraceId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate span ID
   */
  generateSpanId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Should sample this trace?
   */
  shouldSample() {
    return Math.random() < this.options.sampleRate;
  }

  /**
   * Start a new trace
   */
  startTrace(name, metadata = {}) {
    if (!this.shouldSample()) {
      return null;
    }

    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    const trace = {
      traceId,
      rootSpanId: spanId,
      name,
      startTime: Date.now(),
      metadata,
      spans: [],
      serviceDependencies: new Set()
    };

    this.traces.set(traceId, trace);

    // Start root span
    return this.startSpan(name, traceId, null, metadata);
  }

  /**
   * Start a new span
   */
  startSpan(name, traceId, parentSpanId = null, metadata = {}) {
    if (!this.isCollecting || !this.traces.has(traceId)) {
      return null;
    }

    const spanId = this.generateSpanId();

    const span = {
      spanId,
      traceId,
      parentSpanId,
      name,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      metadata: {
        service: metadata.service || 'unknown',
        operation: metadata.operation || name,
        ...metadata
      },
      tags: {},
      logs: [],
      error: null
    };

    this.activeSpans.set(spanId, span);

    return {
      spanId,
      traceId,
      parentSpanId,
      setTag: (key, value) => this.setSpanTag(spanId, key, value),
      log: (message, data) => this.logSpanEvent(spanId, message, data),
      setError: (error) => this.setSpanError(spanId, error),
      finish: () => this.finishSpan(spanId)
    };
  }

  /**
   * Set span tag
   */
  setSpanTag(spanId, key, value) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  /**
   * Log span event
   */
  logSpanEvent(spanId, message, data = {}) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        data
      });
    }
  }

  /**
   * Set span error
   */
  setSpanError(spanId, error) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.error = {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      };
      span.tags.error = true;
    }
  }

  /**
   * Finish span
   */
  finishSpan(spanId) {
    const span = this.activeSpans.get(spanId);
    if (!span) return null;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;

    const trace = this.traces.get(span.traceId);
    if (trace) {
      trace.spans.push(span);

      // Track service dependency
      if (span.parentSpanId) {
        const parentSpan = trace.spans.find(s => s.spanId === span.parentSpanId);
        if (parentSpan && parentSpan.metadata.service !== span.metadata.service) {
          const dependency = `${parentSpan.metadata.service}->${span.metadata.service}`;
          trace.serviceDependencies.add(dependency);
          this.trackServiceDependency(parentSpan.metadata.service, span.metadata.service);
        }
      }

      // Check if trace is complete
      if (trace.spans.length > this.options.maxSpansPerTrace) {
        logger.warn('Trace exceeded maximum spans', { traceId: span.traceId });
      }
    }

    this.activeSpans.delete(spanId);

    return span;
  }

  /**
   * Track service dependency
   */
  trackServiceDependency(fromService, toService) {
    const key = `${fromService}->${toService}`;

    if (!this.serviceDependencies.has(key)) {
      this.serviceDependencies.set(key, {
        from: fromService,
        to: toService,
        count: 0,
        errors: 0,
        totalDuration: 0,
        durations: []
      });
    }

    const dependency = this.serviceDependencies.get(key);
    dependency.count++;
  }

  /**
   * Get trace
   */
  getTrace(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    // Build trace tree
    const spans = [...trace.spans];
    const rootSpan = spans.find(s => s.spanId === trace.rootSpanId);

    const buildTree = (span) => {
      const children = spans
        .filter(s => s.parentSpanId === span.spanId)
        .map(buildTree);

      return {
        ...span,
        children
      };
    };

    return {
      traceId: trace.traceId,
      name: trace.name,
      startTime: trace.startTime,
      endTime: rootSpan?.endTime,
      duration: rootSpan?.duration,
      metadata: trace.metadata,
      spanCount: spans.length,
      serviceDependencies: Array.from(trace.serviceDependencies),
      tree: rootSpan ? buildTree(rootSpan) : null
    };
  }

  /**
   * Search traces
   */
  searchTraces(filters = {}) {
    const results = [];

    for (const [traceId, trace] of this.traces.entries()) {
      let matches = true;

      // Filter by name
      if (filters.name && !trace.name.includes(filters.name)) {
        matches = false;
      }

      // Filter by service
      if (filters.service) {
        const hasService = trace.spans.some(s =>
          s.metadata.service === filters.service
        );
        if (!hasService) matches = false;
      }

      // Filter by duration
      if (filters.minDuration || filters.maxDuration) {
        const rootSpan = trace.spans.find(s => s.spanId === trace.rootSpanId);
        if (rootSpan) {
          if (filters.minDuration && rootSpan.duration < filters.minDuration) {
            matches = false;
          }
          if (filters.maxDuration && rootSpan.duration > filters.maxDuration) {
            matches = false;
          }
        }
      }

      // Filter by error
      if (filters.hasError) {
        const hasError = trace.spans.some(s => s.error !== null);
        if (!hasError) matches = false;
      }

      // Filter by time range
      if (filters.startTime && trace.startTime < filters.startTime) {
        matches = false;
      }
      if (filters.endTime && trace.startTime > filters.endTime) {
        matches = false;
      }

      if (matches) {
        results.push(this.getTrace(traceId));
      }
    }

    return results;
  }

  /**
   * Get service dependency map
   */
  getServiceDependencies() {
    const dependencies = Array.from(this.serviceDependencies.values());

    return dependencies.map(dep => ({
      from: dep.from,
      to: dep.to,
      calls: dep.count,
      errors: dep.errors,
      errorRate: dep.count > 0 ? (dep.errors / dep.count) * 100 : 0,
      avgDuration: dep.durations.length > 0
        ? dep.durations.reduce((sum, d) => sum + d, 0) / dep.durations.length
        : 0
    }));
  }

  /**
   * Get service map (for visualization)
   */
  getServiceMap() {
    const services = new Set();
    const dependencies = this.getServiceDependencies();

    dependencies.forEach(dep => {
      services.add(dep.from);
      services.add(dep.to);
    });

    return {
      services: Array.from(services).map(service => ({
        name: service,
        calls: dependencies
          .filter(d => d.from === service || d.to === service)
          .reduce((sum, d) => sum + d.calls, 0)
      })),
      dependencies
    };
  }

  /**
   * Get trace statistics
   */
  getStatistics(timeRange = 3600000) { // Default 1 hour
    const now = Date.now();
    const cutoff = now - timeRange;

    const recentTraces = Array.from(this.traces.values())
      .filter(t => t.startTime >= cutoff);

    const allSpans = recentTraces.flatMap(t => t.spans);
    const durations = allSpans
      .filter(s => s.duration !== null)
      .map(s => s.duration);

    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p50Index = Math.floor(sortedDurations.length * 0.50);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);

    const errorSpans = allSpans.filter(s => s.error !== null);

    return {
      timeRange,
      traces: {
        total: recentTraces.length,
        complete: recentTraces.filter(t =>
          t.spans.some(s => s.spanId === t.rootSpanId && s.endTime !== null)
        ).length,
        withErrors: recentTraces.filter(t =>
          t.spans.some(s => s.error !== null)
        ).length
      },
      spans: {
        total: allSpans.length,
        withErrors: errorSpans.length,
        avgDuration: durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0,
        p50Duration: sortedDurations[p50Index] || 0,
        p95Duration: sortedDurations[p95Index] || 0,
        p99Duration: sortedDurations[p99Index] || 0
      },
      services: {
        total: new Set(allSpans.map(s => s.metadata.service)).size,
        dependencies: this.serviceDependencies.size
      }
    };
  }

  /**
   * Clean old traces
   */
  cleanOldTraces() {
    const cutoff = Date.now() - this.options.retentionPeriod;

    for (const [traceId, trace] of this.traces.entries()) {
      if (trace.startTime < cutoff) {
        this.traces.delete(traceId);
      }
    }
  }

  /**
   * Export traces
   */
  exportTraces(format = 'json') {
    const traces = Array.from(this.traces.keys()).map(traceId =>
      this.getTrace(traceId)
    );

    if (format === 'json') {
      return JSON.stringify(traces, null, 2);
    }

    if (format === 'zipkin') {
      return this.exportZipkinFormat(traces);
    }

    if (format === 'jaeger') {
      return this.exportJaegerFormat(traces);
    }

    return traces;
  }

  /**
   * Export in Zipkin format
   */
  exportZipkinFormat(traces) {
    // Zipkin format implementation
    return traces.map(trace => ({
      traceId: trace.traceId,
      name: trace.name,
      timestamp: trace.startTime * 1000, // microseconds
      duration: trace.duration * 1000,
      spans: trace.tree ? this.flattenTree(trace.tree) : []
    }));
  }

  /**
   * Export in Jaeger format
   */
  exportJaegerFormat(traces) {
    // Jaeger format implementation
    return traces.map(trace => ({
      traceID: trace.traceId,
      spans: trace.tree ? this.flattenTree(trace.tree) : [],
      processes: {}
    }));
  }

  /**
   * Flatten trace tree
   */
  flattenTree(node) {
    const spans = [node];
    if (node.children) {
      node.children.forEach(child => {
        spans.push(...this.flattenTree(child));
      });
    }
    return spans;
  }

  /**
   * Reset collector
   */
  reset() {
    this.traces.clear();
    this.activeSpans.clear();
    this.serviceDependencies.clear();
    logger.info('Trace collector reset');
  }
}

/**
 * Express middleware for automatic tracing
 */
function createExpressMiddleware(collector) {
  return (req, res, next) => {
    // Start trace
    const span = collector.startTrace(`${req.method} ${req.path}`, {
      service: 'express-app',
      operation: 'http.request',
      http: {
        method: req.method,
        url: req.url,
        path: req.path,
        headers: req.headers
      }
    });

    if (!span) {
      return next();
    }

    // Add trace context to request
    req.trace = span;

    // Capture response
    res.on('finish', () => {
      span.setTag('http.status_code', res.statusCode);
      span.setTag('http.status_class', `${Math.floor(res.statusCode / 100)}xx`);

      if (res.statusCode >= 400) {
        span.setError(new Error(`HTTP ${res.statusCode}`));
      }

      span.finish();
    });

    next();
  };
}

module.exports = {
  TraceCollector,
  createExpressMiddleware
};
