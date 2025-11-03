/**
 * TryForge CLI - Progress Bar Utilities
 *
 * Provides progress bar functionality for determinate operations
 */

const cliProgress = require('cli-progress');
const { colors, progressChars } = require('./themes');
const { formatFileSize, formatPercentage, formatSpeed, formatETA } = require('./formatters');

/**
 * Progress bar manager class
 */
class ProgressBarManager {
  constructor(title, options = {}) {
    this.title = title;
    this.bar = null;
    this.startTime = null;
    this.lastUpdate = null;
    this.currentValue = 0;
    this.totalValue = 0;
    this.isActive = false;

    this.options = {
      format: options.format || this._getDefaultFormat(),
      barsize: options.barsize || 30,
      hideCursor: true,
      barCompleteChar: progressChars.complete,
      barIncompleteChar: progressChars.incomplete,
      fps: 10,
      stream: process.stdout,
      barGlue: '',
      ...options
    };
  }

  /**
   * Get default format string
   */
  _getDefaultFormat() {
    return `{title} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`;
  }

  /**
   * Start the progress bar
   */
  start(total, current = 0, payload = {}) {
    this.totalValue = total;
    this.currentValue = current;
    this.startTime = Date.now();
    this.lastUpdate = Date.now();

    this.bar = new cliProgress.SingleBar(this.options, cliProgress.Presets.shades_classic);

    this.bar.start(total, current, {
      title: this.title,
      ...payload
    });

    this.isActive = true;
    return this;
  }

  /**
   * Update progress
   */
  update(value, payload = {}) {
    if (!this.bar || !this.isActive) return this;

    this.currentValue = value;
    this.lastUpdate = Date.now();

    this.bar.update(value, {
      title: this.title,
      ...payload
    });

    return this;
  }

  /**
   * Increment progress
   */
  increment(delta = 1, payload = {}) {
    this.update(this.currentValue + delta, payload);
    return this;
  }

  /**
   * Set total value
   */
  setTotal(total) {
    if (this.bar && this.isActive) {
      this.totalValue = total;
      this.bar.setTotal(total);
    }
    return this;
  }

  /**
   * Update title
   */
  updateTitle(title) {
    this.title = title;
    if (this.bar && this.isActive) {
      this.bar.update(this.currentValue, { title });
    }
    return this;
  }

  /**
   * Stop the progress bar
   */
  stop() {
    if (this.bar && this.isActive) {
      this.bar.stop();
      this.isActive = false;
    }
    return this;
  }

  /**
   * Get elapsed time
   */
  getElapsedTime() {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Get progress percentage
   */
  getPercentage() {
    if (this.totalValue === 0) return 0;
    return (this.currentValue / this.totalValue) * 100;
  }

  /**
   * Check if complete
   */
  isComplete() {
    return this.currentValue >= this.totalValue;
  }
}

/**
 * File progress bar with file size formatting
 */
class FileProgressBar extends ProgressBarManager {
  constructor(filename, options = {}) {
    const format = options.format ||
      `{title} [{bar}] {percentage}% | {size} | {speed} | ETA: {eta}s`;

    super(filename, {
      ...options,
      format
    });

    this.bytesProcessed = 0;
    this.totalBytes = 0;
  }

  /**
   * Start with file size
   */
  start(totalBytes, currentBytes = 0) {
    this.totalBytes = totalBytes;
    this.bytesProcessed = currentBytes;

    return super.start(100, this._getPercentage(), {
      size: this._getFormattedSize(),
      speed: '0 B/s',
      eta: '...'
    });
  }

  /**
   * Update with bytes processed
   */
  updateBytes(bytesProcessed) {
    this.bytesProcessed = bytesProcessed;

    const percentage = this._getPercentage();
    const speed = this._calculateSpeed();
    const eta = this._calculateETA(speed);

    return this.update(percentage, {
      size: this._getFormattedSize(),
      speed: formatSpeed(speed),
      eta: eta
    });
  }

  /**
   * Get percentage
   */
  _getPercentage() {
    if (this.totalBytes === 0) return 0;
    return Math.floor((this.bytesProcessed / this.totalBytes) * 100);
  }

  /**
   * Get formatted size
   */
  _getFormattedSize() {
    return `${formatFileSize(this.bytesProcessed)}/${formatFileSize(this.totalBytes)}`;
  }

  /**
   * Calculate download/upload speed
   */
  _calculateSpeed() {
    if (!this.startTime) return 0;

    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    if (elapsedSeconds === 0) return 0;

    return this.bytesProcessed / elapsedSeconds;
  }

  /**
   * Calculate ETA
   */
  _calculateETA(speed) {
    if (speed === 0) return '...';

    const remainingBytes = this.totalBytes - this.bytesProcessed;
    const etaSeconds = Math.ceil(remainingBytes / speed);

    return formatETA(etaSeconds * 1000);
  }
}

/**
 * Multi-bar progress manager for multiple concurrent operations
 */
class MultiBarManager {
  constructor(options = {}) {
    this.multibar = null;
    this.bars = new Map();
    this.options = {
      clearOnComplete: false,
      hideCursor: true,
      format: '{title} [{bar}] {percentage}% | {value}/{total}',
      ...options
    };
  }

  /**
   * Initialize the multi-bar
   */
  init() {
    if (!this.multibar) {
      this.multibar = new cliProgress.MultiBar(
        this.options,
        cliProgress.Presets.shades_classic
      );
    }
    return this;
  }

  /**
   * Add a progress bar
   */
  add(id, title, total, options = {}) {
    this.init();

    const bar = this.multibar.create(total, 0, {
      title,
      ...options
    });

    this.bars.set(id, {
      bar,
      title,
      total,
      current: 0,
      startTime: Date.now()
    });

    return bar;
  }

  /**
   * Update a progress bar
   */
  update(id, value, payload = {}) {
    const barData = this.bars.get(id);
    if (barData) {
      barData.current = value;
      barData.bar.update(value, {
        title: barData.title,
        ...payload
      });
    }
    return this;
  }

  /**
   * Increment a progress bar
   */
  increment(id, delta = 1, payload = {}) {
    const barData = this.bars.get(id);
    if (barData) {
      barData.current += delta;
      this.update(id, barData.current, payload);
    }
    return this;
  }

  /**
   * Remove a progress bar
   */
  remove(id) {
    const barData = this.bars.get(id);
    if (barData && this.multibar) {
      this.multibar.remove(barData.bar);
      this.bars.delete(id);
    }
    return this;
  }

  /**
   * Complete a progress bar and remove it
   */
  complete(id) {
    const barData = this.bars.get(id);
    if (barData) {
      this.update(id, barData.total);
      setTimeout(() => this.remove(id), 100);
    }
    return this;
  }

  /**
   * Stop all progress bars
   */
  stop() {
    if (this.multibar) {
      this.multibar.stop();
      this.bars.clear();
      this.multibar = null;
    }
    return this;
  }

  /**
   * Get bar data
   */
  getBar(id) {
    return this.bars.get(id);
  }

  /**
   * Get all bars
   */
  getAllBars() {
    return Array.from(this.bars.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  /**
   * Get count of active bars
   */
  getCount() {
    return this.bars.size;
  }
}

/**
 * Create a simple progress bar
 */
function createProgressBar(title, options = {}) {
  return new ProgressBarManager(title, options);
}

/**
 * Create a file progress bar
 */
function createFileProgressBar(filename, options = {}) {
  return new FileProgressBar(filename, options);
}

/**
 * Create a multi-bar manager
 */
function createMultiBar(options = {}) {
  return new MultiBarManager(options);
}

/**
 * Preset configurations for common use cases
 */
const presets = {
  /**
   * Simple progress bar
   */
  simple: {
    format: '[{bar}] {percentage}%'
  },

  /**
   * Detailed progress bar
   */
  detailed: {
    format: '{title} [{bar}] {percentage}% | {value}/{total} | ETA: {eta}s'
  },

  /**
   * File download/upload
   */
  file: {
    format: '{title} [{bar}] {percentage}% | {size} | {speed} | ETA: {eta}s'
  },

  /**
   * Package installation
   */
  package: {
    format: '📦 {title} [{bar}] {percentage}% | {value}/{total} packages'
  },

  /**
   * Test execution
   */
  test: {
    format: '🧪 {title} [{bar}] {percentage}% | {value}/{total} tests'
  },

  /**
   * Build process
   */
  build: {
    format: '🔨 {title} [{bar}] {percentage}% | {value}/{total} steps'
  }
};

/**
 * Create a progress bar with preset
 */
function createProgressBarWithPreset(title, preset = 'simple', options = {}) {
  const presetConfig = presets[preset] || presets.simple;
  return new ProgressBarManager(title, {
    ...presetConfig,
    ...options
  });
}

/**
 * Simple progress bar wrapper for quick usage
 */
async function withProgressBar(title, total, asyncFn, options = {}) {
  const bar = createProgressBar(title, options);
  bar.start(total, 0);

  try {
    const result = await asyncFn((value, payload) => {
      bar.update(value, payload);
    });

    bar.stop();
    return result;
  } catch (error) {
    bar.stop();
    throw error;
  }
}

/**
 * Track file operation progress
 */
async function trackFileProgress(filename, totalBytes, asyncFn, options = {}) {
  const bar = createFileProgressBar(filename, options);
  bar.start(totalBytes, 0);

  try {
    const result = await asyncFn((bytesProcessed) => {
      bar.updateBytes(bytesProcessed);
    });

    bar.stop();
    return result;
  } catch (error) {
    bar.stop();
    throw error;
  }
}

/**
 * Create a custom progress bar with gradient colors
 */
class GradientProgressBar extends ProgressBarManager {
  constructor(title, options = {}) {
    super(title, options);
    this.colorThresholds = options.colorThresholds || {
      0: colors.error,
      30: colors.warning,
      70: colors.primary,
      90: colors.success
    };
  }

  /**
   * Get color based on percentage
   */
  _getColorForPercentage(percentage) {
    const thresholds = Object.keys(this.colorThresholds)
      .map(Number)
      .sort((a, b) => b - a);

    for (const threshold of thresholds) {
      if (percentage >= threshold) {
        return this.colorThresholds[threshold];
      }
    }

    return colors.muted;
  }

  /**
   * Update with colored bar
   */
  update(value, payload = {}) {
    const percentage = (value / this.totalValue) * 100;
    const color = this._getColorForPercentage(percentage);

    // Update bar color dynamically
    this.options.barCompleteChar = color(progressChars.complete);

    return super.update(value, payload);
  }
}

/**
 * Create a gradient progress bar
 */
function createGradientProgressBar(title, options = {}) {
  return new GradientProgressBar(title, options);
}

module.exports = {
  ProgressBarManager,
  FileProgressBar,
  MultiBarManager,
  GradientProgressBar,
  createProgressBar,
  createFileProgressBar,
  createMultiBar,
  createGradientProgressBar,
  createProgressBarWithPreset,
  withProgressBar,
  trackFileProgress,
  presets
};
