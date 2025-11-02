/**
 * Prisma Migration Helper
 * Manages Prisma migrations, client generation, and database operations
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

const execAsync = promisify(exec);

class PrismaMigrationHelper {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.schemaPath = path.join(projectPath, 'prisma', 'schema.prisma');
    this.migrationsPath = path.join(projectPath, 'prisma', 'migrations');
  }

  /**
   * Check if Prisma is installed
   */
  async isPrismaInstalled() {
    try {
      await execAsync('npx prisma --version', { cwd: this.projectPath });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize Prisma in project
   */
  async initializePrisma(provider = 'postgresql') {
    const spinner = ora('Initializing Prisma...').start();

    try {
      // Check if Prisma is already initialized
      if (await fs.pathExists(this.schemaPath)) {
        spinner.info('Prisma is already initialized');
        return { success: true, alreadyInitialized: true };
      }

      // Run prisma init
      await execAsync(`npx prisma init --datasource-provider ${provider}`, {
        cwd: this.projectPath
      });

      spinner.succeed('Prisma initialized successfully');
      return { success: true };
    } catch (error) {
      spinner.fail('Failed to initialize Prisma');
      console.error(chalk.red(error.message));
      return { success: false, error: error.message };
    }
  }

  /**
   * Format Prisma schema
   */
  async formatSchema() {
    const spinner = ora('Formatting Prisma schema...').start();

    try {
      await execAsync('npx prisma format', { cwd: this.projectPath });
      spinner.succeed('Schema formatted successfully');
      return { success: true };
    } catch (error) {
      spinner.fail('Failed to format schema');
      console.error(chalk.red(error.message));
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate Prisma schema
   */
  async validateSchema() {
    const spinner = ora('Validating Prisma schema...').start();

    try {
      const { stdout, stderr } = await execAsync('npx prisma validate', {
        cwd: this.projectPath
      });

      spinner.succeed('Schema is valid');
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail('Schema validation failed');
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Generate Prisma Client
   */
  async generateClient() {
    const spinner = ora('Generating Prisma Client...').start();

    try {
      const { stdout } = await execAsync('npx prisma generate', {
        cwd: this.projectPath
      });

      spinner.succeed('Prisma Client generated successfully');
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail('Failed to generate Prisma Client');
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Create a new migration
   */
  async createMigration(name) {
    if (!name) {
      throw new Error('Migration name is required');
    }

    const spinner = ora(`Creating migration: ${name}...`).start();

    try {
      const { stdout } = await execAsync(
        `npx prisma migrate dev --name ${name} --create-only`,
        { cwd: this.projectPath }
      );

      spinner.succeed(`Migration "${name}" created successfully`);
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail(`Failed to create migration: ${name}`);
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Apply pending migrations (development)
   */
  async applyMigrationsDev(name = null) {
    const spinner = ora('Applying migrations (dev)...').start();

    try {
      const command = name
        ? `npx prisma migrate dev --name ${name}`
        : 'npx prisma migrate dev';

      const { stdout } = await execAsync(command, {
        cwd: this.projectPath,
        env: { ...process.env, SKIP_GENERATE: 'true' }
      });

      spinner.succeed('Migrations applied successfully');
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail('Failed to apply migrations');
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Deploy migrations (production)
   */
  async deployMigrations() {
    const spinner = ora('Deploying migrations (production)...').start();

    try {
      const { stdout } = await execAsync('npx prisma migrate deploy', {
        cwd: this.projectPath
      });

      spinner.succeed('Migrations deployed successfully');
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail('Failed to deploy migrations');
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Check migration status
   */
  async getMigrationStatus() {
    try {
      const { stdout } = await execAsync('npx prisma migrate status', {
        cwd: this.projectPath
      });

      return { success: true, status: stdout };
    } catch (error) {
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Push schema to database without migrations (for prototyping)
   */
  async pushSchema(options = {}) {
    const spinner = ora('Pushing schema to database...').start();

    try {
      let command = 'npx prisma db push';

      if (options.acceptDataLoss) {
        command += ' --accept-data-loss';
      }

      if (options.forceReset) {
        command += ' --force-reset';
      }

      if (options.skipGenerate) {
        command += ' --skip-generate';
      }

      const { stdout } = await execAsync(command, {
        cwd: this.projectPath
      });

      spinner.succeed('Schema pushed to database successfully');
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail('Failed to push schema to database');
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Pull schema from database
   */
  async pullSchema() {
    const spinner = ora('Pulling schema from database...').start();

    try {
      const { stdout } = await execAsync('npx prisma db pull', {
        cwd: this.projectPath
      });

      spinner.succeed('Schema pulled from database successfully');
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail('Failed to pull schema from database');
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Reset database (destructive!)
   */
  async resetDatabase(options = {}) {
    const spinner = ora('Resetting database...').start();

    try {
      let command = 'npx prisma migrate reset';

      if (options.force) {
        command += ' --force';
      }

      if (options.skipGenerate) {
        command += ' --skip-generate';
      }

      if (options.skipSeed) {
        command += ' --skip-seed';
      }

      const { stdout } = await execAsync(command, {
        cwd: this.projectPath
      });

      spinner.succeed('Database reset successfully');
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail('Failed to reset database');
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Seed database
   */
  async seedDatabase() {
    const spinner = ora('Seeding database...').start();

    try {
      const { stdout } = await execAsync('npx prisma db seed', {
        cwd: this.projectPath
      });

      spinner.succeed('Database seeded successfully');
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail('Failed to seed database');
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Open Prisma Studio
   */
  async openStudio(port = 5555) {
    console.log(chalk.cyan(`Opening Prisma Studio on port ${port}...`));

    try {
      // This will keep running, so we don't await
      const studio = exec(`npx prisma studio --port ${port}`, {
        cwd: this.projectPath
      });

      studio.stdout.on('data', (data) => {
        console.log(data.toString());
      });

      studio.stderr.on('data', (data) => {
        console.error(chalk.red(data.toString()));
      });

      return { success: true, process: studio };
    } catch (error) {
      console.error(chalk.red('Failed to open Prisma Studio'));
      console.error(chalk.red(error.message));
      return { success: false, error: error.message };
    }
  }

  /**
   * Create migration from schema changes
   */
  async autoMigrate(migrationName) {
    console.log(chalk.cyan('\n🔄 Auto-migrating Prisma schema...\n'));

    // 1. Validate schema
    const validation = await this.validateSchema();
    if (!validation.success) {
      return { success: false, step: 'validation', error: validation.error };
    }

    // 2. Format schema
    await this.formatSchema();

    // 3. Create and apply migration
    const migration = await this.applyMigrationsDev(migrationName);
    if (!migration.success) {
      return { success: false, step: 'migration', error: migration.error };
    }

    // 4. Generate client
    const client = await this.generateClient();
    if (!client.success) {
      return { success: false, step: 'generation', error: client.error };
    }

    console.log(chalk.green('\n✓ Auto-migration completed successfully\n'));
    return { success: true };
  }

  /**
   * Quick setup for development
   */
  async quickSetup(provider = 'postgresql') {
    console.log(chalk.cyan('\n⚡ Quick Prisma Setup\n'));

    // 1. Initialize if needed
    const init = await this.initializePrisma(provider);
    if (!init.success && !init.alreadyInitialized) {
      return { success: false, step: 'initialization', error: init.error };
    }

    // 2. Push schema to database
    const push = await this.pushSchema({ skipGenerate: true });
    if (!push.success) {
      return { success: false, step: 'push', error: push.error };
    }

    // 3. Generate client
    const client = await this.generateClient();
    if (!client.success) {
      return { success: false, step: 'generation', error: client.error };
    }

    console.log(chalk.green('\n✓ Quick setup completed successfully\n'));
    return { success: true };
  }

  /**
   * Resolve migration issues
   */
  async resolveMigrationIssues() {
    const spinner = ora('Resolving migration issues...').start();

    try {
      const { stdout } = await execAsync('npx prisma migrate resolve --applied', {
        cwd: this.projectPath
      });

      spinner.succeed('Migration issues resolved');
      return { success: true, output: stdout };
    } catch (error) {
      spinner.fail('Failed to resolve migration issues');
      console.error(chalk.red(error.stderr || error.message));
      return { success: false, error: error.stderr || error.message };
    }
  }

  /**
   * Get database URL from schema
   */
  async getDatabaseUrl() {
    try {
      const schema = await fs.readFile(this.schemaPath, 'utf8');
      const match = schema.match(/url\s*=\s*env\("(.+?)"\)/);

      if (match) {
        const envVar = match[1];
        return process.env[envVar] || null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if database is accessible
   */
  async checkDatabaseConnection() {
    const spinner = ora('Checking database connection...').start();

    try {
      await execAsync('npx prisma db execute --stdin < /dev/null', {
        cwd: this.projectPath
      });

      spinner.succeed('Database connection successful');
      return { success: true };
    } catch (error) {
      spinner.fail('Database connection failed');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Prisma version
   */
  async getPrismaVersion() {
    try {
      const { stdout } = await execAsync('npx prisma --version', {
        cwd: this.projectPath
      });

      const match = stdout.match(/prisma\s+:\s+(\S+)/);
      return match ? match[1] : 'unknown';
    } catch (error) {
      return 'not installed';
    }
  }
}

module.exports = PrismaMigrationHelper;
