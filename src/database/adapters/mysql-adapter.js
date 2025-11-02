/**
 * MySQL Database Adapter
 */

const mysql = require('mysql2/promise');
const BaseAdapter = require('./base-adapter');
const logger = require('../../utils/logger');
const { DatabaseConnectionError, MigrationLockError } = require('../migration-errors');

class MySQLAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
    this.connection = null; // For transaction handling
  }

  /**
   * Connect to MySQL database
   */
  async connect() {
    try {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.name,
        user: this.config.user,
        password: this.config.password,
        waitForConnections: true,
        connectionLimit: this.config.pool?.max || 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Test connection
      const connection = await this.pool.getConnection();
      await connection.query('SELECT 1');
      connection.release();

      this.isConnected = true;
      logger.info('Connected to MySQL database', {
        host: this.config.host,
        database: this.config.name
      });
    } catch (error) {
      throw new DatabaseConnectionError(
        `Failed to connect to MySQL: ${error.message}`,
        'mysql',
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
      logger.info('Disconnected from MySQL database');
    }
  }

  /**
   * Execute a query
   */
  async query(sql, params = []) {
    await this.ensureConnection();

    const startTime = Date.now();

    try {
      const connection = this.connection || this.pool;
      const [rows] = await connection.query(sql, params);
      const executionTime = Date.now() - startTime;

      this.logQuery(sql, params, executionTime);

      return rows;
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

    this.connection = await this.pool.getConnection();
    await this.connection.beginTransaction();

    logger.debug('Transaction started');
  }

  /**
   * Commit transaction
   */
  async commitTransaction() {
    if (!this.connection) {
      throw new Error('No active transaction');
    }

    await this.connection.commit();
    this.connection.release();
    this.connection = null;

    logger.debug('Transaction committed');
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction() {
    if (!this.connection) {
      return;
    }

    try {
      await this.connection.rollback();
      this.connection.release();
    } catch (error) {
      logger.error('Rollback failed', { error: error.message });
    } finally {
      this.connection = null;
    }

    logger.debug('Transaction rolled back');
  }

  /**
   * Create migrations table
   */
  async createMigrationsTable(tableName = '_migrations') {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        batch INT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time INT,
        checksum VARCHAR(64),
        status VARCHAR(20) DEFAULT 'applied',
        error_message TEXT,
        rolled_back_at TIMESTAMP NULL,
        INDEX idx_name (name),
        INDEX idx_batch (batch),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
      SELECT TABLE_NAME as table_name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME;
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
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        COLUMN_TYPE as column_type,
        COLUMN_KEY as column_key
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION;
    `;

    const columns = await this.query(columnsSql, [tableName]);

    // Get indexes
    const indexesSql = `
      SHOW INDEX FROM ${tableName};
    `;

    const indexes = await this.query(indexesSql);

    // Get foreign keys
    const foreignKeysSql = `
      SELECT
        CONSTRAINT_NAME as constraint_name,
        COLUMN_NAME as column_name,
        REFERENCED_TABLE_NAME as foreign_table_name,
        REFERENCED_COLUMN_NAME as foreign_column_name
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL;
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
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?;
    `;

    const result = await this.query(sql, [tableName]);
    return result[0].count > 0;
  }

  /**
   * Drop table
   */
  async dropTable(tableName) {
    const sql = `DROP TABLE IF EXISTS ${tableName};`;
    await this.query(sql);

    logger.debug('Table dropped', { tableName });
  }

  /**
   * Acquire lock for migrations
   */
  async acquireLock(lockName = 'migration_lock', timeout = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Try to get named lock
        const sql = 'SELECT GET_LOCK(?, 1) AS acquired';
        const result = await this.query(sql, [lockName]);

        if (result[0].acquired === 1) {
          logger.debug('Migration lock acquired', { lockName });
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
    try {
      const sql = 'SELECT RELEASE_LOCK(?) AS released';
      const result = await this.query(sql, [lockName]);

      if (result[0].released === 1) {
        logger.debug('Migration lock released', { lockName });
      }
    } catch (error) {
      logger.error('Failed to release lock', { lockName, error: error.message });
    }
  }

  /**
   * Get MySQL version
   */
  async getVersion() {
    const result = await this.query('SELECT VERSION() as version');
    return result[0].version;
  }

  /**
   * Optimize table
   */
  async optimizeTable(tableName) {
    await this.query(`OPTIMIZE TABLE ${tableName}`);
    logger.info('Table optimized', { tableName });
  }
}

module.exports = MySQLAdapter;
