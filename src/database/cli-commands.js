/**
 * Enhanced Database CLI Commands
 * Comprehensive database migration management commands
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const Table = require('cli-table3');
const MigrationManager = require('./migration-manager');
const { errorHandler } = require('../utils/error-handler');
const logger = require('../utils/logger');

class DatabaseCommands {
  /**
   * Run pending migrations
   */
  static async migrate(options = {}) {
    console.log(chalk.cyan.bold('\n🚀 Running Migrations\n'));

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      const result = await manager.migrate(options);

      if (result.applied.length === 0) {
        console.log(chalk.blue('\nDatabase is up to date!\n'));
      } else {
        console.log(chalk.green.bold(`\n✅ Applied ${result.applied.length} migrations\n`));

        // Show applied migrations
        result.applied.forEach((migration, index) => {
          console.log(chalk.gray(`  ${index + 1}. ${migration}`));
        });
        console.log();
      }

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Database Migration',
        recovery: 'Check database connection and migration files',
        exitOnError: true
      });
    }
  }

  /**
   * Create a new migration
   */
  static async createMigration(name, options = {}) {
    if (!name) {
      console.error(chalk.red('\n❌ Migration name is required\n'));
      console.log(chalk.gray('Usage: tryforge db:migrate:create <name>\n'));
      process.exit(1);
    }

    console.log(chalk.cyan.bold(`\n📝 Creating Migration: ${name}\n`));

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      const result = await manager.createMigration(name, options);

      console.log(chalk.green(`\n✅ Migration created successfully!\n`));
      console.log(chalk.gray(`   Path: ${result.path}`));
      console.log(chalk.gray(`   Timestamp: ${result.timestamp}\n`));

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Create Migration',
        suggestion: 'Check migration name and configuration',
        exitOnError: true
      });
    }
  }

  /**
   * Show migration status
   */
  static async status(options = {}) {
    console.log(chalk.cyan.bold('\n📊 Migration Status\n'));

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      const status = await manager.status();

      // Display current version
      console.log(chalk.bold('Current Schema Version:'), chalk.green(status.currentVersion));
      console.log();

      // Display statistics
      console.log(chalk.bold('Statistics:'));
      console.log(chalk.gray(`  Total migrations: ${status.statistics.total}`));
      console.log(chalk.green(`  Applied: ${status.statistics.applied}`));
      console.log(chalk.yellow(`  Pending: ${status.statistics.pending}`));
      console.log(chalk.red(`  Failed: ${status.statistics.failed}`));
      console.log(chalk.gray(`  Batches: ${status.statistics.batches}`));

      if (status.statistics.averageExecutionTime > 0) {
        console.log(chalk.gray(`  Avg execution time: ${status.statistics.averageExecutionTime}ms`));
      }

      console.log();

      // Display applied migrations
      if (status.applied.length > 0) {
        console.log(chalk.bold('Applied Migrations:'));

        const table = new Table({
          head: ['Name', 'Batch', 'Executed At', 'Time (ms)'],
          colWidths: [50, 10, 25, 12]
        });

        status.applied.slice(0, 10).forEach(migration => {
          table.push([
            chalk.green(migration.name),
            migration.batch,
            new Date(migration.executed_at).toLocaleString(),
            migration.execution_time || '-'
          ]);
        });

        console.log(table.toString());

        if (status.applied.length > 10) {
          console.log(chalk.gray(`  ... and ${status.applied.length - 10} more\n`));
        }
      }

      // Display pending migrations
      if (status.pending.length > 0) {
        console.log(chalk.bold('\nPending Migrations:'));

        status.pending.forEach((migration, index) => {
          console.log(chalk.yellow(`  ${index + 1}. ${migration.name}`));
        });

        console.log();
      }

      // Display failed migrations
      if (status.failed.length > 0) {
        console.log(chalk.bold('\n⚠️  Failed Migrations:'));

        status.failed.forEach((migration, index) => {
          console.log(chalk.red(`  ${index + 1}. ${migration.name}`));
          if (migration.error_message) {
            console.log(chalk.gray(`     Error: ${migration.error_message}`));
          }
        });

        console.log();
      }

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Migration Status',
        exitOnError: true
      });
    }
  }

  /**
   * Rollback migrations
   */
  static async rollback(options = {}) {
    console.log(chalk.cyan.bold('\n⏪ Rolling Back Migrations\n'));

    // Confirm rollback
    if (!options.force && !options.dryRun) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to rollback migrations?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('\nRollback cancelled\n'));
        return;
      }
    }

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      const result = await manager.rollback(options);

      if (result.rolledBack.length === 0) {
        console.log(chalk.blue('\nNo migrations to rollback\n'));
      } else {
        console.log(chalk.green.bold(`\n✅ Rolled back ${result.rolledBack.length} migrations\n`));

        result.rolledBack.forEach((migration, index) => {
          console.log(chalk.gray(`  ${index + 1}. ${migration}`));
        });
        console.log();
      }

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Rollback Migrations',
        recovery: 'Check database state and migration files',
        exitOnError: true
      });
    }
  }

  /**
   * Reset database
   */
  static async reset(options = {}) {
    console.log(chalk.cyan.bold('\n🔄 Resetting Database\n'));

    // Confirm reset
    if (!options.force) {
      console.log(chalk.red.bold('⚠️  WARNING: This will delete all data!'));

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset the database?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('\nDatabase reset cancelled\n'));
        return;
      }
    }

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      // Rollback all migrations
      console.log(chalk.gray('Rolling back all migrations...'));
      await manager.rollback({ steps: 999999 });

      // Run migrations
      console.log(chalk.gray('Running migrations...'));
      await manager.migrate();

      console.log(chalk.green.bold('\n✅ Database reset complete\n'));

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Reset Database',
        exitOnError: true
      });
    }
  }

  /**
   * Refresh database (rollback and migrate)
   */
  static async refresh(options = {}) {
    console.log(chalk.cyan.bold('\n🔄 Refreshing Database\n'));

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      // Rollback one step
      console.log(chalk.gray('Rolling back last migration...'));
      await manager.rollback({ steps: 1 });

      // Run migrations
      console.log(chalk.gray('Running migrations...'));
      await manager.migrate();

      console.log(chalk.green.bold('\n✅ Database refreshed\n'));

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Refresh Database',
        exitOnError: true
      });
    }
  }

  /**
   * Validate migrations
   */
  static async validate(options = {}) {
    console.log(chalk.cyan.bold('\n🔍 Validating Migrations\n'));

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      const result = await manager.validate();

      if (result.valid) {
        console.log(chalk.green.bold('✅ All migrations are valid\n'));
      } else {
        console.log(chalk.red.bold('❌ Validation failed\n'));

        result.issues.forEach((issue, index) => {
          console.log(chalk.red(`${index + 1}. [${issue.type}] ${issue.message}`));
          if (issue.migration) {
            console.log(chalk.gray(`   Migration: ${issue.migration}`));
          }
        });
        console.log();
      }

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Validate Migrations',
        exitOnError: true
      });
    }
  }

  /**
   * Show schema version
   */
  static async version(options = {}) {
    console.log(chalk.cyan.bold('\n📌 Schema Version\n'));

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      const status = await manager.status();
      const history = await manager.versioning.getVersionHistory(null, 5);

      console.log(chalk.bold('Current Version:'), chalk.green(status.currentVersion));
      console.log();

      if (history.length > 0) {
        console.log(chalk.bold('Version History:'));

        const table = new Table({
          head: ['Version', 'Environment', 'Created At', 'Description'],
          colWidths: [15, 15, 25, 40]
        });

        history.forEach(version => {
          table.push([
            chalk.green(version.version),
            version.environment,
            new Date(version.created_at).toLocaleString(),
            version.description || '-'
          ]);
        });

        console.log(table.toString());
      }

      console.log();

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Schema Version',
        exitOnError: true
      });
    }
  }

  /**
   * Bump version
   */
  static async bumpVersion(type, options = {}) {
    if (!['major', 'minor', 'patch'].includes(type)) {
      console.error(chalk.red('\n❌ Invalid version type. Use: major, minor, or patch\n'));
      process.exit(1);
    }

    console.log(chalk.cyan.bold(`\n⬆️  Bumping ${type} version\n`));

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      const currentVersion = await manager.versioning.getCurrentVersion();
      const newVersion = await manager.versioning.bumpVersion(type, options.description);

      console.log(chalk.gray(`Old version: ${currentVersion}`));
      console.log(chalk.green(`New version: ${newVersion}`));
      console.log();

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Bump Version',
        exitOnError: true
      });
    }
  }

  /**
   * Generate schema diff
   */
  static async diff(options = {}) {
    console.log(chalk.cyan.bold('\n🔍 Schema Diff\n'));

    try {
      const manager = new MigrationManager(options);
      await manager.initialize();

      // Get current schema
      const currentSchema = await manager.adapter.getSchema();

      // For demo purposes, we'll just show the current schema
      // In a real implementation, you'd compare with a target schema
      console.log(chalk.bold('Current Schema:'));
      console.log(JSON.stringify(currentSchema, null, 2));
      console.log();

      await manager.close();
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Schema Diff',
        exitOnError: true
      });
    }
  }
}

module.exports = DatabaseCommands;
