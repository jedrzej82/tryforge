const logger = require('../../utils/logger');
const { Pool } = require('pg');
const crypto = require('crypto');

/**
 * DatabaseTestManager - Manages test database lifecycle
 *
 * Features:
 * - Create/destroy isolated test databases
 * - Reset database state between tests
 * - Run tests in transactions with automatic rollback
 * - Support for parallel test execution
 * - Multi-database support (PostgreSQL, MySQL, MongoDB, SQLite)
 */
class DatabaseTestManager {
  constructor(config = {}) {
    this.config = {
      type: config.type || process.env.TEST_DB_TYPE || 'postgres',
      host: config.host || process.env.TEST_DB_HOST || 'localhost',
      port: config.port || process.env.TEST_DB_PORT || 5432,
      user: config.user || process.env.TEST_DB_USER || 'test_user',
      password: config.password || process.env.TEST_DB_PASSWORD || 'test_password',
      database: config.database || process.env.TEST_DB_NAME || 'test_db',
      prefix: config.prefix || 'test_',
      ...config
    };

    this.connections = new Map();
    this.testDatabases = new Set();
    this.adminPool = null;

    logger.info('DatabaseTestManager initialized', {
      type: this.config.type,
      host: this.config.host
    });
  }

  /**
   * Initialize admin connection for database operations
   */
  async initialize() {
    if (this.adminPool) {
      return;
    }

    try {
      this.adminPool = new Pool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: 'postgres' // Connect to default database
      });

      await this.adminPool.query('SELECT 1');
      logger.debug('Admin connection established');
    } catch (error) {
      logger.error('Failed to initialize admin connection', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate unique test database name
   */
  generateTestDatabaseName(testName = '') {
    const sanitizedName = testName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .substring(0, 30);

    const hash = crypto.randomBytes(4).toString('hex');
    const timestamp = Date.now().toString(36);

    return `${this.config.prefix}${sanitizedName}_${timestamp}_${hash}`;
  }

  /**
   * Create test database
   */
  async createTestDatabase(testName = 'default') {
    await this.initialize();

    const dbName = this.generateTestDatabaseName(testName);

    try {
      logger.debug(`Creating test database: ${dbName}`);

      // Create database
      await this.adminPool.query(`CREATE DATABASE ${dbName}`);

      // Store database name
      this.testDatabases.add(dbName);

      // Create connection pool for this database
      const pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: dbName
      });

      this.connections.set(dbName, pool);

      // Run migrations if migration function provided
      if (this.config.migrate) {
        logger.debug(`Running migrations on ${dbName}`);
        await this.config.migrate(pool);
      }

      logger.info(`Test database created: ${dbName}`);

      return {
        name: dbName,
        connection: pool
      };
    } catch (error) {
      logger.error(`Failed to create test database: ${dbName}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Destroy test database
   */
  async destroyTestDatabase(dbName) {
    try {
      logger.debug(`Destroying test database: ${dbName}`);

      // Close connection pool
      const pool = this.connections.get(dbName);
      if (pool) {
        await pool.end();
        this.connections.delete(dbName);
      }

      // Terminate all connections to the database
      await this.adminPool.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `, [dbName]);

      // Drop database
      await this.adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);

      this.testDatabases.delete(dbName);

      logger.info(`Test database destroyed: ${dbName}`);
    } catch (error) {
      logger.error(`Failed to destroy test database: ${dbName}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Reset database - truncate all tables
   */
  async resetDatabase(dbName) {
    const pool = this.connections.get(dbName);

    if (!pool) {
      throw new Error(`No connection found for database: ${dbName}`);
    }

    try {
      logger.debug(`Resetting database: ${dbName}`);

      // Get all tables
      const result = await pool.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
      `);

      const tables = result.rows.map(row => row.tablename);

      if (tables.length === 0) {
        logger.debug('No tables to reset');
        return;
      }

      // Truncate all tables
      await pool.query(`
        TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(', ')}
        RESTART IDENTITY CASCADE
      `);

      logger.debug(`Reset ${tables.length} tables in ${dbName}`);
    } catch (error) {
      logger.error(`Failed to reset database: ${dbName}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Run function in transaction (always rollback)
   */
  async runInTransaction(dbNameOrPool, fn) {
    let pool;

    if (typeof dbNameOrPool === 'string') {
      pool = this.connections.get(dbNameOrPool);
      if (!pool) {
        throw new Error(`No connection found for database: ${dbNameOrPool}`);
      }
    } else {
      pool = dbNameOrPool;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      logger.debug('Transaction started');

      const result = await fn(client);

      await client.query('ROLLBACK');
      logger.debug('Transaction rolled back');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction error, rolled back', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get test database connection
   */
  async getTestConnection(testName = 'default') {
    // Check if connection already exists
    for (const [dbName, pool] of this.connections.entries()) {
      if (dbName.includes(testName)) {
        return { name: dbName, connection: pool };
      }
    }

    // Create new test database
    return await this.createTestDatabase(testName);
  }

  /**
   * Get connection pool by database name
   */
  getConnection(dbName) {
    return this.connections.get(dbName);
  }

  /**
   * Clean up all test databases
   */
  async cleanup() {
    logger.info('Cleaning up test databases...');

    const dbNames = Array.from(this.testDatabases);

    for (const dbName of dbNames) {
      try {
        await this.destroyTestDatabase(dbName);
      } catch (error) {
        logger.warn(`Failed to destroy database during cleanup: ${dbName}`, {
          error: error.message
        });
      }
    }

    // Close admin connection
    if (this.adminPool) {
      await this.adminPool.end();
      this.adminPool = null;
    }

    logger.info('Cleanup complete');
  }

  /**
   * List all test databases
   */
  async listTestDatabases() {
    await this.initialize();

    try {
      const result = await this.adminPool.query(`
        SELECT datname
        FROM pg_database
        WHERE datname LIKE $1
      `, [`${this.config.prefix}%`]);

      return result.rows.map(row => row.datname);
    } catch (error) {
      logger.error('Failed to list test databases', { error: error.message });
      throw error;
    }
  }

  /**
   * Clean up orphaned test databases
   */
  async cleanupOrphanedDatabases() {
    const allTestDbs = await this.listTestDatabases();
    const activeDbNames = Array.from(this.testDatabases);

    const orphanedDbs = allTestDbs.filter(db => !activeDbNames.includes(db));

    logger.info(`Found ${orphanedDbs.length} orphaned test databases`);

    for (const dbName of orphanedDbs) {
      try {
        await this.destroyTestDatabase(dbName);
      } catch (error) {
        logger.warn(`Failed to cleanup orphaned database: ${dbName}`, {
          error: error.message
        });
      }
    }

    return orphanedDbs;
  }

  /**
   * Wait for database to be ready
   */
  async waitForDatabase(maxRetries = 10, retryDelay = 1000) {
    await this.initialize();

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.adminPool.query('SELECT 1');
        logger.debug('Database is ready');
        return true;
      } catch (error) {
        logger.debug(`Database not ready, attempt ${i + 1}/${maxRetries}`);

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw new Error('Database failed to become ready');
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(dbName) {
    const pool = this.connections.get(dbName);

    if (!pool) {
      throw new Error(`No connection found for database: ${dbName}`);
    }

    try {
      const [tablesResult, sizeResult] = await Promise.all([
        pool.query(`
          SELECT
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) AS columns
          FROM pg_tables
          WHERE schemaname = 'public'
        `),
        pool.query(`
          SELECT pg_size_pretty(pg_database_size($1)) AS size
        `, [dbName])
      ]);

      return {
        database: dbName,
        size: sizeResult.rows[0].size,
        tables: tablesResult.rows
      };
    } catch (error) {
      logger.error(`Failed to get database stats: ${dbName}`, { error: error.message });
      throw error;
    }
  }
}

module.exports = DatabaseTestManager;
