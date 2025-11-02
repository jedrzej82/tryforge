/**
 * PostgreSQL Database Adapter
 */

const { Pool } = require('pg');
const BaseAdapter = require('./base-adapter');
const logger = require('../../utils/logger');
const { DatabaseConnectionError, MigrationLockError } = require('../migration-errors');

class PostgresAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
    this.client = null; // For transaction handling
  }

  /**
   * Connect to PostgreSQL database
   */
  async connect() {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.name,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        min: this.config.pool?.min || 2,
        max: this.config.pool?.max || 10,
        idleTimeoutMillis: this.config.pool?.idle || 10000,
        connectionTimeoutMillis: this.config.timeout?.connection || 10000
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      logger.info('Connected to PostgreSQL database', {
        host: this.config.host,
        database: this.config.name
      });
    } catch (error) {
      throw new DatabaseConnectionError(
        `Failed to connect to PostgreSQL: ${error.message}`,
        'postgresql',
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Disconnected from PostgreSQL database');
    }
  }

  /**
   * Execute a query
   */
  async query(sql, params = []) {
    await this.ensureConnection();

    const startTime = Date.now();

    try {
      const client = this.client || this.pool;
      const result = await client.query(sql, params);
      const executionTime = Date.now() - startTime;

      this.logQuery(sql, params, executionTime);

      return result.rows;
    } catch (error) {
      logger.error('Query execution failed', {
        sql,
        params,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    await this.ensureConnection();

    this.client = await this.pool.connect();
    await this.client.query('BEGIN');

    logger.debug('Transaction started');
  }

  /**
   * Commit transaction
   */
  async commitTransaction() {
    if (!this.client) {
      throw new Error('No active transaction');
    }

    await this.client.query('COMMIT');
    this.client.release();
    this.client = null;

    logger.debug('Transaction committed');
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction() {
    if (!this.client) {
      return;
    }

    try {
      await this.client.query('ROLLBACK');
      this.client.release();
    } catch (error) {
      logger.error('Rollback failed', { error: error.message });
    } finally {
      this.client = null;
    }

    logger.debug('Transaction rolled back');
  }

  /**
   * Create migrations table
   */
  async createMigrationsTable(tableName = '_migrations') {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time INTEGER,
        checksum VARCHAR(64),
        status VARCHAR(20) DEFAULT 'applied',
        error_message TEXT,
        rolled_back_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_${tableName}_name ON ${tableName}(name);
      CREATE INDEX IF NOT EXISTS idx_${tableName}_batch ON ${tableName}(batch);
      CREATE INDEX IF NOT EXISTS idx_${tableName}_status ON ${tableName}(status);
    `;

    await this.query(sql);

    logger.debug('Migrations table created', { tableName });
  }

  /**
   * Get schema information
   */
  async getSchema() {
    const tables = await this.getTableNames();

    const schema = {};

    for (const tableName of tables) {
      schema[tableName] = await this.getTableSchema(tableName);
    }

    return schema;
  }

  /**
   * Get table names
   */
  async getTableNames() {
    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const result = await this.query(sql);
    return result.map(row => row.table_name);
  }

  /**
   * Get table schema
   */
  async getTableSchema(tableName) {
    // Get columns
    const columnsSql = `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position;
    `;

    const columns = await this.query(columnsSql, [tableName]);

    // Get indexes
    const indexesSql = `
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = $1;
    `;

    const indexes = await this.query(indexesSql, [tableName]);

    // Get foreign keys
    const foreignKeysSql = `
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = $1
        AND tc.constraint_type = 'FOREIGN KEY';
    `;

    const foreignKeys = await this.query(foreignKeysSql, [tableName]);

    return {
      columns,
      indexes,
      foreignKeys
    };
  }

  /**
   * Check if table exists
   */
  async tableExists(tableName) {
    const sql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      );
    `;

    const result = await this.query(sql, [tableName]);
    return result[0].exists;
  }

  /**
   * Drop table
   */
  async dropTable(tableName) {
    const sql = `DROP TABLE IF EXISTS ${tableName} CASCADE;`;
    await this.query(sql);

    logger.debug('Table dropped', { tableName });
  }

  /**
   * Acquire lock for migrations
   */
  async acquireLock(lockName = 'migration_lock', timeout = 60000) {
    const lockId = this.getLockId(lockName);
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Try to acquire advisory lock
        const sql = 'SELECT pg_try_advisory_lock($1) AS acquired';
        const result = await this.query(sql, [lockId]);

        if (result[0].acquired) {
          logger.debug('Migration lock acquired', { lockName, lockId });
          return true;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error('Failed to acquire lock', { lockName, error: error.message });
        throw error;
      }
    }

    throw new MigrationLockError(
      `Failed to acquire migration lock within ${timeout}ms`,
      lockName,
      { timeout }
    );
  }

  /**
   * Release lock
   */
  async releaseLock(lockName = 'migration_lock') {
    const lockId = this.getLockId(lockName);

    try {
      const sql = 'SELECT pg_advisory_unlock($1) AS released';
      const result = await this.query(sql, [lockId]);

      if (result[0].released) {
        logger.debug('Migration lock released', { lockName, lockId });
      }
    } catch (error) {
      logger.error('Failed to release lock', { lockName, error: error.message });
    }
  }

  /**
   * Convert lock name to numeric ID for PostgreSQL advisory locks
   */
  getLockId(lockName) {
    let hash = 0;
    for (let i = 0; i < lockName.length; i++) {
      hash = ((hash << 5) - hash) + lockName.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get PostgreSQL version
   */
  async getVersion() {
    const result = await this.query('SELECT version()');
    return result[0].version;
  }

  /**
   * Vacuum database
   */
  async vacuum() {
    await this.query('VACUUM ANALYZE');
    logger.info('Database vacuumed');
  }
}

module.exports = PostgresAdapter;
