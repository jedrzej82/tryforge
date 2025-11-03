/**
 * TryForge Performance Analyzer
 * Analyze performance metrics, identify trends, detect regressions
 */

const logger = require('../../utils/logger');

class PerformanceAnalyzer {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      baselineWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
      comparisonWindow: 24 * 60 * 60 * 1000, // 24 hours
      regressionThreshold: 0.2, // 20% degradation
      improvementThreshold: 0.2, // 20% improvement
      ...options
    };

    this.baselines = new Map();
    this.analyses = [];
  }

  /**
   * Analyze performance metrics
   */
  analyze(metrics) {
    const analysis = {
      timestamp: Date.now(),
      summary: this.analyzeSummary(metrics),
      trends: this.analyzeTrends(metrics),
      regressions: this.detectRegressions(metrics),
      improvements: this.detectImprovements(metrics),
      anomalies: this.detectAnomalies(metrics),
      recommendations: []
    };

    // Generate recommendations based on analysis
    analysis.recommendations = this.generateRecommendations(analysis);

    this.analyses.push(analysis);

    return analysis;
  }

  /**
   * Analyze summary metrics
   */
  analyzeSummary(metrics) {
    return {
      system: {
        cpu: this.analyzeMetricSeries(metrics.system.map(m => m.cpu.usage)),
        memory: this.analyzeMetricSeries(metrics.system.map(m => m.memory.usage)),
        heap: this.analyzeMetricSeries(metrics.system.map(m => m.heap.usage))
      },
      api: {
        responseTime: this.analyzeMetricSeries(metrics.api.map(m => m.duration)),
        errorRate: this.calculateErrorRate(metrics.api),
        throughput: this.calculateThroughput(metrics.api)
      },
      database: {
        queryTime: this.analyzeMetricSeries(metrics.database.map(m => m.duration)),
        slowQueries: metrics.database.filter(m => m.duration > 100).length
      }
    };
  }

  /**
   * Analyze metric series
   */
  analyzeMetricSeries(values) {
    if (values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        trend: 'stable'
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / values.length;

    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate trend
    const trend = this.calculateTrend(values);

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: Math.round(mean * 100) / 100,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: Math.round(stdDev * 100) / 100,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
      trend
    };
  }

  /**
   * Calculate trend using linear regression
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((acc, v) => acc + v, 0);
    const sumXY = values.reduce((acc, v, i) => acc + i * v, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Determine trend based on slope
    const avgValue = sumY / n;
    const relativeSlope = Math.abs(slope) / avgValue;

    if (relativeSlope < 0.01) return 'stable';
    if (slope > 0) return 'increasing';
    return 'decreasing';
  }

  /**
   * Analyze trends over time
   */
  analyzeTrends(metrics) {
    const trends = {};

    // CPU trend
    const cpuValues = metrics.system.map(m => m.cpu.usage);
    trends.cpu = {
      direction: this.calculateTrend(cpuValues),
      rate: this.calculateTrendRate(cpuValues)
    };

    // Memory trend
    const memoryValues = metrics.system.map(m => m.memory.usage);
    trends.memory = {
      direction: this.calculateTrend(memoryValues),
      rate: this.calculateTrendRate(memoryValues)
    };

    // API response time trend
    const responseTimeValues = metrics.api.map(m => m.duration);
    trends.responseTime = {
      direction: this.calculateTrend(responseTimeValues),
      rate: this.calculateTrendRate(responseTimeValues)
    };

    return trends;
  }

  /**
   * Calculate trend rate
   */
  calculateTrendRate(values) {
    if (values.length < 2) return 0;

    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));

    const firstAvg = first.reduce((acc, v) => acc + v, 0) / first.length;
    const secondAvg = second.reduce((acc, v) => acc + v, 0) / second.length;

    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }

  /**
   * Detect performance regressions
   */
  detectRegressions(metrics) {
    const regressions = [];

    // Compare current metrics with baseline
    for (const [key, baseline] of this.baselines.entries()) {
      const currentMetrics = this.getCurrentMetrics(metrics, key);
      if (!currentMetrics) continue;

      const change = (currentMetrics.mean - baseline.mean) / baseline.mean;

      if (change > this.options.regressionThreshold) {
        regressions.push({
          metric: key,
          baseline: baseline.mean,
          current: currentMetrics.mean,
          change: Math.round(change * 100),
          severity: change > 0.5 ? 'critical' : 'warning'
        });
      }
    }

    return regressions;
  }

  /**
   * Detect performance improvements
   */
  detectImprovements(metrics) {
    const improvements = [];

    for (const [key, baseline] of this.baselines.entries()) {
      const currentMetrics = this.getCurrentMetrics(metrics, key);
      if (!currentMetrics) continue;

      const change = (baseline.mean - currentMetrics.mean) / baseline.mean;

      if (change > this.options.improvementThreshold) {
        improvements.push({
          metric: key,
          baseline: baseline.mean,
          current: currentMetrics.mean,
          change: Math.round(change * 100)
        });
      }
    }

    return improvements;
  }

  /**
   * Detect anomalies
   */
  detectAnomalies(metrics) {
    const anomalies = [];

    // CPU anomalies (> 3 standard deviations)
    const cpuValues = metrics.system.map(m => m.cpu.usage);
    const cpuStats = this.analyzeMetricSeries(cpuValues);

    cpuValues.forEach((value, index) => {
      if (Math.abs(value - cpuStats.mean) > 3 * cpuStats.stdDev) {
        anomalies.push({
          type: 'cpu',
          timestamp: metrics.system[index].timestamp,
          value,
          expected: cpuStats.mean,
          deviation: Math.abs(value - cpuStats.mean) / cpuStats.stdDev
        });
      }
    });

    // Response time anomalies
    const responseTimeValues = metrics.api.map(m => m.duration);
    const responseTimeStats = this.analyzeMetricSeries(responseTimeValues);

    responseTimeValues.forEach((value, index) => {
      if (Math.abs(value - responseTimeStats.mean) > 3 * responseTimeStats.stdDev) {
        anomalies.push({
          type: 'response_time',
          timestamp: metrics.api[index].timestamp,
          value,
          expected: responseTimeStats.mean,
          deviation: Math.abs(value - responseTimeStats.mean) / responseTimeStats.stdDev,
          endpoint: metrics.api[index].endpoint
        });
      }
    });

    return anomalies;
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate(apiMetrics) {
    if (apiMetrics.length === 0) return 0;

    const errors = apiMetrics.filter(m => !m.success).length;
    return (errors / apiMetrics.length) * 100;
  }

  /**
   * Calculate throughput
   */
  calculateThroughput(apiMetrics) {
    if (apiMetrics.length === 0) return 0;

    const timeRange = apiMetrics[apiMetrics.length - 1].timestamp - apiMetrics[0].timestamp;
    return (apiMetrics.length / timeRange) * 1000; // requests per second
  }

  /**
   * Get current metrics by key
   */
  getCurrentMetrics(metrics, key) {
    // Implementation would extract specific metrics based on key
    return null;
  }

  /**
   * Set baseline metrics
   */
  setBaseline(key, metrics) {
    this.baselines.set(key, this.analyzeMetricSeries(metrics));
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // CPU recommendations
    if (analysis.summary.system.cpu.mean > 70) {
      recommendations.push({
        category: 'cpu',
        severity: 'warning',
        title: 'High CPU Usage',
        description: `Average CPU usage is ${analysis.summary.system.cpu.mean.toFixed(1)}%`,
        suggestions: [
          'Profile CPU-intensive operations',
          'Consider horizontal scaling',
          'Optimize hot paths identified in profiler',
          'Review and optimize algorithms'
        ]
      });
    }

    // Memory recommendations
    if (analysis.summary.system.memory.mean > 80) {
      recommendations.push({
        category: 'memory',
        severity: 'warning',
        title: 'High Memory Usage',
        description: `Average memory usage is ${analysis.summary.system.memory.mean.toFixed(1)}%`,
        suggestions: [
          'Profile memory usage',
          'Check for memory leaks',
          'Review object caching strategies',
          'Consider increasing memory allocation'
        ]
      });
    }

    // API performance recommendations
    if (analysis.summary.api.responseTime.mean > 500) {
      recommendations.push({
        category: 'api',
        severity: 'info',
        title: 'Slow API Response Times',
        description: `Average response time is ${analysis.summary.api.responseTime.mean.toFixed(0)}ms`,
        suggestions: [
          'Profile slow endpoints',
          'Add caching for frequently accessed data',
          'Optimize database queries',
          'Consider using a CDN'
        ]
      });
    }

    // Database recommendations
    if (analysis.summary.database.slowQueries > 10) {
      recommendations.push({
        category: 'database',
        severity: 'warning',
        title: 'Slow Database Queries',
        description: `${analysis.summary.database.slowQueries} slow queries detected`,
        suggestions: [
          'Add database indexes',
          'Optimize query structure',
          'Consider query result caching',
          'Review N+1 query patterns'
        ]
      });
    }

    // Regression recommendations
    analysis.regressions.forEach(regression => {
      recommendations.push({
        category: 'regression',
        severity: regression.severity,
        title: `Performance Regression: ${regression.metric}`,
        description: `Performance degraded by ${regression.change}%`,
        suggestions: [
          'Review recent code changes',
          'Check for new dependencies',
          'Compare with previous baseline',
          'Run profiler to identify bottlenecks'
        ]
      });
    });

    return recommendations;
  }

  /**
   * Generate performance score (0-100)
   */
  calculatePerformanceScore(metrics) {
    let score = 100;

    const summary = this.analyzeSummary(metrics);

    // CPU impact (max -20 points)
    if (summary.system.cpu.mean > 80) score -= 20;
    else if (summary.system.cpu.mean > 60) score -= 10;
    else if (summary.system.cpu.mean > 40) score -= 5;

    // Memory impact (max -20 points)
    if (summary.system.memory.mean > 90) score -= 20;
    else if (summary.system.memory.mean > 75) score -= 10;
    else if (summary.system.memory.mean > 60) score -= 5;

    // API response time impact (max -30 points)
    if (summary.api.responseTime.mean > 2000) score -= 30;
    else if (summary.api.responseTime.mean > 1000) score -= 20;
    else if (summary.api.responseTime.mean > 500) score -= 10;
    else if (summary.api.responseTime.mean > 200) score -= 5;

    // Error rate impact (max -20 points)
    if (summary.api.errorRate > 5) score -= 20;
    else if (summary.api.errorRate > 2) score -= 10;
    else if (summary.api.errorRate > 1) score -= 5;

    // Database impact (max -10 points)
    if (summary.database.slowQueries > 50) score -= 10;
    else if (summary.database.slowQueries > 20) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Export analysis
   */
  exportAnalysis(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.analyses, null, 2);
    }

    return this.analyses;
  }
}

module.exports = {
  PerformanceAnalyzer
};
