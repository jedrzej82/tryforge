/**
 * TryForge CPU Profiler
 * CPU usage profiling, function execution tracking, and hot path detection
 */

const os = require('os');
const { performance, PerformanceObserver } = require('perf_hooks');
const logger = require('../../utils/logger');

class CPUProfiler {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      sampleInterval: 100, // 100ms
      trackFunctions: true,
      detectHotPaths: true,
      ...options
    };

    this.samples = [];
    this.functionTimes = new Map();
    this.hotPaths = [];
    this.isProfiling = false;
    this.sampleInterval = null;
    this.performanceObserver = null;
    this.startTime = null;
    this.previousCPUUsage = null;
  }

  /**
   * Start CPU profiling
   */
  start() {
    if (this.isProfiling) {
      logger.warn('CPU profiling already started');
      return;
    }

    this.isProfiling = true;
    this.startTime = Date.now();
    this.samples = [];
    this.functionTimes.clear();
    this.previousCPUUsage = process.cpuUsage();

    logger.info('Starting CPU profiling', {
      sampleInterval: this.options.sampleInterval
    });

    // Start sampling
    this.sampleInterval = setInterval(() => {
      this.takeSample();
    }, this.options.sampleInterval);

    // Setup performance observer for function tracking
    if (this.options.trackFunctions) {
      this.setupPerformanceObserver();
    }
  }

  /**
   * Stop CPU profiling
   */
  stop() {
    if (!this.isProfiling) {
      logger.warn('CPU profiling not started');
      return null;
    }

    this.isProfiling = false;

    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    const duration = Date.now() - this.startTime;
    const profile = this.generateProfile(duration);

    logger.info('Stopped CPU profiling', {
      duration,
      samples: this.samples.length,
      functions: this.functionTimes.size
    });

    return profile;
  }

  /**
   * Take CPU sample
   */
  takeSample() {
    const cpuUsage = process.cpuUsage(this.previousCPUUsage);
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    const sample = {
      timestamp: Date.now(),
      userCPU: cpuUsage.user,
      systemCPU: cpuUsage.system,
      totalCPU: cpuUsage.user + cpuUsage.system,
      cpuCount: cpus.length,
      loadAvg: loadAvg,
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length
    };

    this.samples.push(sample);
    this.previousCPUUsage = process.cpuUsage();

    return sample;
  }

  /**
   * Setup performance observer for function tracking
   */
  setupPerformanceObserver() {
    this.performanceObserver = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        this.trackFunctionExecution(entry.name, entry.duration);
      });
    });

    this.performanceObserver.observe({ entryTypes: ['function', 'measure'] });
  }

  /**
   * Track function execution time
   */
  trackFunctionExecution(name, duration) {
    if (!this.functionTimes.has(name)) {
      this.functionTimes.set(name, {
        name,
        calls: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        times: []
      });
    }

    const stats = this.functionTimes.get(name);
    stats.calls++;
    stats.totalTime += duration;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.times.push(duration);

    // Keep only last 1000 times to avoid memory issues
    if (stats.times.length > 1000) {
      stats.times.shift();
    }
  }

  /**
   * Measure function performance
   */
  async measureFunction(name, fn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    performance.mark(startMark);

    try {
      const result = await fn();
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);
      return result;
    } catch (error) {
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);
      throw error;
    } finally {
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    }
  }

  /**
   * Detect hot paths (frequently called functions)
   */
  detectHotPaths() {
    const functions = Array.from(this.functionTimes.values());

    // Sort by total time spent
    const hotPaths = functions
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10)
      .map(fn => ({
        name: fn.name,
        calls: fn.calls,
        totalTime: Math.round(fn.totalTime),
        avgTime: Math.round(fn.totalTime / fn.calls),
        minTime: Math.round(fn.minTime),
        maxTime: Math.round(fn.maxTime),
        percentile95: this.calculatePercentile(fn.times, 0.95)
      }));

    this.hotPaths = hotPaths;
    return hotPaths;
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(times, percentile) {
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * percentile);
    return Math.round(sorted[index] || 0);
  }

  /**
   * Generate CPU profile
   */
  generateProfile(duration) {
    const totalUserCPU = this.samples.reduce((sum, s) => sum + s.userCPU, 0);
    const totalSystemCPU = this.samples.reduce((sum, s) => sum + s.systemCPU, 0);
    const totalCPU = totalUserCPU + totalSystemCPU;

    const avgLoadAvg = this.samples.reduce((sum, s) => {
      return [
        sum[0] + s.loadAvg[0],
        sum[1] + s.loadAvg[1],
        sum[2] + s.loadAvg[2]
      ];
    }, [0, 0, 0]).map(v => v / this.samples.length);

    // CPU usage percentage
    const cpuUsagePercent = (totalCPU / (duration * 1000)) * 100;

    // Detect hot paths
    const hotPaths = this.detectHotPaths();

    // CPU-intensive periods
    const threshold = this.calculateAverageCPU() * 1.5;
    const intensivePeriods = this.samples
      .filter(s => s.totalCPU > threshold)
      .map(s => ({
        timestamp: s.timestamp,
        cpuUsage: s.totalCPU
      }));

    return {
      duration,
      samples: this.samples.length,
      cpu: {
        totalUser: totalUserCPU,
        totalSystem: totalSystemCPU,
        total: totalCPU,
        usagePercent: Math.round(cpuUsagePercent * 100) / 100,
        avgLoadAvg: avgLoadAvg.map(v => Math.round(v * 100) / 100)
      },
      functions: {
        tracked: this.functionTimes.size,
        hotPaths
      },
      intensivePeriods: {
        count: intensivePeriods.length,
        periods: intensivePeriods.slice(0, 10) // Top 10
      },
      recommendations: this.generateRecommendations(cpuUsagePercent, hotPaths)
    };
  }

  /**
   * Calculate average CPU usage
   */
  calculateAverageCPU() {
    if (this.samples.length === 0) return 0;
    const total = this.samples.reduce((sum, s) => sum + s.totalCPU, 0);
    return total / this.samples.length;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(cpuUsage, hotPaths) {
    const recommendations = [];

    if (cpuUsage > 70) {
      recommendations.push({
        type: 'high_cpu_usage',
        severity: 'warning',
        message: 'High CPU usage detected. Consider optimizing hot paths or scaling horizontally.',
        cpuUsage
      });
    }

    if (hotPaths.length > 0) {
      const slowestFunction = hotPaths[0];
      if (slowestFunction.avgTime > 100) {
        recommendations.push({
          type: 'slow_function',
          severity: 'info',
          message: `Function "${slowestFunction.name}" has high average execution time.`,
          function: slowestFunction.name,
          avgTime: slowestFunction.avgTime
        });
      }

      // Check for functions called too frequently
      const frequentCalls = hotPaths.filter(f => f.calls > 10000);
      if (frequentCalls.length > 0) {
        recommendations.push({
          type: 'frequent_calls',
          severity: 'info',
          message: 'Some functions are called very frequently. Consider caching or batching.',
          functions: frequentCalls.map(f => f.name)
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate flame graph data
   */
  generateFlameGraphData() {
    const functions = Array.from(this.functionTimes.values());

    return functions.map(fn => ({
      name: fn.name,
      value: fn.totalTime,
      children: [] // In real implementation, would include call stack
    }));
  }

  /**
   * Export profile data
   */
  exportProfile(format = 'json') {
    const profile = this.generateProfile(Date.now() - this.startTime);

    if (format === 'json') {
      return JSON.stringify(profile, null, 2);
    }

    if (format === 'flamegraph') {
      return this.generateFlameGraphData();
    }

    return profile;
  }

  /**
   * Get current CPU snapshot
   */
  getSnapshot() {
    const cpuUsage = process.cpuUsage();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
      timestamp: Date.now(),
      cpuUsage,
      cpus: cpus.length,
      loadAvg,
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length
    };
  }
}

// Decorator for automatic function profiling
function profileFunction(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args) {
    const profiler = new CPUProfiler();
    return profiler.measureFunction(propertyKey, () => originalMethod.apply(this, args));
  };

  return descriptor;
}

module.exports = {
  CPUProfiler,
  profileFunction
};
