/**
 * Migration Manager
 * Core system for managing database migrations
 */

const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
const chalk = require('chalk');
const { DatabaseConfig } = require('./config/database-config');
const AdapterFactory = require('./adapters/adapter-factory');
const MigrationRegistry = require('./migration-registry');
const MigrationDependencies = require('./migration-dependencies');
const MigrationVersioning = require('./migration-version');
const SchemaDiff = require('./schema-diff');
const logger = require('../utils/logger');
const { errorHandler } = require('../utils/error-handler');
const {
  MigrationError,
  MigrationExecutionError,
  MigrationValidationError,
  MigrationRollbackError
} = require('./migration-errors');
const {
  operationSpinners,
  createTaskList,
  createProgressBar,
  success,
  error: showError,
  warning
} = require('../cli/ui/progress');

class MigrationManager {
  constructor(config = {}) {
    this.config = new DatabaseConfig(config);
    this.adapter = null;
    this.registry = null;
    this.dependencies = new MigrationDependencies();
    this.versioning = null;
    this.schemaDiff = null;
    this.isInitialized = false;
  }

  /**
   * Initialize migration manager
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create database adapter
      this.adapter = AdapterFactory.createAdapter(this.config.getDatabaseConfig());

      // Initialize components
      this.registry = new MigrationRegistry(this.adapter, this.config.getConfig());
      this.versioning = new MigrationVersioning(this.adapter, this.config.getConfig());
      this.schemaDiff = new SchemaDiff(this.adapter);

      // Connect and initialize
      await this.adapter.connect();
      await this.registry.initialize();
      await this.versioning.initialize();

      // Ensure migrations directory exists
      const migrationsDir = this.config.getMigrationConfig().directory;
      await fs.ensureDir(migrationsDir);

      this.isInitialized = true;

      logger.info('Migration manager initialized', {
        database: this.config.getDatabaseConfig().type,
        orm: this.config.getORMConfig().type
      });
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Migration Manager Initialization',
        suggestion: 'Check database connection and configuration'
      });
      throw error;
    }
  }

  /**
   * Create a new migration file
   */
  async createMigration(name, options = {}) {
    await this.initialize();

    const spinner = ora(`Creating migration: ${name}`).start();

    try {
      const {
        description = '',
        dependencies = [],
        template = null,
        up = null,
        down = null
      } = options;

      // Generate timestamp
      const timestamp = this.generateTimestamp();
      const fileName = `${timestamp}_${name}`;

      // Determine template to use
      const ormType = template || this.config.getORMConfig().type;
      const templateFile = this.getTemplatePath(ormType);

      // Load and compile template
      const templateContent = await fs.readFile(templateFile, 'utf8');
      const compiledTemplate = Handlebars.compile(templateContent);

      // Generate migration content
      const content = compiledTemplate({
        name,
        timestamp,
        description,
        dependencies: dependencies.join(', '),
        database: this.config.getDatabaseConfig().type,
        className: this.toPascalCase(name),
        up,
        down
      });

      // Determine file extension
      const extension = this.getFileExtension(ormType);
      const migrationPath = path.join(
        this.config.getMigrationConfig().directory,
        `${fileName}${extension}`
      );

      // Write migration file
      await fs.writeFile(migrationPath, content);

      // Add dependencies if specified
      if (dependencies.length > 0) {
        dependencies.forEach(dep => {
          this.dependencies.addDependency(fileName, dep);
        });
      }

      spinner.succeed(chalk.green(`Migration created: ${fileName}${extension}`));

      logger.info('Migration created', {
        name: fileName,
        path: migrationPath
      });

      return {
        name: fileName,
        path: migrationPath,
        timestamp
      };
    } catch (error) {
      spinner.fail(chalk.red('Failed to create migration'));

      errorHandler.handle(error, {
        context: 'Create Migration',
        suggestion: 'Check migration name and template configuration'
      });

      throw new MigrationError(
        `Failed to create migration: ${error.message}`,
        name,
        { error: error.message }
      );
    }
  }

  /**
   * Apply pending migrations
   */
  async migrate(options = {}) {
    await this.initialize();

    const {
      dryRun = false,
      target = null,
      step = null
    } = options;

    const spinner = operationSpinners.database('migrating');

    try {
      // Acquire lock
      await this.registry.acquireLock();

      // Get pending migrations
      const migrationFiles = await this.getPendingMigrationFiles();

      if (migrationFiles.length === 0) {
        spinner.info('No pending migrations');
        return { applied: [], skipped: [] };
      }

      // Resolve execution order
      const orderedMigrations = this.dependencies.resolveOrder(
        migrationFiles.map(f => f.name)
      );

      // Filter by target or step
      let migrationsToRun = orderedMigrations;

      if (target) {
        const targetIndex = orderedMigrations.indexOf(target);
        if (targetIndex === -1) {
          throw new MigrationError(`Target migration not found: ${target}`);
        }
        migrationsToRun = orderedMigrations.slice(0, targetIndex + 1);
      } else if (step) {
        migrationsToRun = orderedMigrations.slice(0, step);
      }

      if (dryRun) {
        spinner.info('Dry run mode - no changes will be made');
        console.log(chalk.cyan('\nMigrations to be applied:'));
        migrationsToRun.forEach((m, i) => {
          console.log(chalk.gray(`  ${i + 1}. ${m}`));
        });
        spinner.stop();
        return { applied: [], skipped: migrationsToRun };
      }

      spinner.stop();

      // Create progress bar for migrations
      const progressBar = createProgressBar('Applying migrations', {
        format: '{title} [{bar}] {percentage}% | {value}/{total} migrations'
      });
      progressBar.start(migrationsToRun.length, 0);

      // Start new batch
      await this.registry.startBatch();

      const applied = [];
      const failed = [];

      // Run migrations
      for (let i = 0; i < migrationsToRun.length; i++) {
        const migrationName = migrationsToRun[i];

        try {
          const startTime = Date.now();

          // Find migration file
          const migrationFile = migrationFiles.find(f => f.name === migrationName);

          if (!migrationFile) {
            throw new MigrationError(`Migration file not found: ${migrationName}`);
          }

          // Execute migration
          await this.executeMigration(migrationFile, 'up');

          const executionTime = Date.now() - startTime;

          // Mark as applied
          await this.registry.markAsApplied(migrationName, executionTime);

          applied.push(migrationName);

          progressBar.update(i + 1, {
            currentMigration: migrationName,
            duration: `${executionTime}ms`
          });
        } catch (error) {
          progressBar.stop();
          showError(`Failed to apply migration: ${migrationName}`, { error });

          await this.registry.markAsFailed(migrationName, error.message);

          failed.push({ name: migrationName, error: error.message });

          // Auto-rollback if configured
          if (this.config.getMigrationConfig().autoRollback) {
            warning('Auto-rollback enabled, reverting changes...');
            await this.rollbackBatch();
          }

          throw new MigrationExecutionError(
            `Migration failed: ${migrationName}`,
            migrationName,
            null,
            { error: error.message }
          );
        }
      }

      progressBar.stop();

      // Bump version
      if (applied.length > 0) {
        await this.versioning.bumpVersion('patch', `Applied ${applied.length} migrations`);
      }

      success(`Successfully applied ${applied.length} migrations`);

      logger.info('Migrations applied', {
        count: applied.length,
        migrations: applied
      });

      return { applied, failed };
    } catch (error) {
      showError('Migration failed', { error });

      errorHandler.handle(error, {
        context: 'Apply Migrations',
        recovery: 'Check migration files and database connection',
        suggestion: 'Use --dry-run flag to preview changes'
      });

      throw error;
    } finally {
      // Release lock
      await this.registry.releaseLock();
    }
  }

  /**
   * Rollback migrations
   */
  async rollback(options = {}) {
    await this.initialize();

    const {
      steps = 1,
      batch = null,
      target = null,
      dryRun = false
    } = options;

    const spinner = ora('Rolling back migrations').start();

    try {
      // Acquire lock
      await this.registry.acquireLock();

      // Get migrations to rollback
      let migrationsToRollback = [];

      if (batch) {
        migrationsToRollback = await this.registry.getByBatch(batch);
      } else if (target) {
        // Rollback to specific migration
        const applied = await this.registry.getApplied();
        const targetIndex = applied.findIndex(m => m.name === target);
        if (targetIndex === -1) {
          throw new MigrationError(`Target migration not found: ${target}`);
        }
        migrationsToRollback = applied.slice(0, targetIndex);
      } else {
        // Rollback N steps
        const applied = await this.registry.getApplied();
        migrationsToRollback = applied.slice(0, steps);
      }

      if (migrationsToRollback.length === 0) {
        spinner.info(chalk.blue('No migrations to rollback'));
        return { rolledBack: [] };
      }

      if (dryRun) {
        spinner.info(chalk.blue('Dry run mode - no changes will be made'));
        console.log(chalk.cyan('\nMigrations to be rolled back:'));
        migrationsToRollback.forEach((m, i) => {
          console.log(chalk.gray(`  ${i + 1}. ${m.name}`));
        });
        return { rolledBack: [] };
      }

      const rolledBack = [];

      // Rollback migrations in reverse order
      for (const migration of migrationsToRollback) {
        spinner.text = `Rolling back: ${migration.name}`;

        try {
          // Find migration file
          const migrationFile = await this.findMigrationFile(migration.name);

          if (!migrationFile) {
            logger.warn(`Migration file not found: ${migration.name}, skipping rollback`);
            continue;
          }

          // Execute rollback
          await this.executeMigration(migrationFile, 'down');

          // Mark as rolled back
          await this.registry.markAsRolledBack(migration.name);

          rolledBack.push(migration.name);

          spinner.succeed(chalk.green(`Rolled back: ${migration.name}`));
          spinner.start();
        } catch (error) {
          spinner.fail(chalk.red(`Rollback failed: ${migration.name}`));

          throw new MigrationRollbackError(
            `Rollback failed: ${migration.name}`,
            migration.name,
            error,
            { error: error.message }
          );
        }
      }

      // Bump version
      if (rolledBack.length > 0) {
        await this.versioning.bumpVersion('patch', `Rolled back ${rolledBack.length} migrations`);
      }

      spinner.succeed(chalk.green(`Successfully rolled back ${rolledBack.length} migrations`));

      logger.info('Migrations rolled back', {
        count: rolledBack.length,
        migrations: rolledBack
      });

      return { rolledBack };
    } catch (error) {
      spinner.fail(chalk.red('Rollback failed'));

      errorHandler.handle(error, {
        context: 'Rollback Migrations',
        recovery: 'Check migration files and database state',
        suggestion: 'Use --dry-run flag to preview changes'
      });

      throw error;
    } finally {
      // Release lock
      await this.registry.releaseLock();
    }
  }

  /**
   * Get migration status
   */
  async status() {
    await this.initialize();

    try {
      const [applied, pending, failed, stats] = await Promise.all([
        this.registry.getApplied(),
        this.getPendingMigrationFiles(),
        this.registry.getFailed(),
        this.registry.getStatistics()
      ]);

      const currentVersion = await this.versioning.getCurrentVersion();

      return {
        currentVersion,
        statistics: stats,
        applied,
        pending,
        failed
      };
    } catch (error) {
      errorHandler.handle(error, {
        context: 'Get Migration Status',
        suggestion: 'Check database connection'
      });
      throw error;
    }
  }

  /**
   * Validate migrations
   */
  async validate() {
    await this.initialize();

    const spinner = ora('Validating migrations').start();

    try {
      const issues = [];

      // Get all migration files
      const migrationFiles = await this.getAllMigrationFiles();

      // Validate dependencies
      try {
        this.dependencies.validate(migrationFiles.map(f => f.name));
      } catch (error) {
        issues.push({
          type: 'dependency',
          message: error.message
        });
      }

      // Check for circular dependencies
      try {
        this.dependencies.detectCircular();
      } catch (error) {
        issues.push({
          type: 'circular_dependency',
          message: error.message
        });
      }

      // Validate checksums
      for (const file of migrationFiles) {
        try {
          const content = await fs.readFile(file.path, 'utf8');
          await this.registry.verifyChecksum(file.name, content);
        } catch (error) {
          issues.push({
            type: 'checksum',
            migration: file.name,
            message: error.message
          });
        }
      }

      if (issues.length > 0) {
        spinner.warn(chalk.yellow(`Found ${issues.length} validation issues`));

        throw new MigrationValidationError(
          `Migration validation failed with ${issues.length} issues`,
          null,
          issues
        );
      }

      spinner.succeed(chalk.green('All migrations validated successfully'));

      return { valid: true, issues: [] };
    } catch (error) {
      spinner.fail(chalk.red('Validation failed'));

      errorHandler.handle(error, {
        context: 'Validate Migrations',
        suggestion: 'Review migration files and dependencies'
      });

      throw error;
    }
  }

  /**
   * Execute a migration
   */
  async executeMigration(migrationFile, direction = 'up') {
    const startTime = Date.now();

    try {
      // Begin transaction
      await this.adapter.beginTransaction();

      // Execute migration based on ORM type
      const ormType = this.config.getORMConfig().type;

      if (ormType === 'raw' || migrationFile.path.endsWith('.sql')) {
        await this.executeSQLMigration(migrationFile, direction);
      } else {
        await this.executeCodeMigration(migrationFile, direction);
      }

      // Commit transaction
      await this.adapter.commitTransaction();

      const executionTime = Date.now() - startTime;

      logger.debug('Migration executed', {
        name: migrationFile.name,
        direction,
        executionTime
      });

      return { success: true, executionTime };
    } catch (error) {
      // Rollback transaction
      await this.adapter.rollbackTransaction();

      throw new MigrationExecutionError(
        `Migration execution failed: ${error.message}`,
        migrationFile.name,
        null,
        { direction, error: error.message }
      );
    }
  }

  /**
   * Execute SQL migration
   */
  async executeSQLMigration(migrationFile, direction) {
    const content = await fs.readFile(migrationFile.path, 'utf8');

    // Parse SQL file to extract up/down migrations
    const sections = this.parseSQLMigration(content);

    if (!sections[direction]) {
      throw new MigrationError(
        `No ${direction} migration found in: ${migrationFile.name}`,
        migrationFile.name
      );
    }

    // Execute SQL statements
    const statements = sections[direction]
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      await this.adapter.query(statement);
    }
  }

  /**
   * Execute code-based migration (JS/TS)
   */
  async executeCodeMigration(migrationFile, direction) {
    // Require migration module
    const migration = require(migrationFile.path);

    if (!migration[direction] || typeof migration[direction] !== 'function') {
      throw new MigrationError(
        `No ${direction} function found in: ${migrationFile.name}`,
        migrationFile.name
      );
    }

    // Execute migration function
    await migration[direction](this.adapter);
  }

  /**
   * Parse SQL migration file
   */
  parseSQLMigration(content) {
    const sections = {
      up: '',
      down: ''
    };

    let currentSection = null;
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.includes('up migration') || trimmed.includes('-- up')) {
        currentSection = 'up';
        continue;
      }

      if (trimmed.includes('down migration') || trimmed.includes('-- down')) {
        currentSection = 'down';
        continue;
      }

      if (currentSection && !line.trim().startsWith('--')) {
        sections[currentSection] += line + '\n';
      }
    }

    return sections;
  }

  /**
   * Get pending migration files
   */
  async getPendingMigrationFiles() {
    const allFiles = await this.getAllMigrationFiles();
    const applied = await this.registry.getApplied();
    const appliedNames = new Set(applied.map(m => m.name));

    return allFiles.filter(f => !appliedNames.has(f.name));
  }

  /**
   * Get all migration files
   */
  async getAllMigrationFiles() {
    const migrationsDir = this.config.getMigrationConfig().directory;
    const files = await fs.readdir(migrationsDir);

    const migrationFiles = [];

    for (const file of files) {
      if (this.isMigrationFile(file)) {
        migrationFiles.push({
          name: this.getMigrationName(file),
          path: path.join(migrationsDir, file),
          file
        });
      }
    }

    // Sort by timestamp
    migrationFiles.sort((a, b) => a.name.localeCompare(b.name));

    return migrationFiles;
  }

  /**
   * Find migration file by name
   */
  async findMigrationFile(migrationName) {
    const allFiles = await this.getAllMigrationFiles();
    return allFiles.find(f => f.name === migrationName);
  }

  /**
   * Check if file is a migration file
   */
  isMigrationFile(filename) {
    return /^\d+_.+\.(js|ts|sql)$/.test(filename);
  }

  /**
   * Get migration name from filename
   */
  getMigrationName(filename) {
    return filename.replace(/\.(js|ts|sql)$/, '');
  }

  /**
   * Rollback current batch
   */
  async rollbackBatch() {
    const lastBatch = await this.registry.getLastBatch();
    const migrations = await this.registry.getByBatch(lastBatch);

    for (const migration of migrations.reverse()) {
      try {
        const migrationFile = await this.findMigrationFile(migration.name);
        if (migrationFile) {
          await this.executeMigration(migrationFile, 'down');
          await this.registry.markAsRolledBack(migration.name);
        }
      } catch (error) {
        logger.error('Batch rollback failed', {
          migration: migration.name,
          error: error.message
        });
      }
    }
  }

  /**
   * Generate timestamp for migration
   */
  generateTimestamp() {
    const now = new Date();
    return now.getFullYear().toString() +
           (now.getMonth() + 1).toString().padStart(2, '0') +
           now.getDate().toString().padStart(2, '0') +
           now.getHours().toString().padStart(2, '0') +
           now.getMinutes().toString().padStart(2, '0') +
           now.getSeconds().toString().padStart(2, '0');
  }

  /**
   * Get template path for ORM
   */
  getTemplatePath(ormType) {
    const templateMap = {
      prisma: 'prisma-migration.hbs',
      sequelize: 'sequelize-migration.hbs',
      typeorm: 'typeorm-migration.hbs',
      drizzle: 'drizzle-migration.hbs',
      raw: 'sql-migration.hbs'
    };

    const templateFile = templateMap[ormType] || 'sql-migration.hbs';

    return path.join(__dirname, 'templates', templateFile);
  }

  /**
   * Get file extension for ORM
   */
  getFileExtension(ormType) {
    const extensionMap = {
      prisma: '.sql',
      sequelize: '.js',
      typeorm: '.ts',
      drizzle: '.ts',
      raw: '.sql'
    };

    return extensionMap[ormType] || '.sql';
  }

  /**
   * Convert string to PascalCase
   */
  toPascalCase(str) {
    return str
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Close connections and cleanup
   */
  async close() {
    if (this.adapter) {
      await this.adapter.disconnect();
    }

    this.isInitialized = false;

    logger.debug('Migration manager closed');
  }
}

module.exports = MigrationManager;
