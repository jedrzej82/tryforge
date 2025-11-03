/**
 * TryForge Memory Profiler
 * Memory leak detection, heap monitoring, and GC tracking
 */

const v8 = require('v8');
const { performance } = require('perf_hooks');
const logger = require('../../utils/logger');

class MemoryProfiler {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      sampleInterval: 5000, // 5 seconds
      heapSnapshotThreshold: 0.9, // Take snapshot at 90% usage
      trackGC: true,
      detectLeaks: true,
      leakDetectionSamples: 10, // Number of samples for leak detection
      ...options
    };

    this.samples = [];
    this.heapSnapshots = [];
    this.gcEvents = [];
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.startTime = null;
    this.gcObserver = null;
  }

  /**
   * Start memory profiling
   */
  start() {
    if (this.isMonitoring) {
      logger.warn('Memory profiling already started');
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();
    this.samples = [];
    this.gcEvents = [];

    logger.info('Starting memory profiling', {
      sampleInterval: this.options.sampleInterval
    });

    // Enable GC tracking if available
    if (this.options.trackGC && global.gc) {
      this.setupGCTracking();
    }

    // Start periodic monitoring
    this.monitorInterval = setInterval(() => {
      this.takeSample();
    }, this.options.sampleInterval);

    // Initial sample
    this.takeSample();
  }

  /**
   * Stop memory profiling
   */
  stop() {
    if (!this.isMonitoring) {
      logger.warn('Memory profiling not started');
      return null;
    }

    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.gcObserver) {
      this.gcObserver = null;
    }

    const duration = Date.now() - this.startTime;
    const profile = this.generateProfile(duration);

    logger.info('Stopped memory profiling', {
      duration,
      samples: this.samples.length,
      snapshots: this.heapSnapshots.length
    });

    return profile;
  }

  /**
   * Take memory sample
   */
  takeSample() {
    const memoryUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    const sample = {
      timestamp: Date.now(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      heap: {
        totalHeapSize: heapStats.total_heap_size,
        totalHeapSizeExecutable: heapStats.total_heap_size_executable,
        totalPhysicalSize: heapStats.total_physical_size,
        totalAvailableSize: heapStats.total_available_size,
        usedHeapSize: heapStats.used_heap_size,
        heapSizeLimit: heapStats.heap_size_limit,
        mallocedMemory: heapStats.malloced_memory,
        peakMallocedMemory: heapStats.peak_malloced_memory,
        doesZapGarbage: heapStats.does_zap_garbage,
        numberOfNativeContexts: heapStats.number_of_native_contexts,
        numberOfDetachedContexts: heapStats.number_of_detached_contexts
      },
      usage: {
        heapUsagePercent: (heapStats.used_heap_size / heapStats.heap_size_limit) * 100,
        rssUsagePercent: (memoryUsage.rss / this.getTotalSystemMemory()) * 100
      }
    };

    this.samples.push(sample);

    // Check if we should take a heap snapshot
    if (sample.usage.heapUsagePercent >= this.options.heapSnapshotThreshold * 100) {
      this.takeHeapSnapshot();
    }

    // Detect memory leaks
    if (this.options.detectLeaks && this.samples.length >= this.options.leakDetectionSamples) {
      this.detectMemoryLeaks();
    }

    return sample;
  }

  /**
   * Setup GC tracking
   */
  setupGCTracking() {
    const originalGC = global.gc;

    global.gc = () => {
      const startTime = performance.now();
      originalGC();
      const duration = performance.now() - startTime;

      const gcEvent = {
        timestamp: Date.now(),
        duration,
        memoryBefore: process.memoryUsage(),
        memoryAfter: process.memoryUsage()
      };

      this.gcEvents.push(gcEvent);
    };

    logger.info('GC tracking enabled');
  }

  /**
   * Take heap snapshot
   */
  takeHeapSnapshot() {
    try {
      const startTime = Date.now();
      const snapshot = v8.writeHeapSnapshot();
      const duration = Date.now() - startTime;

      const snapshotData = {
        timestamp: Date.now(),
        duration,
        file: snapshot,
        memoryUsage: process.memoryUsage()
      };

      this.heapSnapshots.push(snapshotData);

      logger.info('Heap snapshot taken', {
        file: snapshot,
        duration
      });

      return snapshotData;
    } catch (error) {
      logger.error('Failed to take heap snapshot', error);
      return null;
    }
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks() {
    // Get recent samples
    const recentSamples = this.samples.slice(-this.options.leakDetectionSamples);

    // Calculate memory growth trend
    const heapGrowth = recentSamples.map((sample, index) => {
      if (index === 0) return 0;
      return sample.memory.heapUsed - recentSamples[index - 1].memory.heapUsed;
    });

    const avgGrowth = heapGrowth.reduce((sum, g) => sum + g, 0) / heapGrowth.length;

    // Check for consistent growth (potential leak)
    const positiveGrowth = heapGrowth.filter(g => g > 0).length;
    const leakThreshold = this.options.leakDetectionSamples * 0.8; // 80% positive growth

    if (positiveGrowth >= leakThreshold && avgGrowth > 1024 * 1024) { // > 1MB avg growth
      const leak = {
        timestamp: Date.now(),
        avgGrowth,
        positiveGrowthRatio: positiveGrowth / heapGrowth.length,
        recentSamples
      };

      logger.warn('Potential memory leak detected', {
        avgGrowth: `${Math.round(avgGrowth / 1024 / 1024)}MB`,
        positiveGrowthRatio: leak.positiveGrowthRatio
      });

      return leak;
    }

    return null;
  }

  /**
   * Get total system memory
   */
  getTotalSystemMemory() {
    const os = require('os');
    return os.totalmem();
  }

  /**
   * Generate memory profile
   */
  generateProfile(duration) {
    if (this.samples.length === 0) {
      return null;
    }

    const firstSample = this.samples[0];
    const lastSample = this.samples[this.samples.length - 1];

    // Calculate memory growth
    const heapGrowth = lastSample.memory.heapUsed - firstSample.memory.heapUsed;
    const rssGrowth = lastSample.memory.rss - firstSample.memory.rss;

    // Calculate averages
    const avgHeapUsed = this.samples.reduce((sum, s) => sum + s.memory.heapUsed, 0) / this.samples.length;
    const avgRss = this.samples.reduce((sum, s) => sum + s.memory.rss, 0) / this.samples.length;
    const avgHeapPercent = this.samples.reduce((sum, s) => sum + s.usage.heapUsagePercent, 0) / this.samples.length;

    // Find peak memory usage
    const peakHeapUsed = Math.max(...this.samples.map(s => s.memory.heapUsed));
    const peakRss = Math.max(...this.samples.map(s => s.memory.rss));

    // GC statistics
    const gcStats = this.calculateGCStats();

    // Memory leak detection
    const leakDetection = this.detectMemoryLeaks();

    return {
      duration,
      samples: this.samples.length,
      memory: {
        initial: {
          heapUsed: firstSample.memory.heapUsed,
          rss: firstSample.memory.rss
        },
        final: {
          heapUsed: lastSample.memory.heapUsed,
          rss: lastSample.memory.rss
        },
        growth: {
          heap: heapGrowth,
          rss: rssGrowth,
          heapPercent: ((heapGrowth / firstSample.memory.heapUsed) * 100)
        },
        average: {
          heapUsed: Math.round(avgHeapUsed),
          rss: Math.round(avgRss),
          heapPercent: Math.round(avgHeapPercent * 100) / 100
        },
        peak: {
          heapUsed: peakHeapUsed,
          rss: peakRss
        }
      },
      gc: gcStats,
      heapSnapshots: this.heapSnapshots.map(s => ({
        timestamp: s.timestamp,
        file: s.file,
        duration: s.duration
      })),
      leakDetection: leakDetection ? {
        detected: true,
        avgGrowth: leakDetection.avgGrowth,
        positiveGrowthRatio: leakDetection.positiveGrowthRatio
      } : {
        detected: false
      },
      recommendations: this.generateRecommendations(avgHeapPercent, heapGrowth, leakDetection)
    };
  }

  /**
   * Calculate GC statistics
   */
  calculateGCStats() {
    if (this.gcEvents.length === 0) {
      return {
        enabled: false,
        events: 0
      };
    }

    const totalDuration = this.gcEvents.reduce((sum, e) => sum + e.duration, 0);
    const avgDuration = totalDuration / this.gcEvents.length;
    const maxDuration = Math.max(...this.gcEvents.map(e => e.duration));

    return {
      enabled: true,
      events: this.gcEvents.length,
      totalDuration: Math.round(totalDuration),
      avgDuration: Math.round(avgDuration),
      maxDuration: Math.round(maxDuration)
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(avgHeapPercent, heapGrowth, leakDetection) {
    const recommendations = [];

    if (avgHeapPercent > 80) {
      recommendations.push({
        type: 'high_memory_usage',
        severity: 'warning',
        message: 'Average heap usage is high. Consider increasing heap size or optimizing memory usage.',
        avgHeapPercent
      });
    }

    if (heapGrowth > 100 * 1024 * 1024) { // > 100MB growth
      recommendations.push({
        type: 'significant_memory_growth',
        severity: 'info',
        message: 'Significant memory growth detected. Monitor for potential memory leaks.',
        growth: Math.round(heapGrowth / 1024 / 1024) + 'MB'
      });
    }

    if (leakDetection) {
      recommendations.push({
        type: 'memory_leak',
        severity: 'critical',
        message: 'Potential memory leak detected. Review code for unclosed resources or circular references.',
        avgGrowth: Math.round(leakDetection.avgGrowth / 1024 / 1024) + 'MB'
      });
    }

    if (this.gcEvents.length > 0) {
      const avgGCDuration = this.gcEvents.reduce((sum, e) => sum + e.duration, 0) / this.gcEvents.length;
      if (avgGCDuration > 100) {
        recommendations.push({
          type: 'long_gc_pauses',
          severity: 'warning',
          message: 'Long GC pauses detected. Consider optimizing object creation/deletion patterns.',
          avgGCDuration: Math.round(avgGCDuration)
        });
      }
    }

    return recommendations;
  }

  /**
   * Compare two heap snapshots
   */
  compareSnapshots(snapshot1, snapshot2) {
    // In real implementation, would analyze and compare heap snapshot files
    return {
      compared: true,
      snapshot1: snapshot1.file,
      snapshot2: snapshot2.file,
      timeDiff: snapshot2.timestamp - snapshot1.timestamp
    };
  }

  /**
   * Get current memory snapshot
   */
  getSnapshot() {
    return {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      heapStatistics: v8.getHeapStatistics(),
      heapSpaceStatistics: v8.getHeapSpaceStatistics()
    };
  }

  /**
   * Export profile data
   */
  exportProfile(format = 'json') {
    const profile = this.generateProfile(Date.now() - this.startTime);

    if (format === 'json') {
      return JSON.stringify(profile, null, 2);
    }

    return profile;
  }
}

module.exports = {
  MemoryProfiler
};
