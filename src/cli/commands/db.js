/**
 * DB Commands - Database operations (reset, migrate, seed, backup)
 */

const chalk = require('chalk');
const ora = require('ora');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs-extra');

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

  static async seed() {
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

  static async backup() {
    console.log(chalk.cyan.bold('\n💾 Backing up database...\n'));

    const spinner = ora('Creating backup...').start();

    try {
      const dbConfig = this.getDbConfig();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(process.cwd(), 'backups');
      const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

      await fs.ensureDir(backupDir);

      // Use pg_dump to create backup
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);

      const dumpCommand = `pg_dump ${dbConfig.database} > ${backupFile}`;
      await execPromise(dumpCommand);

      spinner.succeed(chalk.green(`✅ Backup created: ${backupFile}`));

    } catch (error) {
      spinner.fail(chalk.red('Backup failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
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
