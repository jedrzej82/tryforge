/**
 * TryForge CLI - Spinner Utilities
 *
 * Provides spinner functionality for indeterminate operations
 */

const ora = require('ora');
const { colors, icons, spinnerFrames } = require('./themes');
const { formatDuration } = require('./formatters');

/**
 * Spinner manager class
 */
class SpinnerManager {
  constructor(options = {}) {
    this.spinner = null;
    this.startTime = null;
    this.isPaused = false;
    this.pausedText = null;
    this.children = [];
    this.options = {
      color: 'cyan',
      spinner: 'dots',
      ...options
    };
  }

  /**
   * Start the spinner
   */
  start(text = 'Loading...') {
    if (this.spinner && this.spinner.isSpinning) {
      this.spinner.text = text;
      return this;
    }

    this.startTime = Date.now();
    this.spinner = ora({
      text,
      color: this.options.color,
      spinner: this.options.spinner
    }).start();

    return this;
  }

  /**
   * Update spinner text
   */
  update(text) {
    if (this.spinner && this.spinner.isSpinning) {
      this.spinner.text = text;
    }
    return this;
  }

  /**
   * Stop spinner with success
   */
  succeed(text) {
    if (this.spinner) {
      const duration = this.getDuration();
      const message = text || this.spinner.text;
      this.spinner.succeed(`${message} ${colors.muted(`(${formatDuration(duration)})`)}`);
      this.cleanup();
    }
    return this;
  }

  /**
   * Stop spinner with failure
   */
  fail(text) {
    if (this.spinner) {
      const duration = this.getDuration();
      const message = text || this.spinner.text;
      this.spinner.fail(`${message} ${colors.muted(`(${formatDuration(duration)})`)}`);
      this.cleanup();
    }
    return this;
  }

  /**
   * Stop spinner with warning
   */
  warn(text) {
    if (this.spinner) {
      const duration = this.getDuration();
      const message = text || this.spinner.text;
      this.spinner.warn(`${message} ${colors.muted(`(${formatDuration(duration)})`)}`);
      this.cleanup();
    }
    return this;
  }

  /**
   * Stop spinner with info
   */
  info(text) {
    if (this.spinner) {
      const duration = this.getDuration();
      const message = text || this.spinner.text;
      this.spinner.info(`${message} ${colors.muted(`(${formatDuration(duration)})`)}`);
      this.cleanup();
    }
    return this;
  }

  /**
   * Stop spinner without message
   */
  stop() {
    if (this.spinner) {
      this.spinner.stop();
      this.cleanup();
    }
    return this;
  }

  /**
   * Pause the spinner
   */
  pause() {
    if (this.spinner && this.spinner.isSpinning && !this.isPaused) {
      this.pausedText = this.spinner.text;
      this.spinner.stop();
      this.isPaused = true;
    }
    return this;
  }

  /**
   * Resume the spinner
   */
  resume() {
    if (this.isPaused) {
      this.spinner.start();
      if (this.pausedText) {
        this.spinner.text = this.pausedText;
      }
      this.isPaused = false;
    }
    return this;
  }

  /**
   * Clear the spinner
   */
  clear() {
    if (this.spinner) {
      this.spinner.clear();
    }
    return this;
  }

  /**
   * Get elapsed time
   */
  getDuration() {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Check if spinner is running
   */
  isRunning() {
    return this.spinner && this.spinner.isSpinning;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.startTime = null;
    this.isPaused = false;
    this.pausedText = null;
  }

  /**
   * Add a child spinner (for nested operations)
   */
  addChild(text, options = {}) {
    const child = new SpinnerManager({
      ...this.options,
      ...options,
      indent: (this.options.indent || 0) + 2
    });

    this.children.push(child);

    // Pause parent while child is running
    if (this.isRunning()) {
      this.pause();
    }

    child.start(text);

    return child;
  }

  /**
   * Remove a child spinner
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    }

    // Resume parent if no children running
    if (this.children.length === 0 && this.isPaused) {
      this.resume();
    }

    return this;
  }
}

/**
 * Create a basic spinner
 */
function createSpinner(text, options = {}) {
  const manager = new SpinnerManager(options);
  manager.start(text);
  return manager;
}

/**
 * Create operation-specific spinners
 */
const operationSpinners = {
  /**
   * Code generation spinner
   */
  generating(filename = '') {
    const text = filename
      ? `${icons.gear} Generating ${colors.bold(filename)}...`
      : `${icons.gear} Generating code...`;

    return createSpinner(text, { color: 'cyan' });
  },

  /**
   * Installation spinner
   */
  installing(packageName = '') {
    const text = packageName
      ? `${icons.package} Installing ${colors.bold(packageName)}...`
      : `${icons.package} Installing dependencies...`;

    return createSpinner(text, { color: 'yellow' });
  },

  /**
   * Building spinner
   */
  building(target = '') {
    const text = target
      ? `${icons.wrench} Building ${colors.bold(target)}...`
      : `${icons.wrench} Building project...`;

    return createSpinner(text, { color: 'blue' });
  },

  /**
   * Searching spinner
   */
  searching(query = '') {
    const text = query
      ? `${icons.magnifyingGlass} Searching for ${colors.bold(query)}...`
      : `${icons.magnifyingGlass} Searching...`;

    return createSpinner(text, { color: 'magenta' });
  },

  /**
   * Loading spinner
   */
  loading(resource = '') {
    const text = resource
      ? `${icons.hourglass} Loading ${colors.bold(resource)}...`
      : `${icons.hourglass} Loading...`;

    return createSpinner(text, { color: 'cyan' });
  },

  /**
   * Analyzing spinner
   */
  analyzing(subject = '') {
    const text = subject
      ? `${icons.chart} Analyzing ${colors.bold(subject)}...`
      : `${icons.chart} Analyzing...`;

    return createSpinner(text, { color: 'blue' });
  },

  /**
   * Processing spinner
   */
  processing(item = '') {
    const text = item
      ? `${icons.gear} Processing ${colors.bold(item)}...`
      : `${icons.gear} Processing...`;

    return createSpinner(text, { color: 'cyan' });
  },

  /**
   * AI processing spinner
   */
  ai(operation = 'thinking') {
    const operations = {
      thinking: '🤔 AI is thinking...',
      generating: '🤖 AI is generating...',
      analyzing: '🧠 AI is analyzing...',
      processing: '⚡ AI is processing...'
    };

    const text = operations[operation] || operations.thinking;
    return createSpinner(text, { color: 'magenta' });
  },

  /**
   * API request spinner
   */
  apiRequest(endpoint = '') {
    const text = endpoint
      ? `${icons.lightning} Calling API: ${colors.bold(endpoint)}...`
      : `${icons.lightning} Making API request...`;

    return createSpinner(text, { color: 'yellow' });
  },

  /**
   * File operation spinner
   */
  fileOperation(operation = 'processing', filename = '') {
    const operations = {
      reading: 'Reading',
      writing: 'Writing',
      copying: 'Copying',
      moving: 'Moving',
      deleting: 'Deleting',
      processing: 'Processing'
    };

    const verb = operations[operation] || 'Processing';
    const text = filename
      ? `${icons.file} ${verb} ${colors.bold(filename)}...`
      : `${icons.file} ${verb} files...`;

    return createSpinner(text, { color: 'green' });
  },

  /**
   * Database operation spinner
   */
  database(operation = 'querying') {
    const operations = {
      connecting: '🔌 Connecting to database...',
      querying: '💾 Querying database...',
      migrating: '🔄 Running migrations...',
      seeding: '🌱 Seeding database...',
      backing_up: '💾 Backing up database...',
      restoring: '♻️ Restoring database...'
    };

    const text = operations[operation] || operations.querying;
    return createSpinner(text, { color: 'blue' });
  },

  /**
   * Network operation spinner
   */
  network(operation = 'connecting') {
    const operations = {
      connecting: '🌐 Connecting...',
      downloading: '⬇️ Downloading...',
      uploading: '⬆️ Uploading...',
      syncing: '🔄 Syncing...'
    };

    const text = operations[operation] || operations.connecting;
    return createSpinner(text, { color: 'cyan' });
  },

  /**
   * Testing spinner
   */
  testing(suite = '') {
    const text = suite
      ? `🧪 Running tests: ${colors.bold(suite)}...`
      : `🧪 Running tests...`;

    return createSpinner(text, { color: 'yellow' });
  },

  /**
   * Deploying spinner
   */
  deploying(target = '') {
    const text = target
      ? `${icons.rocket} Deploying to ${colors.bold(target)}...`
      : `${icons.rocket} Deploying...`;

    return createSpinner(text, { color: 'magenta' });
  }
};

/**
 * Create a spinner with progress updates
 */
class ProgressSpinner extends SpinnerManager {
  constructor(text, options = {}) {
    super(options);
    this.baseText = text;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.updates = [];
  }

  /**
   * Set total steps
   */
  setTotalSteps(total) {
    this.totalSteps = total;
    return this;
  }

  /**
   * Update with step information
   */
  updateStep(step, status = '') {
    this.currentStep = step;

    let text = this.baseText;
    if (this.totalSteps > 0) {
      text += ` ${colors.muted(`[${step}/${this.totalSteps}]`)}`;
    }
    if (status) {
      text += ` ${colors.dim(status)}`;
    }

    this.update(text);
    return this;
  }

  /**
   * Add an update message
   */
  addUpdate(message) {
    this.updates.push({
      message,
      timestamp: Date.now()
    });

    // Keep only last 5 updates
    if (this.updates.length > 5) {
      this.updates.shift();
    }

    return this;
  }

  /**
   * Get recent updates
   */
  getUpdates() {
    return this.updates;
  }
}

/**
 * Create a progress spinner
 */
function createProgressSpinner(text, totalSteps = 0, options = {}) {
  const spinner = new ProgressSpinner(text, options);
  spinner.setTotalSteps(totalSteps);
  spinner.start(text);
  return spinner;
}

/**
 * Create multiple spinners for parallel operations
 */
class MultiSpinner {
  constructor() {
    this.spinners = new Map();
  }

  /**
   * Add a spinner
   */
  add(id, text, options = {}) {
    const spinner = new SpinnerManager(options);
    spinner.start(text);
    this.spinners.set(id, spinner);
    return spinner;
  }

  /**
   * Get a spinner by id
   */
  get(id) {
    return this.spinners.get(id);
  }

  /**
   * Update a spinner
   */
  update(id, text) {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.update(text);
    }
    return this;
  }

  /**
   * Complete a spinner with success
   */
  succeed(id, text) {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.succeed(text);
      this.spinners.delete(id);
    }
    return this;
  }

  /**
   * Complete a spinner with failure
   */
  fail(id, text) {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.fail(text);
      this.spinners.delete(id);
    }
    return this;
  }

  /**
   * Stop all spinners
   */
  stopAll() {
    this.spinners.forEach(spinner => spinner.stop());
    this.spinners.clear();
    return this;
  }

  /**
   * Get count of running spinners
   */
  getCount() {
    return this.spinners.size;
  }
}

/**
 * Create a multi-spinner manager
 */
function createMultiSpinner() {
  return new MultiSpinner();
}

module.exports = {
  SpinnerManager,
  ProgressSpinner,
  MultiSpinner,
  createSpinner,
  createProgressSpinner,
  createMultiSpinner,
  operationSpinners
};
