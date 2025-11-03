/**
 * TryForge CLI - Main Progress Manager
 *
 * Unified interface for all progress indicators and animations
 */

const {
  createSpinner,
  createProgressSpinner,
  createMultiSpinner,
  operationSpinners
} = require('./spinners');

const {
  createProgressBar,
  createFileProgressBar,
  createMultiBar,
  createGradientProgressBar,
  withProgressBar,
  trackFileProgress,
  presets
} = require('./progress-bar');

const {
  createTaskList,
  createTaskGroup,
  runTaskList,
  TaskStatus
} = require('./task-list');

const {
  createAnimation,
  createSuccessAnimation,
  createErrorAnimation,
  createCelebration,
  createLoadingAnimation,
  asciiArt
} = require('./animations');

const { colors, icons, createHeader } = require('./themes');
const { formatDuration, formatFileSize, formatSummary } = require('./formatters');

/**
 * Main progress manager class
 * Provides a unified interface for all progress indicators
 */
class ProgressManager {
  constructor() {
    this.activeIndicators = new Map();
    this.history = [];
  }

  /**
   * Create and start a spinner
   */
  spinner(text, options = {}) {
    const spinner = createSpinner(text, options);
    this.activeIndicators.set(`spinner-${Date.now()}`, spinner);
    return spinner;
  }

  /**
   * Create and start a progress spinner
   */
  progressSpinner(text, totalSteps = 0, options = {}) {
    const spinner = createProgressSpinner(text, totalSteps, options);
    this.activeIndicators.set(`progress-spinner-${Date.now()}`, spinner);
    return spinner;
  }

  /**
   * Create a multi-spinner manager
   */
  multiSpinner() {
    const manager = createMultiSpinner();
    this.activeIndicators.set(`multi-spinner-${Date.now()}`, manager);
    return manager;
  }

  /**
   * Create operation-specific spinners
   */
  operation(type, ...args) {
    if (operationSpinners[type]) {
      const spinner = operationSpinners[type](...args);
      this.activeIndicators.set(`operation-${type}-${Date.now()}`, spinner);
      return spinner;
    }
    throw new Error(`Unknown operation type: ${type}`);
  }

  /**
   * Create a progress bar
   */
  progressBar(title, options = {}) {
    const bar = createProgressBar(title, options);
    this.activeIndicators.set(`progress-bar-${Date.now()}`, bar);
    return bar;
  }

  /**
   * Create a file progress bar
   */
  fileProgressBar(filename, options = {}) {
    const bar = createFileProgressBar(filename, options);
    this.activeIndicators.set(`file-progress-${Date.now()}`, bar);
    return bar;
  }

  /**
   * Create a multi-bar manager
   */
  multiBar(options = {}) {
    const manager = createMultiBar(options);
    this.activeIndicators.set(`multi-bar-${Date.now()}`, manager);
    return manager;
  }

  /**
   * Create a gradient progress bar
   */
  gradientBar(title, options = {}) {
    const bar = createGradientProgressBar(title, options);
    this.activeIndicators.set(`gradient-bar-${Date.now()}`, bar);
    return bar;
  }

  /**
   * Create a task list
   */
  taskList(title, tasks = [], options = {}) {
    const list = createTaskList(title, tasks, options);
    this.activeIndicators.set(`task-list-${Date.now()}`, list);
    return list;
  }

  /**
   * Create a task group
   */
  taskGroup(title, options = {}) {
    const group = createTaskGroup(title, options);
    this.activeIndicators.set(`task-group-${Date.now()}`, group);
    return group;
  }

  /**
   * Run a task list with async functions
   */
  async runTasks(title, taskFunctions, options = {}) {
    return await runTaskList(title, taskFunctions, options);
  }

  /**
   * Execute function with progress bar
   */
  async withProgressBar(title, total, asyncFn, options = {}) {
    return await withProgressBar(title, total, asyncFn, options);
  }

  /**
   * Track file operation progress
   */
  async trackFile(filename, totalBytes, asyncFn, options = {}) {
    return await trackFileProgress(filename, totalBytes, asyncFn, options);
  }

  /**
   * Show success message
   */
  success(message, options = {}) {
    const { showIcon = true, duration = null } = options;
    const icon = showIcon ? `${colors.success(icons.success)} ` : '';
    const durationStr = duration ? ` ${colors.muted(`(${formatDuration(duration)})`)}` : '';

    console.log(`${icon}${colors.success(message)}${durationStr}`);

    this.history.push({
      type: 'success',
      message,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Show error message
   */
  error(message, options = {}) {
    const { showIcon = true, error = null } = options;
    const icon = showIcon ? `${colors.error(icons.error)} ` : '';

    console.log(`${icon}${colors.error(message)}`);

    if (error) {
      console.log(colors.error(`  ${error.message || error}`));
      if (error.stack) {
        console.log(colors.muted(error.stack));
      }
    }

    this.history.push({
      type: 'error',
      message,
      error,
      timestamp: Date.now()
    });
  }

  /**
   * Show warning message
   */
  warning(message, options = {}) {
    const { showIcon = true } = options;
    const icon = showIcon ? `${colors.warning(icons.warning)} ` : '';

    console.log(`${icon}${colors.warning(message)}`);

    this.history.push({
      type: 'warning',
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Show info message
   */
  info(message, options = {}) {
    const { showIcon = true } = options;
    const icon = showIcon ? `${colors.info(icons.info)} ` : '';

    console.log(`${icon}${colors.info(message)}`);

    this.history.push({
      type: 'info',
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Show celebration
   */
  celebrate(message = 'Success!', options = {}) {
    const { showArt = false } = options;

    if (showArt) {
      console.log(asciiArt.celebration);
    }

    console.log(colors.success.bold(`\n${icons.celebration} ${message}\n`));

    this.history.push({
      type: 'celebration',
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Show header
   */
  header(title, width = 60) {
    console.log('\n' + createHeader(title, width) + '\n');
  }

  /**
   * Show summary
   */
  summary(data, options = {}) {
    const { title = 'Summary', showHeader = true } = options;

    if (showHeader) {
      console.log('\n' + colors.bold(title));
      console.log(colors.muted('─'.repeat(title.length)));
    }

    console.log(formatSummary(data, options));
  }

  /**
   * Stop all active indicators
   */
  stopAll() {
    this.activeIndicators.forEach((indicator, key) => {
      try {
        if (typeof indicator.stop === 'function') {
          indicator.stop();
        } else if (typeof indicator.stopAll === 'function') {
          indicator.stopAll();
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
    });

    this.activeIndicators.clear();
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Get history
   */
  getHistory(type = null) {
    if (type) {
      return this.history.filter(item => item.type === type);
    }
    return this.history;
  }

  /**
   * Get active indicator count
   */
  getActiveCount() {
    return this.activeIndicators.size;
  }
}

/**
 * Create a global progress manager instance
 */
const globalProgress = new ProgressManager();

/**
 * Quick access functions that use global instance
 */

/**
 * Create a spinner
 */
function spinner(text, options) {
  return globalProgress.spinner(text, options);
}

/**
 * Create a progress bar
 */
function progressBar(title, options) {
  return globalProgress.progressBar(title, options);
}

/**
 * Create a task list
 */
function taskList(title, tasks, options) {
  return globalProgress.taskList(title, tasks, options);
}

/**
 * Show success message
 */
function success(message, options) {
  globalProgress.success(message, options);
}

/**
 * Show error message
 */
function error(message, options) {
  globalProgress.error(message, options);
}

/**
 * Show warning message
 */
function warning(message, options) {
  globalProgress.warning(message, options);
}

/**
 * Show info message
 */
function info(message, options) {
  globalProgress.info(message, options);
}

/**
 * Show celebration
 */
function celebrate(message, options) {
  globalProgress.celebrate(message, options);
}

/**
 * Common progress patterns
 */
const patterns = {
  /**
   * Multi-step process pattern
   */
  async multiStep(title, steps, options = {}) {
    const tasks = globalProgress.taskList(title, steps.map(s => s.title), options);
    tasks.start();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      tasks.startTask(i);

      try {
        await step.fn();
        tasks.completeTask(i);
      } catch (error) {
        tasks.failTask(i, error.message);
        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    tasks.complete();
    return tasks;
  },

  /**
   * Parallel operations pattern
   */
  async parallel(title, operations, options = {}) {
    const multi = globalProgress.multiSpinner();

    const promises = operations.map(async (op) => {
      const spinner = multi.add(op.id, op.title, options);

      try {
        const result = await op.fn();
        multi.succeed(op.id, op.successMessage || op.title);
        return { id: op.id, success: true, result };
      } catch (error) {
        multi.fail(op.id, op.errorMessage || `${op.title} failed`);
        return { id: op.id, success: false, error };
      }
    });

    const results = await Promise.all(promises);
    multi.stopAll();

    return results;
  },

  /**
   * File batch processing pattern
   */
  async fileBatch(title, files, processFn, options = {}) {
    const multibar = globalProgress.multiBar(options);

    const promises = files.map(async (file) => {
      const bar = multibar.add(file.id, file.name, 100);

      try {
        const result = await processFn(file, (progress) => {
          multibar.update(file.id, progress);
        });

        multibar.complete(file.id);
        return { id: file.id, success: true, result };
      } catch (error) {
        multibar.remove(file.id);
        return { id: file.id, success: false, error };
      }
    });

    const results = await Promise.all(promises);
    multibar.stop();

    return results;
  },

  /**
   * Long-running operation with ETA
   */
  async longRunning(title, totalSteps, processFn, options = {}) {
    const spinner = globalProgress.progressSpinner(title, totalSteps, options);

    for (let i = 0; i < totalSteps; i++) {
      spinner.updateStep(i + 1, await processFn(i));
    }

    spinner.succeed(`${title} completed`);
    return spinner;
  }
};

module.exports = {
  // Main class
  ProgressManager,

  // Global instance
  globalProgress,

  // Quick access functions
  spinner,
  progressBar,
  taskList,
  success,
  error,
  warning,
  info,
  celebrate,

  // Factory functions from submodules
  createSpinner,
  createProgressBar,
  createFileProgressBar,
  createTaskList,
  createMultiBar,
  createMultiSpinner,
  createProgressSpinner,
  createTaskGroup,

  // Operation spinners
  operationSpinners,

  // Patterns
  patterns,

  // Utilities
  withProgressBar,
  trackFileProgress,
  runTaskList,

  // Constants
  TaskStatus,
  presets,

  // Themes and formatting
  colors,
  icons,
  formatDuration,
  formatFileSize,
  asciiArt
};
