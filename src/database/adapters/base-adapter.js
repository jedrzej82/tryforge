/**
 * Base Database Adapter
 * Abstract class that all database adapters must extend
 */

const logger = require('../../utils/logger');
const { DatabaseConnectionError } = require('../migration-errors');

class BaseAdapter {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * Connect to database
   * Must be implemented by subclasses
   */
  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  /**
   * Disconnect from database
   * Must be implemented by subclasses
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  /**
   * Execute a query
   * Must be implemented by subclasses
   */
  async query(sql, params = []) {
    throw new Error('query() must be implemented by subclass');
  }

  /**
   * Begin transaction
   * Must be implemented by subclasses
   */
  async beginTransaction() {
    throw new Error('beginTransaction() must be implemented by subclass');
  }

  /**
   * Commit transaction
   * Must be implemented by subclasses
   */
  async commitTransaction() {
    throw new Error('commitTransaction() must be implemented by subclass');
  }

  /**
   * Rollback transaction
   * Must be implemented by subclasses
   */
  async rollbackTransaction() {
    throw new Error('rollbackTransaction() must be implemented by subclass');
  }

  /**
   * Create migrations table
   * Must be implemented by subclasses
   */
  async createMigrationsTable(tableName) {
    throw new Error('createMigrationsTable() must be implemented by subclass');
  }

  /**
   * Get schema information
   * Must be implemented by subclasses
   */
  async getSchema() {
    throw new Error('getSchema() must be implemented by subclass');
  }

  /**
   * Get table names
   * Must be implemented by subclasses
   */
  async getTableNames() {
    throw new Error('getTableNames() must be implemented by subclass');
  }

  /**
   * Get table schema
   * Must be implemented by subclasses
   */
  async getTableSchema(tableName) {
    throw new Error('getTableSchema() must be implemented by subclass');
  }

  /**
   * Check if table exists
   * Must be implemented by subclasses
   */
  async tableExists(tableName) {
    throw new Error('tableExists() must be implemented by subclass');
  }

  /**
   * Drop table
   * Must be implemented by subclasses
   */
  async dropTable(tableName) {
    throw new Error('dropTable() must be implemented by subclass');
  }

  /**
   * Acquire lock for migrations
   * Must be implemented by subclasses
   */
  async acquireLock(lockName, timeout) {
    throw new Error('acquireLock() must be implemented by subclass');
  }

  /**
   * Release lock
   * Must be implemented by subclasses
   */
  async releaseLock(lockName) {
    throw new Error('releaseLock() must be implemented by subclass');
  }

  /**
   * Execute multiple queries in a transaction
   */
  async executeInTransaction(queries) {
    try {
      await this.beginTransaction();

      const results = [];
      for (const query of queries) {
        const result = await this.query(query.sql, query.params);
        results.push(result);
      }

      await this.commitTransaction();

      return results;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  /**
   * Check connection
   */
  async checkConnection() {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get database type
   */
  getDatabaseType() {
    return this.config.type;
  }

  /**
   * Log query execution
   */
  logQuery(sql, params, executionTime) {
    const loggingConfig = this.config.logging || {};

    if (loggingConfig.logQueries) {
      logger.debug('SQL Query', { sql, params, executionTime });
    }

    if (loggingConfig.logExecutionTime && executionTime > loggingConfig.slowQueryThreshold) {
      logger.warn('Slow query detected', { sql, executionTime });
    }
  }

  /**
   * Ensure connection is established
   */
  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
  }
}

module.exports = BaseAdapter;
