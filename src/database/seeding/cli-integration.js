/**
 * CLI Integration for Seeding System
 *
 * Provides command-line interface functions for the seeding system.
 * These can be integrated into the main CLI (src/cli/commands/db.js).
 */

const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const handlebars = require('handlebars');
const { Client } = require('pg');
const SeedManager = require('./seed-manager');
const seedConfig = require('./seed-config');
const logger = require('../../utils/logger');

class SeedingCLI {
  /**
   * Run all seeders
   * @param {Object} options - CLI options
   */
  static async runAll(options = {}) {
    console.log(chalk.cyan.bold('\n🌱 Running database seeders...\n'));

    try {
      const db = await this.getDbConnection();
      const environment = options.env || process.env.NODE_ENV || 'development';

      // Check if seeding is allowed in this environment
      const envConfig = seedConfig.environments[environment];
      if (!envConfig.runSeeders) {
        console.log(chalk.yellow(`⚠️  Seeding is disabled for ${environment} environment`));
        return;
      }

      const manager = new SeedManager({
        db,
        environment,
        seedersPath: seedConfig.paths.seeders,
        registryPath: seedConfig.paths.registry
      });

      const stats = await manager.runAll({
        force: options.force || false,
        skipIfExists: options.skipIfExists !== false,
        dryRun: options.dryRun || false,
        continueOnError: options.continueOnError || false
      });

      await db.end();

      if (stats.failed > 0) {
        process.exit(1);
      }

    } catch (error) {
      logger.error('Seeding failed', { error: error.message, stack: error.stack });
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Run a specific seeder
   * @param {string} seederName - Name of seeder to run
   * @param {Object} options - CLI options
   */
  static async runSeeder(seederName, options = {}) {
    console.log(chalk.cyan.bold(`\n🌱 Running seeder: ${seederName}\n`));

    try {
      const db = await this.getDbConnection();
      const environment = options.env || process.env.NODE_ENV || 'development';

      const manager = new SeedManager({
        db,
        environment,
        seedersPath: seedConfig.paths.seeders,
        registryPath: seedConfig.paths.registry
      });

      await manager.initialize();

      const result = await manager.run(seederName, {
        dryRun: options.dryRun || false
      });

      await db.end();

      if (!result.success) {
        console.error(chalk.red(`\n❌ Seeder failed: ${result.error}\n`));
        process.exit(1);
      }

    } catch (error) {
      logger.error('Seeder execution failed', { seeder: seederName, error: error.message });
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Rollback seeders
   * @param {string|null} seederName - Name of seeder to rollback (null for all)
   * @param {Object} options - CLI options
   */
  static async rollback(seederName = null, options = {}) {
    const targetName = seederName ? `seeder: ${seederName}` : 'all seeders';
    console.log(chalk.cyan.bold(`\n↩️  Rolling back ${targetName}...\n`));

    try {
      const db = await this.getDbConnection();
      const environment = options.env || process.env.NODE_ENV || 'development';

      const manager = new SeedManager({
        db,
        environment,
        seedersPath: seedConfig.paths.seeders,
        registryPath: seedConfig.paths.registry
      });

      await manager.initialize();
      await manager.rollback(seederName);

      await db.end();

      console.log(chalk.green.bold('\n✅ Rollback complete\n'));

    } catch (error) {
      logger.error('Rollback failed', { seeder: seederName, error: error.message });
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * List all seeders
   * @param {Object} options - CLI options
   */
  static async list(options = {}) {
    try {
      const db = await this.getDbConnection();
      const environment = options.env || process.env.NODE_ENV || 'development';

      const manager = new SeedManager({
        db,
        environment,
        seedersPath: seedConfig.paths.seeders,
        registryPath: seedConfig.paths.registry
      });

      await manager.list();

      await db.end();

    } catch (error) {
      logger.error('Failed to list seeders', { error: error.message });
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Refresh database (rollback and reseed)
   * @param {Object} options - CLI options
   */
  static async refresh(options = {}) {
    console.log(chalk.cyan.bold('\n🔄 Refreshing database...\n'));

    try {
      const db = await this.getDbConnection();
      const environment = options.env || process.env.NODE_ENV || 'development';

      // Confirm in production
      if (environment === 'production' && !options.force) {
        console.log(chalk.red('❌ Cannot refresh production database without --force flag'));
        process.exit(1);
      }

      const manager = new SeedManager({
        db,
        environment,
        seedersPath: seedConfig.paths.seeders,
        registryPath: seedConfig.paths.registry
      });

      await manager.initialize();
      await manager.refresh({
        truncate: options.truncate !== false,
        clearRegistry: options.clearRegistry !== false
      });

      await db.end();

    } catch (error) {
      logger.error('Refresh failed', { error: error.message });
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Create a new seeder file
   * @param {string} seederName - Name of the seeder
   * @param {Object} options - CLI options
   */
  static async create(seederName, options = {}) {
    console.log(chalk.cyan.bold(`\n📝 Creating seeder: ${seederName}\n`));

    try {
      // Ensure seederName ends with 'Seeder'
      const className = seederName.endsWith('Seeder') ? seederName : `${seederName}Seeder`;

      // Determine table name from seeder name
      let tableName = options.table || seederName.replace(/Seeder$/, '').toLowerCase();
      if (!tableName.endsWith('s')) {
        tableName += 's'; // Pluralize
      }

      // Read template
      const templatePath = path.join(seedConfig.paths.templates, 'seeder-template.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);

      // Generate seeder content
      const content = template({
        className,
        tableName,
        description: options.description || `Seeds the ${tableName} table`
      });

      // Write seeder file
      const seederPath = path.join(
        seedConfig.paths.seeders,
        `${className.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}.js`
      );

      if (await fs.pathExists(seederPath) && !options.force) {
        console.log(chalk.yellow(`⚠️  Seeder already exists: ${seederPath}`));
        console.log(chalk.gray('Use --force to overwrite'));
        return;
      }

      await fs.writeFile(seederPath, content);

      console.log(chalk.green('✅ Seeder created successfully!'));
      console.log(chalk.gray(`   ${seederPath}\n`));

      logger.info('Seeder created', { name: className, path: seederPath });

    } catch (error) {
      logger.error('Failed to create seeder', { name: seederName, error: error.message });
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Show seeding statistics
   * @param {Object} options - CLI options
   */
  static async stats(options = {}) {
    console.log(chalk.cyan.bold('\n📊 Seeding Statistics\n'));

    try {
      const db = await this.getDbConnection();
      const environment = options.env || process.env.NODE_ENV || 'development';

      const manager = new SeedManager({
        db,
        environment,
        seedersPath: seedConfig.paths.seeders,
        registryPath: seedConfig.paths.registry
      });

      await manager.initialize();
      const stats = await manager.getStats();

      console.log(`Total seeders run:     ${stats.total}`);
      console.log(chalk.green(`Completed:             ${stats.completed}`));
      console.log(chalk.red(`Failed:                ${stats.failed}`));
      console.log(chalk.yellow(`Rolled back:           ${stats.rolledBack}`));
      console.log(`\nTotal records created: ${stats.totalRecords.toLocaleString()}`);
      console.log(`Total execution time:  ${(stats.totalExecutionTime / 1000).toFixed(2)}s\n`);

      await db.end();

    } catch (error) {
      logger.error('Failed to get stats', { error: error.message });
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Get database connection
   * @private
   */
  static async getDbConnection() {
    const dbUrl = process.env.DATABASE_URL || seedConfig.database.url;
    const url = new URL(dbUrl);

    const client = new Client({
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1)
    });

    await client.connect();

    return client;
  }
}

module.exports = SeedingCLI;
