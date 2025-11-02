/**
 * DB Commands - Database operations (reset, migrate, seed, backup)
 */

const chalk = require('chalk');
const ora = require('ora');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs-extra');

// Backup system imports
const BackupManager = require('../../database/backup/backup-manager');
const BackupScheduler = require('../../database/backup/backup-scheduler');
const { loadConfig } = require('../../database/backup/config/backup-config');

class DbCommand {
  static async reset() {
    console.log(chalk.cyan.bold('\n🗄️  Resetting database...\n'));

    const spinner = ora('Dropping database...').start();

    try {
      const dbConfig = this.getDbConfig();

      // Drop database
      spinner.text = 'Dropping database...';
      await this.dropDatabase(dbConfig);
      spinner.succeed(chalk.green('✅ Database dropped'));

      // Create database
      console.log();
      spinner.start('Creating database...');
      await this.createDatabase(dbConfig);
      spinner.succeed(chalk.green('✅ Database created'));

      // Run migrations
      console.log();
      spinner.start('Running migrations...');
      await this.migrate();
      spinner.succeed(chalk.green('✅ Migrations complete'));

      // Seed data
      console.log();
      spinner.start('Seeding data...');
      await this.seed();
      spinner.succeed(chalk.green('✅ Data seeded'));

      console.log(chalk.green.bold('\n✅ Database reset complete\n'));

    } catch (error) {
      spinner.fail(chalk.red('Database reset failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static async migrate() {
    const spinner = ora('Running migrations...').start();

    try {
      const dbConfig = this.getDbConfig();
      const client = new Client(dbConfig);

      await client.connect();

      // Find and run migration files
      const migrationsDir = path.join(process.cwd(), 'backend', 'sql', 'migrations');

      if (await fs.pathExists(migrationsDir)) {
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

        for (const file of sqlFiles) {
          spinner.text = `Running migration: ${file}...`;
          const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
          await client.query(sql);
        }
      }

      // Run main schema if exists
      const schemaPath = path.join(process.cwd(), 'backend', 'sql', 'schema.sql');
      if (await fs.pathExists(schemaPath)) {
        const schema = await fs.readFile(schemaPath, 'utf8');
        await client.query(schema);
      }

      await client.end();

      spinner.succeed(chalk.green('✅ Migrations complete'));

    } catch (error) {
      spinner.fail(chalk.red('Migrations failed'));
      throw error;
    }
  }

  static async seed(seederName = null, options = {}) {
    // Check if new seeding system is available
    const seedingCLIPath = path.join(__dirname, '../../database/seeding/cli-integration.js');

    if (await fs.pathExists(seedingCLIPath)) {
      // Use new seeding system
      const SeedingCLI = require('../../database/seeding/cli-integration');

      if (seederName) {
        await SeedingCLI.runSeeder(seederName, options);
      } else {
        await SeedingCLI.runAll(options);
      }
    } else {
      // Fall back to legacy SQL seeding
      await this.legacySeed();
    }
  }

  static async legacySeed() {
    const spinner = ora('Seeding database...').start();

    try {
      const dbConfig = this.getDbConfig();
      const client = new Client(dbConfig);

      await client.connect();

      // Find and run seed files
      const seedsDir = path.join(process.cwd(), 'backend', 'sql', 'seeds');

      if (await fs.pathExists(seedsDir)) {
        const files = await fs.readdir(seedsDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

        for (const file of sqlFiles) {
          spinner.text = `Running seed: ${file}...`;
          const sql = await fs.readFile(path.join(seedsDir, file), 'utf8');
          await client.query(sql);
        }
      }

      await client.end();

      spinner.succeed(chalk.green('✅ Data seeded'));

    } catch (error) {
      spinner.fail(chalk.red('Seeding failed'));
      throw error;
    }
  }

  static async seedRollback(seederName = null, options = {}) {
    const seedingCLIPath = path.join(__dirname, '../../database/seeding/cli-integration.js');

    if (await fs.pathExists(seedingCLIPath)) {
      const SeedingCLI = require('../../database/seeding/cli-integration');
      await SeedingCLI.rollback(seederName, options);
    } else {
      console.log(chalk.yellow('⚠️  Seeding system not available'));
    }
  }

  static async seedList(options = {}) {
    const seedingCLIPath = path.join(__dirname, '../../database/seeding/cli-integration.js');

    if (await fs.pathExists(seedingCLIPath)) {
      const SeedingCLI = require('../../database/seeding/cli-integration');
      await SeedingCLI.list(options);
    } else {
      console.log(chalk.yellow('⚠️  Seeding system not available'));
    }
  }

  static async seedRefresh(options = {}) {
    const seedingCLIPath = path.join(__dirname, '../../database/seeding/cli-integration.js');

    if (await fs.pathExists(seedingCLIPath)) {
      const SeedingCLI = require('../../database/seeding/cli-integration');
      await SeedingCLI.refresh(options);
    } else {
      console.log(chalk.yellow('⚠️  Seeding system not available'));
    }
  }

  static async seedCreate(seederName, options = {}) {
    const seedingCLIPath = path.join(__dirname, '../../database/seeding/cli-integration.js');

    if (await fs.pathExists(seedingCLIPath)) {
      const SeedingCLI = require('../../database/seeding/cli-integration');
      await SeedingCLI.create(seederName, options);
    } else {
      console.log(chalk.yellow('⚠️  Seeding system not available'));
    }
  }

  static async seedStats(options = {}) {
    const seedingCLIPath = path.join(__dirname, '../../database/seeding/cli-integration.js');

    if (await fs.pathExists(seedingCLIPath)) {
      const SeedingCLI = require('../../database/seeding/cli-integration');
      await SeedingCLI.stats(options);
    } else {
      console.log(chalk.yellow('⚠️  Seeding system not available'));
    }
  }

  static async backup(options = {}) {
    console.log(chalk.cyan.bold('\n💾 Backing up database...\n'));

    const spinner = ora('Initializing backup system...').start();

    try {
      // Load configuration
      const config = loadConfig();

      // Initialize backup manager
      const backupManager = new BackupManager(config);

      spinner.text = 'Creating backup...';

      // Create backup
      const result = await backupManager.createBackup({
        incremental: options.incremental || false,
        verify: options.verify !== false,
        uploadRemote: options.uploadRemote !== false
      });

      spinner.succeed(chalk.green('✅ Backup created successfully'));

      console.log(chalk.cyan('\nBackup Details:'));
      console.log(chalk.white(`  ID: ${result.backupId}`));
      console.log(chalk.white(`  File: ${result.filename}`));
      console.log(chalk.white(`  Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`));
      console.log(chalk.white(`  Duration: ${(result.duration / 1000).toFixed(2)}s`));
      console.log(chalk.white(`  Location: ${result.localPath}`));

      if (result.remoteLocation) {
        console.log(chalk.white(`  Remote: ${result.remoteLocation}`));
      }

      console.log();

    } catch (error) {
      spinner.fail(chalk.red('Backup failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      if (options.verbose) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  }

  static async backupList(options = {}) {
    console.log(chalk.cyan.bold('\n📋 Listing backups...\n'));

    try {
      const config = loadConfig();
      const backupManager = new BackupManager(config);

      const backups = await backupManager.listBackups({
        database: options.database,
        type: options.type,
        status: options.status || 'completed',
        limit: options.limit || 20
      });

      if (backups.length === 0) {
        console.log(chalk.yellow('No backups found'));
        return;
      }

      console.log(chalk.cyan(`Found ${backups.length} backup(s):\n`));

      // Display backups in table format
      backups.forEach((backup, index) => {
        console.log(chalk.white(`${index + 1}. ${backup.filename}`));
        console.log(chalk.gray(`   ID: ${backup.id}`));
        console.log(chalk.gray(`   Type: ${backup.type}`));
        console.log(chalk.gray(`   Status: ${backup.status}`));
        console.log(chalk.gray(`   Size: ${(backup.compressedSize / 1024 / 1024).toFixed(2)} MB`));
        console.log(chalk.gray(`   Created: ${new Date(backup.startedAt).toLocaleString()}`));
        if (backup.restorationCount > 0) {
          console.log(chalk.gray(`   Restorations: ${backup.restorationCount}`));
        }
        console.log();
      });

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static async backupRestore(backupId, options = {}) {
    console.log(chalk.cyan.bold(`\n🔄 Restoring backup: ${backupId}...\n`));

    const spinner = ora('Initializing restore...').start();

    try {
      const config = loadConfig();
      const backupManager = new BackupManager(config);

      spinner.text = 'Restoring database...';

      const result = await backupManager.restore(backupId, {
        dropExisting: options.dropExisting !== false,
        fromRemote: options.fromRemote || false
      });

      spinner.succeed(chalk.green('✅ Backup restored successfully'));

      console.log(chalk.cyan('\nRestore Details:'));
      console.log(chalk.white(`  Backup ID: ${result.backupId}`));
      console.log(chalk.white(`  Duration: ${(result.duration / 1000).toFixed(2)}s`));
      console.log();

      console.log(chalk.yellow('⚠️  Database has been restored. Please verify data integrity.'));
      console.log();

    } catch (error) {
      spinner.fail(chalk.red('Restore failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      if (options.verbose) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  }

  static async backupSchedule(cronExpression, options = {}) {
    console.log(chalk.cyan.bold('\n⏰ Scheduling backup...\n'));

    try {
      const config = loadConfig();
      const backupManager = new BackupManager(config);
      const scheduler = new BackupScheduler(backupManager, config);

      const result = await scheduler.scheduleBackup(cronExpression, {
        name: options.name || `Backup ${new Date().toISOString()}`,
        type: options.type || 'full',
        incremental: options.incremental || false,
        verify: options.verify !== false,
        uploadRemote: options.uploadRemote !== false
      });

      console.log(chalk.green('✅ Backup scheduled successfully'));
      console.log(chalk.cyan('\nSchedule Details:'));
      console.log(chalk.white(`  ID: ${result.scheduleId}`));
      console.log(chalk.white(`  Cron: ${cronExpression}`));
      console.log(chalk.white(`  Next run: ${result.nextRun}`));
      console.log();

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static async backupScheduleList() {
    console.log(chalk.cyan.bold('\n📅 Listing backup schedules...\n'));

    try {
      const config = loadConfig();
      const backupManager = new BackupManager(config);
      const scheduler = new BackupScheduler(backupManager, config);

      const schedules = await scheduler.listSchedules();

      if (schedules.length === 0) {
        console.log(chalk.yellow('No backup schedules found'));
        return;
      }

      console.log(chalk.cyan(`Found ${schedules.length} schedule(s):\n`));

      schedules.forEach((schedule, index) => {
        console.log(chalk.white(`${index + 1}. ${schedule.name}`));
        console.log(chalk.gray(`   ID: ${schedule.id}`));
        console.log(chalk.gray(`   Cron: ${schedule.cron}`));
        console.log(chalk.gray(`   Active: ${schedule.active ? 'Yes' : 'No'}`));
        console.log(chalk.gray(`   Last run: ${schedule.lastRun || 'Never'}`));
        console.log(chalk.gray(`   Next run: ${schedule.nextRun}`));
        console.log(chalk.gray(`   Run count: ${schedule.runCount}`));
        if (schedule.failureCount > 0) {
          console.log(chalk.red(`   Failures: ${schedule.failureCount}`));
        }
        console.log();
      });

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static async backupVerify(backupId) {
    console.log(chalk.cyan.bold(`\n🔍 Verifying backup: ${backupId}...\n`));

    const spinner = ora('Verifying backup integrity...').start();

    try {
      const config = loadConfig();
      const backupManager = new BackupManager(config);

      const result = await backupManager.verifyBackup(backupId);

      if (result.valid) {
        spinner.succeed(chalk.green('✅ Backup verification passed'));
      } else {
        spinner.fail(chalk.red('❌ Backup verification failed'));
      }

      console.log();

    } catch (error) {
      spinner.fail(chalk.red('Verification failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static async backupPrune(options = {}) {
    console.log(chalk.cyan.bold('\n🧹 Pruning old backups...\n'));

    const spinner = ora('Applying retention policy...').start();

    try {
      const config = loadConfig();
      const backupManager = new BackupManager(config);

      const result = await backupManager.pruneBackups(options);

      spinner.succeed(chalk.green('✅ Backup pruning completed'));

      console.log(chalk.cyan('\nPrune Results:'));
      console.log(chalk.white(`  Deleted: ${result.deleted}`));
      console.log(chalk.white(`  Errors: ${result.errors}`));
      console.log(chalk.white(`  Total processed: ${result.total}`));
      console.log();

    } catch (error) {
      spinner.fail(chalk.red('Pruning failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static async backupStats() {
    console.log(chalk.cyan.bold('\n📊 Backup statistics...\n'));

    try {
      const config = loadConfig();
      const backupManager = new BackupManager(config);

      const stats = await backupManager.getStats();

      console.log(chalk.cyan('Backup Statistics:\n'));
      console.log(chalk.white(`  Total backups: ${stats.total}`));
      console.log(chalk.white(`  Success rate: ${stats.successRate}`));
      console.log(chalk.white(`  Total size: ${stats.totalSize ? (stats.totalSize / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '0 GB'}`));
      console.log(chalk.white(`  Average compression: ${stats.averageCompressionRatio}`));

      if (stats.lastBackup) {
        console.log(chalk.white(`  Last backup: ${stats.lastBackup.date}`));
      }

      console.log(chalk.cyan('\nBy Status:'));
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        console.log(chalk.white(`  ${status}: ${count}`));
      });

      console.log(chalk.cyan('\nBy Type:'));
      Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(chalk.white(`  ${type}: ${count}`));
      });

      console.log();

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static async dropDatabase(config) {
    const adminClient = new Client({
      ...config,
      database: 'postgres', // Connect to default database
    });

    await adminClient.connect();
    await adminClient.query(`DROP DATABASE IF EXISTS ${config.database}`);
    await adminClient.end();
  }

  static async createDatabase(config) {
    const adminClient = new Client({
      ...config,
      database: 'postgres',
    });

    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE ${config.database}`);
    await adminClient.end();
  }

  static getDbConfig() {
    // Load from .env or use defaults
    require('dotenv').config();

    const databaseUrl = process.env.DATABASE_URL ||
                       'postgresql://devuser:devpass123@localhost:5432/app_db';

    // Parse DATABASE_URL
    const url = new URL(databaseUrl);

    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
    };
  }
}

module.exports = DbCommand;
