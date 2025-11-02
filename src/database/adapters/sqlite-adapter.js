/**
 * SQLite Database Adapter
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const BaseAdapter = require('./base-adapter');
const logger = require('../../utils/logger');
const { DatabaseConnectionError, MigrationLockError } = require('../migration-errors');

class SQLiteAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.db = null;
    this.inTransaction = false;
  }

  /**
   * Connect to SQLite database
   */
  async connect() {
    try {
      const dbPath = this.config.name.endsWith('.db') || this.config.name.endsWith('.sqlite')
        ? this.config.name
        : `${this.config.name}.db`;

      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Enable foreign keys
      await this.db.run('PRAGMA foreign_keys = ON');

      // Enable WAL mode for better concurrency
      await this.db.run('PRAGMA journal_mode = WAL');

      this.isConnected = true;
      logger.info('Connected to SQLite database', {
        database: dbPath
      });
    } catch (error) {
      throw new DatabaseConnectionError(
        `Failed to connect to SQLite: ${error.message}`,
        'sqlite',
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    if (this.db) {
      await this.db.close();
      this.isConnected = false;
      logger.info('Disconnected from SQLite database');
    }
  }

  /**
   * Execute a query
   */
  async query(sql, params = []) {
    await this.ensureConnection();

    const startTime = Date.now();

    try {
      let result;

      // Determine query type
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        result = await this.db.all(sql, params);
      } else {
        result = await this.db.run(sql, params);
      }

      const executionTime = Date.now() - startTime;

      this.logQuery(sql, params, executionTime);

      return result;
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

    await this.db.run('BEGIN TRANSACTION');
    this.inTransaction = true;

    logger.debug('Transaction started');
  }

  /**
   * Commit transaction
   */
  async commitTransaction() {
    if (!this.inTransaction) {
      throw new Error('No active transaction');
    }

    await this.db.run('COMMIT');
    this.inTransaction = false;

    logger.debug('Transaction committed');
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction() {
    if (!this.inTransaction) {
      return;
    }

    try {
      await this.db.run('ROLLBACK');
    } catch (error) {
      logger.error('Rollback failed', { error: error.message });
    } finally {
      this.inTransaction = false;
    }

    logger.debug('Transaction rolled back');
  }

  /**
   * Create migrations table
   */
  async createMigrationsTable(tableName = '_migrations') {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        execution_time INTEGER,
        checksum TEXT,
        status TEXT DEFAULT 'applied',
        error_message TEXT,
        rolled_back_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_${tableName}_name ON ${tableName}(name);
      CREATE INDEX IF NOT EXISTS idx_${tableName}_batch ON ${tableName}(batch);
      CREATE INDEX IF NOT EXISTS idx_${tableName}_status ON ${tableName}(status);
    `;

    await this.db.exec(sql);

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
      SELECT name as table_name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name;
    `;

    const result = await this.db.all(sql);
    return result.map(row => row.table_name);
  }

  /**
   * Get table schema
   */
  async getTableSchema(tableName) {
    // Get columns
    const columns = await this.db.all(`PRAGMA table_info(${tableName})`);

    // Get indexes
    const indexList = await this.db.all(`PRAGMA index_list(${tableName})`);

    const indexes = [];
    for (const index of indexList) {
      const indexInfo = await this.db.all(`PRAGMA index_info(${index.name})`);
      indexes.push({
        name: index.name,
        unique: index.unique === 1,
        columns: indexInfo
      });
    }

    // Get foreign keys
    const foreignKeys = await this.db.all(`PRAGMA foreign_key_list(${tableName})`);

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
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?;
    `;

    const result = await this.db.get(sql, [tableName]);
    return result.count > 0;
  }

  /**
   * Drop table
   */
  async dropTable(tableName) {
    const sql = `DROP TABLE IF EXISTS ${tableName};`;
    await this.db.run(sql);

    logger.debug('Table dropped', { tableName });
  }

  /**
   * Acquire lock for migrations
   * Note: SQLite doesn't have built-in locking mechanisms like PostgreSQL/MySQL
   * We use a simple lock file approach
   */
  async acquireLock(lockName = 'migration_lock', timeout = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Try to insert lock record
        await this.db.run(
          'INSERT INTO _locks (name, acquired_at, holder) VALUES (?, datetime("now"), ?)',
          [lockName, `${process.pid}@${require('os').hostname()}`]
        );

        logger.debug('Migration lock acquired', { lockName });
        return true;
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          // Lock already exists, wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // Table might not exist, create it
          try {
            await this.db.exec(`
              CREATE TABLE IF NOT EXISTS _locks (
                name TEXT PRIMARY KEY,
                acquired_at DATETIME,
                holder TEXT
              );
            `);
            // Try again after creating table
            continue;
          } catch (createError) {
            throw error;
          }
        }
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
      await this.db.run('DELETE FROM _locks WHERE name = ?', [lockName]);

      logger.debug('Migration lock released', { lockName });
    } catch (error) {
      logger.error('Failed to release lock', { lockName, error: error.message });
    }
  }

  /**
   * Get SQLite version
   */
  async getVersion() {
    const result = await this.db.get('SELECT sqlite_version() as version');
    return result.version;
  }

  /**
   * Vacuum database
   */
  async vacuum() {
    await this.db.run('VACUUM');
    logger.info('Database vacuumed');
  }

  /**
   * Optimize database
   */
  async optimize() {
    await this.db.run('PRAGMA optimize');
    logger.info('Database optimized');
  }
}

module.exports = SQLiteAdapter;
