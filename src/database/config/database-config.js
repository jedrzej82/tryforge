/**
 * Database Configuration Management
 * Handles database connection configuration and migration settings
 */

const fs = require('fs-extra');
const path = require('path');
const { ConfigurationError } = require('../../utils/error-handler');
const logger = require('../../utils/logger');

/**
 * Supported database types
 */
const DatabaseTypes = {
  POSTGRESQL: 'postgresql',
  MYSQL: 'mysql',
  MONGODB: 'mongodb',
  SQLITE: 'sqlite'
};

/**
 * Supported ORM types
 */
const ORMTypes = {
  PRISMA: 'prisma',
  SEQUELIZE: 'sequelize',
  TYPEORM: 'typeorm',
  DRIZZLE: 'drizzle',
  RAW: 'raw' // Raw SQL without ORM
};

/**
 * Database Configuration Manager
 */
class DatabaseConfig {
  constructor(options = {}) {
    this.config = this.loadConfig(options);
    this.validateConfig();
  }

  /**
   * Load configuration from various sources
   */
  loadConfig(options = {}) {
    // Priority: options > config file > environment variables > defaults
    const config = {
      // Database connection
      database: {
        type: options.databaseType ||
              process.env.DB_TYPE ||
              DatabaseTypes.POSTGRESQL,

        host: options.host ||
              process.env.DB_HOST ||
              'localhost',

        port: options.port ||
              parseInt(process.env.DB_PORT) ||
              this.getDefaultPort(options.databaseType || process.env.DB_TYPE),

        name: options.database ||
              process.env.DB_NAME ||
              'tryforge_db',

        user: options.user ||
              process.env.DB_USER ||
              'postgres',

        password: options.password ||
              process.env.DB_PASSWORD ||
              '',

        url: options.url ||
             process.env.DATABASE_URL ||
             null,

        ssl: options.ssl !== undefined ?
             options.ssl :
             process.env.DB_SSL === 'true',

        // Connection pool settings
        pool: {
          min: options.poolMin || parseInt(process.env.DB_POOL_MIN) || 2,
          max: options.poolMax || parseInt(process.env.DB_POOL_MAX) || 10,
          idle: options.poolIdle || parseInt(process.env.DB_POOL_IDLE) || 10000,
          acquire: options.poolAcquire || parseInt(process.env.DB_POOL_ACQUIRE) || 30000
        },

        // Timeout settings
        timeout: {
          query: options.queryTimeout || parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
          connection: options.connectionTimeout || parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000
        },

        // Retry settings
        retry: {
          max: options.maxRetries || parseInt(process.env.DB_MAX_RETRIES) || 3,
          delay: options.retryDelay || parseInt(process.env.DB_RETRY_DELAY) || 1000
        }
      },

      // ORM configuration
      orm: {
        type: options.ormType ||
              process.env.ORM_TYPE ||
              ORMTypes.PRISMA
      },

      // Migration settings
      migrations: {
        // Directory for migration files
        directory: options.migrationsDir ||
                   process.env.MIGRATIONS_DIR ||
                   path.join(process.cwd(), 'migrations'),

        // Migration table name in database
        tableName: options.migrationsTable ||
                   process.env.MIGRATIONS_TABLE ||
                   '_migrations',

        // Schema for migrations table (PostgreSQL)
        schema: options.migrationsSchema ||
                process.env.MIGRATIONS_SCHEMA ||
                'public',

        // Lock table to prevent concurrent migrations
        lockTable: options.lockTable ||
                   process.env.MIGRATIONS_LOCK_TABLE ||
                   '_migrations_lock',

        // Timestamp format for migration files
        timestampFormat: 'YYYYMMDDHHmmss',

        // Automatically rollback on failure
        autoRollback: options.autoRollback !== undefined ?
                      options.autoRollback :
                      process.env.MIGRATIONS_AUTO_ROLLBACK !== 'false',

        // Create backup before migration
        backupBeforeMigration: options.backupBeforeMigration !== undefined ?
                               options.backupBeforeMigration :
                               process.env.MIGRATIONS_BACKUP === 'true',

        // Backup directory
        backupDirectory: options.backupDir ||
                         process.env.MIGRATIONS_BACKUP_DIR ||
                         path.join(process.cwd(), 'backups'),

        // Batch size for bulk operations
        batchSize: options.batchSize ||
                   parseInt(process.env.MIGRATIONS_BATCH_SIZE) ||
                   1000,

        // Allow destructive operations
        allowDestructive: options.allowDestructive !== undefined ?
                          options.allowDestructive :
                          process.env.MIGRATIONS_ALLOW_DESTRUCTIVE === 'true',

        // Timeout for migration execution (milliseconds)
        timeout: options.migrationTimeout ||
                 parseInt(process.env.MIGRATIONS_TIMEOUT) ||
                 300000, // 5 minutes

        // Lock timeout (milliseconds)
        lockTimeout: options.lockTimeout ||
                     parseInt(process.env.MIGRATIONS_LOCK_TIMEOUT) ||
                     60000 // 1 minute
      },

      // Versioning settings
      versioning: {
        // Enable semantic versioning
        enabled: options.versioningEnabled !== undefined ?
                 options.versioningEnabled :
                 process.env.VERSIONING_ENABLED !== 'false',

        // Version format
        format: 'semantic', // semantic or timestamp

        // Track versions per environment
        trackEnvironments: options.trackEnvironments !== undefined ?
                           options.trackEnvironments :
                           process.env.VERSIONING_TRACK_ENVIRONMENTS === 'true'
      },

      // Logging settings
      logging: {
        // Log all SQL queries
        logQueries: options.logQueries !== undefined ?
                    options.logQueries :
                    process.env.DB_LOG_QUERIES === 'true',

        // Log query execution time
        logExecutionTime: options.logExecutionTime !== undefined ?
                          options.logExecutionTime :
                          process.env.DB_LOG_EXECUTION_TIME !== 'false',

        // Slow query threshold (milliseconds)
        slowQueryThreshold: options.slowQueryThreshold ||
                            parseInt(process.env.DB_SLOW_QUERY_THRESHOLD) ||
                            5000
      },

      // Environment
      environment: options.environment ||
                   process.env.NODE_ENV ||
                   'development'
    };

    return config;
  }

  /**
   * Get default port for database type
   */
  getDefaultPort(databaseType) {
    const ports = {
      [DatabaseTypes.POSTGRESQL]: 5432,
      [DatabaseTypes.MYSQL]: 3306,
      [DatabaseTypes.MONGODB]: 27017,
      [DatabaseTypes.SQLITE]: null // SQLite doesn't use ports
    };

    return ports[databaseType] || 5432;
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const { database, orm, migrations } = this.config;

    // Validate database type
    if (!Object.values(DatabaseTypes).includes(database.type)) {
      throw new ConfigurationError(
        `Invalid database type: ${database.type}. Supported types: ${Object.values(DatabaseTypes).join(', ')}`,
        'database.type',
        { value: database.type }
      );
    }

    // Validate ORM type
    if (!Object.values(ORMTypes).includes(orm.type)) {
      throw new ConfigurationError(
        `Invalid ORM type: ${orm.type}. Supported types: ${Object.values(ORMTypes).join(', ')}`,
        'orm.type',
        { value: orm.type }
      );
    }

    // Validate connection for non-SQLite databases
    if (database.type !== DatabaseTypes.SQLITE) {
      if (!database.url && (!database.host || !database.name)) {
        throw new ConfigurationError(
          'Database connection requires either a URL or host and database name',
          'database.connection'
        );
      }
    }

    // Validate migration directory
    if (!migrations.directory) {
      throw new ConfigurationError(
        'Migration directory is required',
        'migrations.directory'
      );
    }

    logger.debug('Database configuration validated successfully', {
      databaseType: database.type,
      ormType: orm.type,
      environment: this.config.environment
    });
  }

  /**
   * Get connection string
   */
  getConnectionString() {
    const { database } = this.config;

    // Use URL if provided
    if (database.url) {
      return database.url;
    }

    // Build connection string based on database type
    switch (database.type) {
      case DatabaseTypes.POSTGRESQL:
        return `postgresql://${database.user}:${database.password}@${database.host}:${database.port}/${database.name}${database.ssl ? '?ssl=true' : ''}`;

      case DatabaseTypes.MYSQL:
        return `mysql://${database.user}:${database.password}@${database.host}:${database.port}/${database.name}`;

      case DatabaseTypes.MONGODB:
        return `mongodb://${database.user}:${database.password}@${database.host}:${database.port}/${database.name}`;

      case DatabaseTypes.SQLITE:
        return `sqlite://${database.name}`;

      default:
        throw new ConfigurationError(
          `Cannot build connection string for database type: ${database.type}`,
          'database.type'
        );
    }
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return this.config.database;
  }

  /**
   * Get ORM configuration
   */
  getORMConfig() {
    return this.config.orm;
  }

  /**
   * Get migration configuration
   */
  getMigrationConfig() {
    return this.config.migrations;
  }

  /**
   * Get versioning configuration
   */
  getVersioningConfig() {
    return this.config.versioning;
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.config.logging;
  }

  /**
   * Get full configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates) {
    this.config = {
      ...this.config,
      ...updates,
      database: {
        ...this.config.database,
        ...updates.database
      },
      migrations: {
        ...this.config.migrations,
        ...updates.migrations
      }
    };

    this.validateConfig();

    logger.debug('Configuration updated', { updates });
  }

  /**
   * Save configuration to file
   */
  async saveToFile(filePath) {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeJSON(filePath, this.config, { spaces: 2 });

      logger.info('Configuration saved', { filePath });
    } catch (error) {
      throw new ConfigurationError(
        `Failed to save configuration: ${error.message}`,
        'config.save',
        { filePath, error: error.message }
      );
    }
  }

  /**
   * Load configuration from file
   */
  static async loadFromFile(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        logger.warn('Configuration file not found, using defaults', { filePath });
        return new DatabaseConfig();
      }

      const fileConfig = await fs.readJSON(filePath);
      logger.info('Configuration loaded from file', { filePath });

      return new DatabaseConfig(fileConfig);
    } catch (error) {
      throw new ConfigurationError(
        `Failed to load configuration: ${error.message}`,
        'config.load',
        { filePath, error: error.message }
      );
    }
  }

  /**
   * Get masked connection string (hide password)
   */
  getMaskedConnectionString() {
    const connectionString = this.getConnectionString();
    return connectionString.replace(/:[^:@]+@/, ':***@');
  }
}

module.exports = {
  DatabaseConfig,
  DatabaseTypes,
  ORMTypes
};
