/**
 * Base Seeder Class
 *
 * Abstract base class for all database seeders.
 * Provides common functionality including logging, dependencies, and environment checks.
 */

const logger = require('../../utils/logger');
const chalk = require('chalk');

class BaseSeeder {
  constructor() {
    this.name = 'BaseSeeder';
    this.dependencies = [];
    this.environments = ['development', 'staging'];
    this.priority = 0; // Lower numbers run first
    this.idempotent = true; // Can be run multiple times safely
  }

  /**
   * Run the seeder
   * @param {Object} db - Database connection/client
   * @returns {Promise<void>}
   */
  async run(db) {
    throw new Error(`Seeder ${this.name} must implement run() method`);
  }

  /**
   * Rollback the seeder (optional)
   * @param {Object} db - Database connection/client
   * @returns {Promise<void>}
   */
  async rollback(db) {
    this.log('No rollback implementation provided', 'warn');
  }

  /**
   * Check if seeder should run in current environment
   * @param {string} environment - Current environment (development, staging, production)
   * @returns {boolean}
   */
  shouldRun(environment) {
    return this.environments.includes(environment);
  }

  /**
   * Validate seeder configuration
   * @returns {boolean}
   */
  validate() {
    if (!this.name || this.name === 'BaseSeeder') {
      throw new Error('Seeder must have a unique name');
    }

    if (!Array.isArray(this.dependencies)) {
      throw new Error('Seeder dependencies must be an array');
    }

    if (!Array.isArray(this.environments)) {
      throw new Error('Seeder environments must be an array');
    }

    return true;
  }

  /**
   * Log a message with seeder context
   * @param {string} message - Message to log
   * @param {string} level - Log level (info, warn, error, success)
   */
  log(message, level = 'info') {
    const prefix = chalk.cyan(`[${this.name}]`);

    switch (level) {
      case 'success':
        console.log(`${prefix} ${chalk.green(message)}`);
        logger.info(`[${this.name}] ${message}`);
        break;
      case 'warn':
        console.log(`${prefix} ${chalk.yellow(message)}`);
        logger.warn(`[${this.name}] ${message}`);
        break;
      case 'error':
        console.log(`${prefix} ${chalk.red(message)}`);
        logger.error(`[${this.name}] ${message}`);
        break;
      case 'debug':
        if (process.env.DEBUG) {
          console.log(`${prefix} ${chalk.gray(message)}`);
        }
        logger.debug(`[${this.name}] ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
        logger.info(`[${this.name}] ${message}`);
    }
  }

  /**
   * Log progress with count
   * @param {number} current - Current count
   * @param {number} total - Total count
   * @param {string} entityName - Name of entity being seeded
   */
  logProgress(current, total, entityName = 'items') {
    const percentage = Math.round((current / total) * 100);
    const message = `Progress: ${current}/${total} ${entityName} (${percentage}%)`;
    this.log(message, 'debug');
  }

  /**
   * Create timestamp for records
   * @returns {Date}
   */
  timestamp() {
    return new Date();
  }

  /**
   * Get random element from array
   * @param {Array} array - Array to select from
   * @returns {*}
   */
  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get random elements from array
   * @param {Array} array - Array to select from
   * @param {number} min - Minimum number of elements
   * @param {number} max - Maximum number of elements
   * @returns {Array}
   */
  randomElements(array, min = 1, max = null) {
    const count = max
      ? Math.floor(Math.random() * (max - min + 1)) + min
      : min;

    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Generate random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number}
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Chunk array into smaller arrays
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array<Array>}
   */
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Execute function with retry logic
   * @param {Function} fn - Function to execute
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Delay between retries in ms
   * @returns {Promise<*>}
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        this.log(`Attempt ${i + 1} failed: ${error.message}`, 'warn');

        if (i < maxRetries - 1) {
          await this.sleep(delay * (i + 1)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Get seeder metadata
   * @returns {Object}
   */
  getMetadata() {
    return {
      name: this.name,
      dependencies: this.dependencies,
      environments: this.environments,
      priority: this.priority,
      idempotent: this.idempotent
    };
  }
}

module.exports = BaseSeeder;
