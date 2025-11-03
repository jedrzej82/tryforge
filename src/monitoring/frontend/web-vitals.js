/**
 * TryForge Web Vitals Monitor
 * Core Web Vitals (LCP, FID, CLS) and other frontend performance metrics
 */

const logger = require('../../utils/logger');

class WebVitalsMonitor {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      sampleRate: 1.0,
      thresholds: {
        lcp: 2500, // Largest Contentful Paint (ms)
        fid: 100, // First Input Delay (ms)
        cls: 0.1, // Cumulative Layout Shift
        fcp: 1800, // First Contentful Paint (ms)
        ttfb: 600, // Time to First Byte (ms)
        tti: 3800 // Time to Interactive (ms)
      },
      ...options
    };

    this.vitals = [];
    this.isMonitoring = false;
  }

  /**
   * Start monitoring
   */
  start() {
    this.isMonitoring = true;
    logger.info('Started Web Vitals monitoring');
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    logger.info('Stopped Web Vitals monitoring');
  }

  /**
   * Record web vital metric
   */
  recordMetric(name, value, metadata = {}) {
    if (!this.isMonitoring) return;
    if (Math.random() > this.options.sampleRate) return;

    const vital = {
      name,
      value,
      timestamp: Date.now(),
      rating: this.getRating(name, value),
      metadata: {
        url: metadata.url,
        userAgent: metadata.userAgent,
        ...metadata
      }
    };

    this.vitals.push(vital);

    // Check threshold
    if (this.isAboveThreshold(name, value)) {
      logger.warn(`Web Vital threshold exceeded: ${name}`, { value, threshold: this.options.thresholds[name] });
    }

    return vital;
  }

  /**
   * Get rating for metric
   */
  getRating(name, value) {
    const thresholds = {
      lcp: [2500, 4000],
      fid: [100, 300],
      cls: [0.1, 0.25],
      fcp: [1800, 3000],
      ttfb: [600, 1500],
      tti: [3800, 7300]
    };

    const [good, needsImprovement] = thresholds[name] || [0, 0];

    if (value <= good) return 'good';
    if (value <= needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Check if above threshold
   */
  isAboveThreshold(name, value) {
    return this.options.thresholds[name] && value > this.options.thresholds[name];
  }

  /**
   * Get statistics
   */
  getStatistics(timeRange = 3600000) {
    const now = Date.now();
    const cutoff = now - timeRange;

    const recentVitals = this.vitals.filter(v => v.timestamp >= cutoff);

    const byMetric = recentVitals.reduce((acc, v) => {
      if (!acc[v.name]) {
        acc[v.name] = {
          values: [],
          good: 0,
          needsImprovement: 0,
          poor: 0
        };
      }

      acc[v.name].values.push(v.value);
      acc[v.name][v.rating === 'good' ? 'good' : v.rating === 'needs-improvement' ? 'needsImprovement' : 'poor']++;

      return acc;
    }, {});

    // Calculate percentiles
    const stats = {};
    for (const [name, data] of Object.entries(byMetric)) {
      const sorted = [...data.values].sort((a, b) => a - b);
      const total = data.values.length;

      stats[name] = {
        count: total,
        p50: sorted[Math.floor(total * 0.50)] || 0,
        p75: sorted[Math.floor(total * 0.75)] || 0,
        p90: sorted[Math.floor(total * 0.90)] || 0,
        p95: sorted[Math.floor(total * 0.95)] || 0,
        ratings: {
          good: Math.round((data.good / total) * 100),
          needsImprovement: Math.round((data.needsImprovement / total) * 100),
          poor: Math.round((data.poor / total) * 100)
        }
      };
    }

    return stats;
  }

  /**
   * Get client-side monitoring script
   */
  getMonitoringScript(apiEndpoint) {
    return `
<script>
(function() {
  // Web Vitals monitoring script
  const API_ENDPOINT = '${apiEndpoint}';

  function sendMetric(name, value, metadata = {}) {
    const data = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...metadata
    };

    // Send via sendBeacon or fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_ENDPOINT, JSON.stringify(data));
    } else {
      fetch(API_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(console.error);
    }
  }

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      sendMetric('lcp', lastEntry.renderTime || lastEntry.loadTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  // First Input Delay (FID)
  if ('PerformanceObserver' in window) {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        sendMetric('fid', entry.processingStart - entry.startTime);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  }

  // Cumulative Layout Shift (CLS)
  if ('PerformanceObserver' in window) {
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Send CLS on page unload
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendMetric('cls', clsScore);
      }
    });
  }

  // First Contentful Paint (FCP) & Time to First Byte (TTFB)
  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const navigationEntry = performance.getEntriesByType('navigation')[0];

    if (navigationEntry) {
      // TTFB
      sendMetric('ttfb', navigationEntry.responseStart - navigationEntry.requestStart);

      // FCP
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        sendMetric('fcp', fcpEntry.startTime);
      }
    }
  });

  // Time to Interactive (TTI) - simplified
  window.addEventListener('load', () => {
    setTimeout(() => {
      const now = performance.now();
      sendMetric('tti', now);
    }, 0);
  });

  console.log('Web Vitals monitoring initialized');
})();
</script>
    `.trim();
  }
}

module.exports = {
  WebVitalsMonitor
};
