/**
 * TryForge Resource Timing Monitor
 * Asset load times, network waterfall, CDN performance
 */

const logger = require('../../utils/logger');

class ResourceTimingMonitor {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      trackTypes: ['script', 'stylesheet', 'image', 'font', 'fetch', 'xmlhttprequest'],
      slowResourceThreshold: 1000, // 1 second
      ...options
    };

    this.resources = [];
    this.isMonitoring = false;
  }

  /**
   * Start monitoring
   */
  start() {
    this.isMonitoring = true;
    logger.info('Started Resource Timing monitoring');
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    logger.info('Stopped Resource Timing monitoring');
  }

  /**
   * Record resource timing
   */
  recordResource(resource) {
    if (!this.isMonitoring) return;

    const timing = {
      name: resource.name,
      type: resource.initiatorType,
      size: resource.transferSize || 0,
      duration: resource.duration,
      startTime: resource.startTime,
      dns: resource.domainLookupEnd - resource.domainLookupStart,
      tcp: resource.connectEnd - resource.connectStart,
      ttfb: resource.responseStart - resource.requestStart,
      download: resource.responseEnd - resource.responseStart,
      cached: resource.transferSize === 0,
      timestamp: Date.now(),
      metadata: {
        protocol: resource.nextHopProtocol,
        compression: resource.encodedBodySize > 0 ?
          ((resource.decodedBodySize - resource.encodedBodySize) / resource.decodedBodySize * 100).toFixed(2) : 0
      }
    };

    this.resources.push(timing);

    if (timing.duration > this.options.slowResourceThreshold) {
      logger.warn('Slow resource detected', {
        name: timing.name,
        duration: timing.duration,
        type: timing.type
      });
    }

    return timing;
  }

  /**
   * Get statistics
   */
  getStatistics(timeRange = 3600000) {
    const now = Date.now();
    const cutoff = now - timeRange;

    const recentResources = this.resources.filter(r => r.timestamp >= cutoff);

    // Group by type
    const byType = recentResources.reduce((acc, r) => {
      if (!acc[r.type]) {
        acc[r.type] = {
          count: 0,
          totalSize: 0,
          totalDuration: 0,
          cached: 0,
          durations: []
        };
      }

      acc[r.type].count++;
      acc[r.type].totalSize += r.size;
      acc[r.type].totalDuration += r.duration;
      acc[r.type].durations.push(r.duration);
      if (r.cached) acc[r.type].cached++;

      return acc;
    }, {});

    // Calculate stats per type
    const stats = {};
    for (const [type, data] of Object.entries(byType)) {
      const sorted = [...data.durations].sort((a, b) => a - b);

      stats[type] = {
        count: data.count,
        totalSize: data.totalSize,
        avgSize: Math.round(data.totalSize / data.count),
        avgDuration: Math.round(data.totalDuration / data.count),
        p50Duration: sorted[Math.floor(sorted.length * 0.50)] || 0,
        p95Duration: sorted[Math.floor(sorted.length * 0.95)] || 0,
        cacheHitRate: Math.round((data.cached / data.count) * 100)
      };
    }

    // Slowest resources
    const slowest = [...recentResources]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(r => ({
        name: r.name,
        type: r.type,
        duration: Math.round(r.duration),
        size: r.size
      }));

    return {
      byType: stats,
      slowest,
      totalResources: recentResources.length,
      totalSize: recentResources.reduce((sum, r) => sum + r.size, 0),
      avgLoadTime: recentResources.length > 0 ?
        Math.round(recentResources.reduce((sum, r) => sum + r.duration, 0) / recentResources.length) : 0
    };
  }

  /**
   * Get client-side monitoring script
   */
  getMonitoringScript(apiEndpoint) {
    return `
<script>
(function() {
  const API_ENDPOINT = '${apiEndpoint}';
  const TRACKED_TYPES = ${JSON.stringify(this.options.trackTypes)};

  function sendResourceTiming(entries) {
    const data = entries
      .filter(entry => TRACKED_TYPES.includes(entry.initiatorType))
      .map(entry => ({
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration,
        size: entry.transferSize || 0,
        startTime: entry.startTime,
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        tcp: entry.connectEnd - entry.connectStart,
        ttfb: entry.responseStart - entry.requestStart,
        download: entry.responseEnd - entry.responseStart,
        cached: entry.transferSize === 0,
        protocol: entry.nextHopProtocol,
        encodedSize: entry.encodedBodySize,
        decodedSize: entry.decodedBodySize
      }));

    if (data.length > 0) {
      fetch(API_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(console.error);
    }
  }

  // Monitor resource timing
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      sendResourceTiming(list.getEntries());
    });
    observer.observe({ entryTypes: ['resource'] });
  }

  // Send existing resources on load
  window.addEventListener('load', () => {
    const entries = performance.getEntriesByType('resource');
    sendResourceTiming(entries);
  });

  console.log('Resource Timing monitoring initialized');
})();
</script>
    `.trim();
  }
}

module.exports = {
  ResourceTimingMonitor
};
