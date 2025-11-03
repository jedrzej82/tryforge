/**
 * TryForge Bottleneck Analyzer
 * Find performance bottlenecks and suggest optimizations
 */

const logger = require('../../utils/logger');

class BottleneckAnalyzer {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      cpuThreshold: 70,
      memoryThreshold: 80,
      responseTimeThreshold: 1000,
      queryTimeThreshold: 100,
      ...options
    };

    this.bottlenecks = [];
  }

  /**
   * Analyze for bottlenecks
   */
  analyze(metrics, profiles) {
    const bottlenecks = [];

    // Analyze CPU bottlenecks
    bottlenecks.push(...this.analyzeCPUBottlenecks(metrics, profiles.cpu));

    // Analyze memory bottlenecks
    bottlenecks.push(...this.analyzeMemoryBottlenecks(metrics, profiles.memory));

    // Analyze API bottlenecks
    bottlenecks.push(...this.analyzeAPIBottlenecks(metrics, profiles.api));

    // Analyze database bottlenecks
    bottlenecks.push(...this.analyzeDatabaseBottlenecks(metrics, profiles.database));

    // Analyze resource utilization
    bottlenecks.push(...this.analyzeResourceUtilization(metrics));

    // Analyze dependencies
    bottlenecks.push(...this.analyzeDependencies(profiles));

    this.bottlenecks = bottlenecks;

    return {
      bottlenecks,
      criticalCount: bottlenecks.filter(b => b.severity === 'critical').length,
      warningCount: bottlenecks.filter(b => b.severity === 'warning').length,
      recommendations: this.generateRecommendations(bottlenecks)
    };
  }

  /**
   * Analyze CPU bottlenecks
   */
  analyzeCPUBottlenecks(metrics, cpuProfile) {
    const bottlenecks = [];

    if (!cpuProfile) return bottlenecks;

    // High CPU usage
    const avgCPU = metrics.system.reduce((sum, m) => sum + m.cpu.usage, 0) / metrics.system.length;

    if (avgCPU > this.options.cpuThreshold) {
      bottlenecks.push({
        type: 'cpu',
        severity: avgCPU > 90 ? 'critical' : 'warning',
        title: 'High CPU Usage',
        description: `Average CPU usage is ${avgCPU.toFixed(1)}%`,
        impact: 'high',
        metrics: {
          avgCPU,
          threshold: this.options.cpuThreshold
        },
        suggestions: [
          'Review hot paths in CPU profiler',
          'Optimize computational algorithms',
          'Consider asynchronous processing',
          'Scale horizontally if needed'
        ]
      });
    }

    // CPU-intensive functions
    if (cpuProfile.functions && cpuProfile.functions.hotPaths) {
      cpuProfile.functions.hotPaths.forEach(fn => {
        if (fn.totalTime > 5000) { // > 5 seconds total
          bottlenecks.push({
            type: 'cpu_function',
            severity: 'warning',
            title: `CPU-Intensive Function: ${fn.name}`,
            description: `Function consumed ${fn.totalTime}ms total CPU time`,
            impact: 'medium',
            metrics: {
              function: fn.name,
              totalTime: fn.totalTime,
              calls: fn.calls,
              avgTime: fn.avgTime
            },
            suggestions: [
              'Optimize function implementation',
              'Reduce function call frequency',
              'Consider caching results',
              'Move to background processing if possible'
            ]
          });
        }
      });
    }

    return bottlenecks;
  }

  /**
   * Analyze memory bottlenecks
   */
  analyzeMemoryBottlenecks(metrics, memoryProfile) {
    const bottlenecks = [];

    if (!memoryProfile) return bottlenecks;

    // High memory usage
    const avgMemory = metrics.system.reduce((sum, m) => sum + m.memory.usage, 0) / metrics.system.length;

    if (avgMemory > this.options.memoryThreshold) {
      bottlenecks.push({
        type: 'memory',
        severity: avgMemory > 95 ? 'critical' : 'warning',
        title: 'High Memory Usage',
        description: `Average memory usage is ${avgMemory.toFixed(1)}%`,
        impact: 'high',
        metrics: {
          avgMemory,
          threshold: this.options.memoryThreshold
        },
        suggestions: [
          'Review memory profiler for leaks',
          'Optimize data structures',
          'Implement memory pooling',
          'Clear unused caches'
        ]
      });
    }

    // Memory leaks
    if (memoryProfile.leakDetection && memoryProfile.leakDetection.detected) {
      bottlenecks.push({
        type: 'memory_leak',
        severity: 'critical',
        title: 'Memory Leak Detected',
        description: `Memory growing by ${Math.round(memoryProfile.leakDetection.avgGrowth / 1024 / 1024)}MB on average`,
        impact: 'critical',
        metrics: memoryProfile.leakDetection,
        suggestions: [
          'Review heap snapshots',
          'Check for unclosed resources',
          'Look for circular references',
          'Review event listener cleanup'
        ]
      });
    }

    return bottlenecks;
  }

  /**
   * Analyze API bottlenecks
   */
  analyzeAPIBottlenecks(metrics, apiProfile) {
    const bottlenecks = [];

    if (!apiProfile) return bottlenecks;

    // Slow endpoints
    if (apiProfile.endpoints && apiProfile.endpoints.slowest) {
      apiProfile.endpoints.slowest.forEach((endpoint, index) => {
        if (endpoint.avgDuration > this.options.responseTimeThreshold) {
          bottlenecks.push({
            type: 'slow_endpoint',
            severity: endpoint.avgDuration > 2000 ? 'critical' : 'warning',
            title: `Slow Endpoint: ${endpoint.endpoint}`,
            description: `Average response time is ${endpoint.avgDuration}ms`,
            impact: 'high',
            metrics: endpoint,
            suggestions: [
              'Add caching for this endpoint',
              'Optimize database queries',
              'Review business logic',
              'Consider pagination for large datasets'
            ]
          });
        }
      });
    }

    // High error rate endpoints
    if (apiProfile.endpoints && apiProfile.endpoints.highestErrorRate) {
      apiProfile.endpoints.highestErrorRate.forEach(endpoint => {
        if (endpoint.errorRate > 5) {
          bottlenecks.push({
            type: 'high_error_rate',
            severity: endpoint.errorRate > 10 ? 'critical' : 'warning',
            title: `High Error Rate: ${endpoint.endpoint}`,
            description: `Error rate is ${endpoint.errorRate}%`,
            impact: 'high',
            metrics: endpoint,
            suggestions: [
              'Review error logs',
              'Add error handling',
              'Validate input data',
              'Check external service dependencies'
            ]
          });
        }
      });
    }

    return bottlenecks;
  }

  /**
   * Analyze database bottlenecks
   */
  analyzeDatabaseBottlenecks(metrics, databaseProfile) {
    const bottlenecks = [];

    if (!databaseProfile) return bottlenecks;

    // Slow queries
    if (databaseProfile.slowQueries && databaseProfile.slowQueries.length > 0) {
      databaseProfile.slowQueries.forEach((query, index) => {
        if (index < 5) { // Top 5 slowest
          bottlenecks.push({
            type: 'slow_query',
            severity: query.duration > 500 ? 'critical' : 'warning',
            title: 'Slow Database Query',
            description: `Query takes ${query.duration}ms on average`,
            impact: 'medium',
            metrics: query,
            suggestions: [
              'Add database indexes',
              'Optimize query structure',
              'Use query result caching',
              'Review execution plan'
            ]
          });
        }
      });
    }

    // N+1 queries
    if (databaseProfile.n1Patterns && databaseProfile.n1Patterns.length > 0) {
      databaseProfile.n1Patterns.forEach(pattern => {
        bottlenecks.push({
          type: 'n1_query',
          severity: 'critical',
          title: 'N+1 Query Pattern',
          description: `Query executed ${pattern.executions} times`,
          impact: 'high',
          metrics: pattern,
          suggestions: [
            'Use eager loading/JOIN',
            'Batch queries together',
            'Implement data loader pattern',
            'Use ORM relationship loading'
          ]
        });
      });
    }

    // Connection pool saturation
    if (databaseProfile.connectionPool && databaseProfile.connectionPool.waiting > 0) {
      bottlenecks.push({
        type: 'connection_pool',
        severity: 'warning',
        title: 'Database Connection Pool Saturation',
        description: `${databaseProfile.connectionPool.waiting} connections waiting`,
        impact: 'medium',
        metrics: databaseProfile.connectionPool,
        suggestions: [
          'Increase connection pool size',
          'Optimize long-running queries',
          'Close connections properly',
          'Review transaction handling'
        ]
      });
    }

    return bottlenecks;
  }

  /**
   * Analyze resource utilization
   */
  analyzeResourceUtilization(metrics) {
    const bottlenecks = [];

    // Disk I/O would be analyzed here
    // Network I/O would be analyzed here
    // Event loop lag would be analyzed here

    return bottlenecks;
  }

  /**
   * Analyze dependencies
   */
  analyzeDependencies(profiles) {
    const bottlenecks = [];

    // Would analyze external service dependencies
    // Would analyze third-party API bottlenecks

    return bottlenecks;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(bottlenecks) {
    const recommendations = [];

    // Group bottlenecks by type
    const byType = bottlenecks.reduce((acc, b) => {
      if (!acc[b.type]) acc[b.type] = [];
      acc[b.type].push(b);
      return acc;
    }, {});

    // Generate prioritized recommendations
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical');

    if (criticalBottlenecks.length > 0) {
      recommendations.push({
        priority: 'critical',
        title: 'Critical Performance Issues',
        description: `${criticalBottlenecks.length} critical bottlenecks require immediate attention`,
        actions: criticalBottlenecks.map(b => ({
          issue: b.title,
          impact: b.impact,
          suggestions: b.suggestions
        }))
      });
    }

    // Type-specific recommendations
    if (byType.cpu && byType.cpu.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'CPU Optimization Opportunities',
        description: 'Optimize CPU-intensive operations',
        actions: [
          'Profile and optimize hot paths',
          'Consider caching computation results',
          'Move heavy processing to background jobs',
          'Evaluate algorithmic complexity'
        ]
      });
    }

    if (byType.memory_leak) {
      recommendations.push({
        priority: 'critical',
        title: 'Memory Leak Resolution',
        description: 'Address memory leaks immediately',
        actions: [
          'Take and analyze heap snapshots',
          'Review recent code changes',
          'Check for unclosed resources',
          'Verify event listener cleanup'
        ]
      });
    }

    if (byType.n1_query && byType.n1_query.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Database Query Optimization',
        description: 'Fix N+1 query patterns',
        actions: [
          'Implement eager loading',
          'Use JOIN queries',
          'Batch database operations',
          'Add strategic caching'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get bottleneck priority
   */
  getPriority(bottleneck) {
    if (bottleneck.severity === 'critical') return 1;
    if (bottleneck.impact === 'high') return 2;
    if (bottleneck.severity === 'warning') return 3;
    return 4;
  }

  /**
   * Export analysis
   */
  exportAnalysis(format = 'json') {
    const sorted = [...this.bottlenecks].sort((a, b) =>
      this.getPriority(a) - this.getPriority(b)
    );

    if (format === 'json') {
      return JSON.stringify(sorted, null, 2);
    }

    return sorted;
  }
}

module.exports = {
  BottleneckAnalyzer
};
