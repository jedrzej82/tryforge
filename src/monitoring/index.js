/**
 * TryForge Monitoring System - Main Export
 * Comprehensive performance monitoring and profiling
 */

const { PerformanceMonitor, getMonitor, trackPerformance, expressMiddleware } = require('./performance-monitor');
const { CPUProfiler, profileFunction } = require('./profilers/cpu-profiler');
const { MemoryProfiler } = require('./profilers/memory-profiler');
const { DatabaseProfiler, createORMMiddleware } = require('./profilers/database-profiler');
const { APIProfiler, createExpressMiddleware: createAPIMiddleware } = require('./profilers/api-profiler');
const { MetricsCollector, createTimer } = require('./collectors/metrics-collector');
const { TraceCollector, createExpressMiddleware: createTraceMiddleware } = require('./collectors/trace-collector');
const { LogCollector, createWinstonTransport } = require('./collectors/log-collector');
const { PerformanceAnalyzer } = require('./analyzers/performance-analyzer');
const { BottleneckAnalyzer } = require('./analyzers/bottleneck-analyzer');
const { WebVitalsMonitor } = require('./frontend/web-vitals');
const { ResourceTimingMonitor } = require('./frontend/resource-timing');
const { SummaryReporter } = require('./reporters/summary-reporter');
const { PrometheusIntegration } = require('./integrations/prometheus');
const logger = require('../utils/logger');

/**
 * Initialize monitoring system
 */
function initializeMonitoring(options = {}) {
  const config = {
    enabled: true,
    monitor: true,
    profilers: {
      cpu: false,
      memory: false,
      database: false,
      api: true
    },
    collectors: {
      metrics: true,
      traces: false,
      logs: true
    },
    analyzers: {
      performance: true,
      bottleneck: true
    },
    frontend: {
      webVitals: false,
      resourceTiming: false
    },
    integrations: {
      prometheus: false
    },
    ...options
  };

  const instances = {};

  // Initialize performance monitor
  if (config.monitor) {
    instances.monitor = getMonitor({
      enabled: config.enabled,
      ...config.monitorOptions
    });
    instances.monitor.start();
    logger.info('Performance monitor initialized');
  }

  // Initialize profilers
  if (config.profilers.cpu) {
    instances.cpuProfiler = new CPUProfiler(config.profilers.cpuOptions);
    logger.info('CPU profiler initialized');
  }

  if (config.profilers.memory) {
    instances.memoryProfiler = new MemoryProfiler(config.profilers.memoryOptions);
    logger.info('Memory profiler initialized');
  }

  if (config.profilers.database) {
    instances.databaseProfiler = new DatabaseProfiler(config.profilers.databaseOptions);
    instances.databaseProfiler.start();
    logger.info('Database profiler initialized');
  }

  if (config.profilers.api) {
    instances.apiProfiler = new APIProfiler(config.profilers.apiOptions);
    instances.apiProfiler.start();
    logger.info('API profiler initialized');
  }

  // Initialize collectors
  if (config.collectors.metrics) {
    instances.metricsCollector = new MetricsCollector(config.collectors.metricsOptions);
    instances.metricsCollector.start();
    logger.info('Metrics collector initialized');
  }

  if (config.collectors.traces) {
    instances.traceCollector = new TraceCollector(config.collectors.traceOptions);
    instances.traceCollector.start();
    logger.info('Trace collector initialized');
  }

  if (config.collectors.logs) {
    instances.logCollector = new LogCollector(config.collectors.logOptions);
    instances.logCollector.start();
    logger.info('Log collector initialized');
  }

  // Initialize analyzers
  if (config.analyzers.performance) {
    instances.performanceAnalyzer = new PerformanceAnalyzer(config.analyzers.performanceOptions);
    logger.info('Performance analyzer initialized');
  }

  if (config.analyzers.bottleneck) {
    instances.bottleneckAnalyzer = new BottleneckAnalyzer(config.analyzers.bottleneckOptions);
    logger.info('Bottleneck analyzer initialized');
  }

  // Initialize frontend monitoring
  if (config.frontend.webVitals) {
    instances.webVitalsMonitor = new WebVitalsMonitor(config.frontend.webVitalsOptions);
    instances.webVitalsMonitor.start();
    logger.info('Web Vitals monitor initialized');
  }

  if (config.frontend.resourceTiming) {
    instances.resourceTimingMonitor = new ResourceTimingMonitor(config.frontend.resourceTimingOptions);
    instances.resourceTimingMonitor.start();
    logger.info('Resource Timing monitor initialized');
  }

  // Initialize integrations
  if (config.integrations.prometheus) {
    instances.prometheusIntegration = new PrometheusIntegration(config.integrations.prometheusOptions);
    logger.info('Prometheus integration initialized');
  }

  // Initialize reporters
  instances.summaryReporter = new SummaryReporter();

  return instances;
}

/**
 * Instrument Express application
 */
function instrumentExpress(app, options = {}) {
  const config = {
    collectMetrics: true,
    profileQueries: false,
    trackMemory: false,
    enableTracing: false,
    alertThresholds: {
      responseTime: 1000,
      errorRate: 0.01,
      memoryUsage: 0.8
    },
    ...options
  };

  logger.info('Instrumenting Express application', config);

  const instances = {};

  // Basic monitoring
  const monitor = getMonitor({
    alertThresholds: config.alertThresholds
  });
  monitor.start();
  instances.monitor = monitor;

  // Add Express middleware
  app.use(expressMiddleware(monitor));

  // API profiling
  if (config.collectMetrics) {
    const apiProfiler = new APIProfiler();
    apiProfiler.start();
    app.use(createAPIMiddleware(apiProfiler));
    instances.apiProfiler = apiProfiler;
  }

  // Distributed tracing
  if (config.enableTracing) {
    const traceCollector = new TraceCollector();
    traceCollector.start();
    app.use(createTraceMiddleware(traceCollector));
    instances.traceCollector = traceCollector;
  }

  // Metrics collection
  const metricsCollector = new MetricsCollector();
  metricsCollector.start();
  instances.metricsCollector = metricsCollector;

  // Add monitoring endpoints
  app.get('/_monitoring/health', (req, res) => {
    const summary = monitor.getSummary();
    res.json({
      status: summary.status,
      uptime: summary.system.uptime,
      timestamp: Date.now()
    });
  });

  app.get('/_monitoring/metrics', (req, res) => {
    const summary = monitor.getSummary();
    res.json(summary);
  });

  // Prometheus endpoint
  if (config.prometheusEndpoint !== false) {
    const prometheus = new PrometheusIntegration();
    app.get('/_monitoring/prometheus', prometheus.createEndpoint(monitor));
    logger.info('Prometheus endpoint enabled at /_monitoring/prometheus');
  }

  logger.info('Express application instrumented successfully');

  return instances;
}

/**
 * Create monitoring dashboard data
 */
function getDashboardData(instances) {
  const data = {
    timestamp: Date.now(),
    status: 'operational'
  };

  if (instances.monitor) {
    data.summary = instances.monitor.getSummary();
  }

  if (instances.apiProfiler) {
    data.api = instances.apiProfiler.exportProfile();
  }

  if (instances.databaseProfiler) {
    data.database = instances.databaseProfiler.exportProfile();
  }

  if (instances.metricsCollector) {
    data.metrics = instances.metricsCollector.getSummary();
  }

  return data;
}

/**
 * Generate performance report
 */
function generateReport(instances, period = 'daily') {
  const reporter = new SummaryReporter();

  if (!instances.monitor) {
    throw new Error('Performance monitor not initialized');
  }

  const report = reporter.generateReport(instances.monitor, period);

  return report;
}

/**
 * Run performance analysis
 */
function runAnalysis(instances) {
  if (!instances.monitor) {
    throw new Error('Performance monitor not initialized');
  }

  const metrics = instances.monitor.getAllMetrics();

  const analysis = {
    timestamp: Date.now()
  };

  // Performance analysis
  if (instances.performanceAnalyzer) {
    analysis.performance = instances.performanceAnalyzer.analyze(metrics);
  }

  // Bottleneck analysis
  if (instances.bottleneckAnalyzer) {
    const profiles = {
      cpu: instances.cpuProfiler?.exportProfile?.() || null,
      memory: instances.memoryProfiler?.exportProfile?.() || null,
      api: instances.apiProfiler?.exportProfile?.() || null,
      database: instances.databaseProfiler?.exportProfile?.() || null
    };

    analysis.bottlenecks = instances.bottleneckAnalyzer.analyze(metrics, profiles);
  }

  return analysis;
}

/**
 * Export monitoring data
 */
function exportData(instances, format = 'json') {
  const data = getDashboardData(instances);

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (format === 'prometheus') {
    if (!instances.prometheusIntegration) {
      instances.prometheusIntegration = new PrometheusIntegration();
    }
    return instances.prometheusIntegration.exportMetrics(instances.monitor);
  }

  return data;
}

/**
 * Cleanup and stop monitoring
 */
function cleanup(instances) {
  logger.info('Cleaning up monitoring instances');

  if (instances.monitor) {
    instances.monitor.stop();
  }

  if (instances.cpuProfiler && instances.cpuProfiler.isProfiling) {
    instances.cpuProfiler.stop();
  }

  if (instances.memoryProfiler && instances.memoryProfiler.isMonitoring) {
    instances.memoryProfiler.stop();
  }

  if (instances.databaseProfiler && instances.databaseProfiler.isMonitoring) {
    instances.databaseProfiler.stop();
  }

  if (instances.apiProfiler && instances.apiProfiler.isMonitoring) {
    instances.apiProfiler.stop();
  }

  if (instances.metricsCollector && instances.metricsCollector.isCollecting) {
    instances.metricsCollector.stop();
  }

  if (instances.traceCollector && instances.traceCollector.isCollecting) {
    instances.traceCollector.stop();
  }

  if (instances.logCollector && instances.logCollector.isCollecting) {
    instances.logCollector.stop();
  }

  logger.info('Monitoring cleanup complete');
}

// Export all components
module.exports = {
  // Main functions
  initializeMonitoring,
  instrumentExpress,
  getDashboardData,
  generateReport,
  runAnalysis,
  exportData,
  cleanup,

  // Core components
  PerformanceMonitor,
  getMonitor,
  trackPerformance,

  // Profilers
  CPUProfiler,
  MemoryProfiler,
  DatabaseProfiler,
  APIProfiler,
  profileFunction,

  // Collectors
  MetricsCollector,
  TraceCollector,
  LogCollector,
  createTimer,

  // Analyzers
  PerformanceAnalyzer,
  BottleneckAnalyzer,

  // Frontend
  WebVitalsMonitor,
  ResourceTimingMonitor,

  // Reporters
  SummaryReporter,

  // Integrations
  PrometheusIntegration,

  // Middleware
  expressMiddleware,
  createAPIMiddleware,
  createTraceMiddleware,
  createORMMiddleware,
  createWinstonTransport
};
