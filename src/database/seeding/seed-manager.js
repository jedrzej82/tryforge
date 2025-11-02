/**
 * Seed Manager
 *
 * Orchestrates database seeding operations including dependency resolution,
 * execution order, progress tracking, and rollback capabilities.
 */

const logger = require('../../utils/logger');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const SeederRegistry = require('./seeder-registry');

class SeedManager {
  constructor(config = {}) {
    this.config = config;
    this.db = config.db || null;
    this.environment = config.environment || process.env.NODE_ENV || 'development';
    this.seedersPath = config.seedersPath || path.join(process.cwd(), 'src', 'database', 'seeding', 'seeders');
    this.registry = new SeederRegistry({
      storageType: config.registryType || 'file',
      db: this.db,
      storagePath: config.registryPath
    });
    this.seeders = new Map();
    this.executionOrder = [];
  }

  /**
   * Initialize the seed manager
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.registry.initialize();
    await this.loadSeeders();
    this.resolveDependencies();

    logger.info('Seed manager initialized', {
      environment: this.environment,
      seedersCount: this.seeders.size
    });
  }

  /**
   * Load all seeder files
   * @returns {Promise<void>}
   */
  async loadSeeders() {
    if (!(await fs.pathExists(this.seedersPath))) {
      logger.warn(`Seeders directory not found: ${this.seedersPath}`);
      return;
    }

    const files = await fs.readdir(this.seedersPath);
    const seederFiles = files.filter(f => f.endsWith('.js') || f.endsWith('-seeder.js'));

    for (const file of seederFiles) {
      try {
        const filePath = path.join(this.seedersPath, file);
        const SeederClass = require(filePath);
        const seeder = new SeederClass();

        // Validate seeder
        seeder.validate();

        this.seeders.set(seeder.name, {
          instance: seeder,
          file: file,
          loaded: true
        });

        logger.debug(`Loaded seeder: ${seeder.name}`);
      } catch (error) {
        logger.error(`Failed to load seeder: ${file}`, {
          error: error.message,
          stack: error.stack
        });
      }
    }

    console.log(chalk.cyan(`\nLoaded ${this.seeders.size} seeders\n`));
  }

  /**
   * Resolve seeder dependencies and determine execution order
   * @returns {void}
   */
  resolveDependencies() {
    const resolved = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (seederName) => {
      if (resolved.has(seederName)) {
        return;
      }

      if (visiting.has(seederName)) {
        throw new Error(`Circular dependency detected: ${seederName}`);
      }

      const seederData = this.seeders.get(seederName);
      if (!seederData) {
        throw new Error(`Seeder not found: ${seederName}`);
      }

      visiting.add(seederName);

      // Visit dependencies first
      for (const dependency of seederData.instance.dependencies) {
        visit(dependency);
      }

      visiting.delete(seederName);
      resolved.add(seederName);
      order.push(seederName);
    };

    // Visit all seeders
    for (const seederName of this.seeders.keys()) {
      if (!resolved.has(seederName)) {
        visit(seederName);
      }
    }

    // Sort by priority (lower numbers first)
    this.executionOrder = order.sort((a, b) => {
      const seederA = this.seeders.get(a).instance;
      const seederB = this.seeders.get(b).instance;
      return seederA.priority - seederB.priority;
    });

    logger.debug('Execution order resolved', {
      order: this.executionOrder
    });
  }

  /**
   * Run all seeders
   * @param {Object} options - Execution options
   * @returns {Promise<Object>}
   */
  async runAll(options = {}) {
    console.log(chalk.cyan.bold('\n📦 Running all seeders...\n'));

    const {
      force = false,
      skipIfExists = false,
      dryRun = false
    } = options;

    await this.initialize();

    const stats = {
      total: 0,
      completed: 0,
      skipped: 0,
      failed: 0,
      startTime: Date.now(),
      endTime: null,
      seeders: []
    };

    for (const seederName of this.executionOrder) {
      const seederData = this.seeders.get(seederName);
      const seeder = seederData.instance;

      stats.total++;

      // Check environment
      if (!seeder.shouldRun(this.environment)) {
        console.log(chalk.yellow(`⊘ Skipping ${seederName} (not for ${this.environment})`));
        stats.skipped++;
        continue;
      }

      // Check if already run
      if (!force && await this.registry.hasRun(seederName)) {
        if (skipIfExists) {
          console.log(chalk.yellow(`⊘ Skipping ${seederName} (already run)`));
          stats.skipped++;
          continue;
        }
      }

      // Run seeder
      const result = await this.run(seederName, { dryRun });

      if (result.success) {
        stats.completed++;
      } else {
        stats.failed++;

        if (!options.continueOnError) {
          break;
        }
      }

      stats.seeders.push(result);
    }

    stats.endTime = Date.now();
    stats.duration = stats.endTime - stats.startTime;

    this.printSummary(stats);

    return stats;
  }

  /**
   * Run a specific seeder
   * @param {string} seederName - Name of seeder to run
   * @param {Object} options - Execution options
   * @returns {Promise<Object>}
   */
  async run(seederName, options = {}) {
    const { dryRun = false } = options;

    const seederData = this.seeders.get(seederName);
    if (!seederData) {
      throw new Error(`Seeder not found: ${seederName}`);
    }

    const seeder = seederData.instance;
    const spinner = ora(`Running ${seederName}...`).start();

    const result = {
      seeder: seederName,
      success: false,
      recordsCreated: 0,
      executionTime: 0,
      error: null
    };

    const startTime = Date.now();

    try {
      // Check dependencies
      for (const dependency of seeder.dependencies) {
        if (!(await this.registry.hasRun(dependency))) {
          throw new Error(`Dependency not met: ${dependency}`);
        }
      }

      // Register as running
      if (!dryRun) {
        await this.registry.register(seederName, 'running');
      }

      // Run seeder
      seeder.log('Starting...');

      if (!dryRun) {
        await seeder.run(this.db);
      } else {
        seeder.log('DRY RUN - No changes made', 'warn');
      }

      result.executionTime = Date.now() - startTime;
      result.success = true;

      // Register as completed
      if (!dryRun) {
        await this.registry.register(seederName, 'completed', {
          executionTimeMs: result.executionTime,
          recordsCreated: result.recordsCreated
        });
      }

      spinner.succeed(chalk.green(`✅ ${seederName} completed (${result.executionTime}ms)`));
      seeder.log(`Completed in ${result.executionTime}ms`, 'success');

    } catch (error) {
      result.executionTime = Date.now() - startTime;
      result.error = error.message;

      // Register as failed
      if (!dryRun) {
        await this.registry.register(seederName, 'failed', {
          executionTimeMs: result.executionTime,
          errorMessage: error.message
        });
      }

      spinner.fail(chalk.red(`❌ ${seederName} failed`));
      seeder.log(`Failed: ${error.message}`, 'error');
      logger.error(`Seeder failed: ${seederName}`, {
        error: error.message,
        stack: error.stack
      });
    }

    return result;
  }

  /**
   * Rollback seeders
   * @param {string|null} seederName - Name of seeder to rollback (null for all)
   * @param {Object} options - Rollback options
   * @returns {Promise<void>}
   */
  async rollback(seederName = null, options = {}) {
    if (seederName) {
      await this.rollbackOne(seederName);
    } else {
      await this.rollbackAll(options);
    }
  }

  /**
   * Rollback a single seeder
   * @private
   */
  async rollbackOne(seederName) {
    console.log(chalk.cyan.bold(`\n↩️  Rolling back ${seederName}...\n`));

    const seederData = this.seeders.get(seederName);
    if (!seederData) {
      throw new Error(`Seeder not found: ${seederName}`);
    }

    const seeder = seederData.instance;
    const spinner = ora(`Rolling back ${seederName}...`).start();

    try {
      await seeder.rollback(this.db);
      await this.registry.markRolledBack(seederName);

      spinner.succeed(chalk.green(`✅ ${seederName} rolled back`));
      seeder.log('Rolled back successfully', 'success');

    } catch (error) {
      spinner.fail(chalk.red(`❌ Rollback failed: ${seederName}`));
      seeder.log(`Rollback failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Rollback all seeders
   * @private
   */
  async rollbackAll(options = {}) {
    console.log(chalk.cyan.bold('\n↩️  Rolling back all seeders...\n'));

    await this.initialize();

    // Rollback in reverse order
    const reverseOrder = [...this.executionOrder].reverse();

    for (const seederName of reverseOrder) {
      const hasRun = await this.registry.hasRun(seederName);

      if (hasRun) {
        await this.rollbackOne(seederName);
      }
    }

    console.log(chalk.green.bold('\n✅ All seeders rolled back\n'));
  }

  /**
   * List all seeders
   * @returns {Promise<Array>}
   */
  async list() {
    await this.initialize();

    console.log(chalk.cyan.bold('\n📋 Available Seeders:\n'));

    const seeders = [];

    for (const seederName of this.executionOrder) {
      const seederData = this.seeders.get(seederName);
      const seeder = seederData.instance;
      const status = await this.registry.getStatus(seederName);

      const info = {
        name: seederName,
        dependencies: seeder.dependencies,
        environments: seeder.environments,
        priority: seeder.priority,
        status: status ? status.status : 'not run',
        lastRun: status ? status.executedAt : null
      };

      seeders.push(info);

      // Print to console
      const statusColor = status?.status === 'completed' ? chalk.green :
                          status?.status === 'failed' ? chalk.red :
                          chalk.gray;

      console.log(`${statusColor('●')} ${chalk.bold(seederName)}`);
      console.log(`  Dependencies: ${seeder.dependencies.join(', ') || 'none'}`);
      console.log(`  Environments: ${seeder.environments.join(', ')}`);
      console.log(`  Status: ${statusColor(info.status)}`);
      if (info.lastRun) {
        console.log(`  Last run: ${new Date(info.lastRun).toLocaleString()}`);
      }
      console.log();
    }

    return seeders;
  }

  /**
   * Reset database and reseed
   * @param {Object} options - Reset options
   * @returns {Promise<void>}
   */
  async refresh(options = {}) {
    console.log(chalk.cyan.bold('\n🔄 Refreshing database...\n'));

    const {
      truncate = true,
      clearRegistry = true
    } = options;

    // Rollback all seeders
    await this.rollbackAll();

    // Clear registry if requested
    if (clearRegistry) {
      await this.registry.clear();
      console.log(chalk.green('✅ Registry cleared\n'));
    }

    // Run all seeders
    await this.runAll(options);

    console.log(chalk.green.bold('\n✅ Database refresh complete\n'));
  }

  /**
   * Print execution summary
   * @private
   */
  printSummary(stats) {
    console.log(chalk.cyan.bold('\n📊 Seeding Summary:\n'));

    console.log(`Total seeders:     ${stats.total}`);
    console.log(chalk.green(`Completed:         ${stats.completed}`));
    console.log(chalk.yellow(`Skipped:           ${stats.skipped}`));

    if (stats.failed > 0) {
      console.log(chalk.red(`Failed:            ${stats.failed}`));
    }

    console.log(`Duration:          ${stats.duration}ms`);
    console.log();

    // Print failed seeders if any
    if (stats.failed > 0) {
      console.log(chalk.red.bold('❌ Failed Seeders:\n'));
      stats.seeders
        .filter(s => !s.success)
        .forEach(s => {
          console.log(chalk.red(`  ✗ ${s.seeder}: ${s.error}`));
        });
      console.log();
    }
  }

  /**
   * Get seeding statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    return await this.registry.getStats();
  }
}

module.exports = SeedManager;
