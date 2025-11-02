/**
 * Seeder Registry
 *
 * Tracks seeder execution history to support idempotent seeding
 * and rollback capabilities.
 */

const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs-extra');

class SeederRegistry {
  constructor(config = {}) {
    this.storageType = config.storageType || 'file'; // 'file' or 'database'
    this.storagePath = config.storagePath || path.join(process.cwd(), '.tryforge', 'seeder-registry.json');
    this.db = config.db || null;
    this.tableName = config.tableName || 'seeder_registry';
    this.registry = null;
  }

  /**
   * Initialize the registry
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.storageType === 'database' && this.db) {
      await this.initializeDatabase();
    } else {
      await this.initializeFile();
    }

    logger.info('Seeder registry initialized');
  }

  /**
   * Initialize file-based registry
   * @returns {Promise<void>}
   */
  async initializeFile() {
    await fs.ensureDir(path.dirname(this.storagePath));

    if (await fs.pathExists(this.storagePath)) {
      this.registry = await fs.readJson(this.storagePath);
    } else {
      this.registry = {
        version: '1.0.0',
        seeders: {},
        lastRun: null
      };
      await this.save();
    }
  }

  /**
   * Initialize database-based registry
   * @returns {Promise<void>}
   */
  async initializeDatabase() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id SERIAL PRIMARY KEY,
        seeder_name VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rolled_back_at TIMESTAMP NULL,
        execution_time_ms INTEGER,
        records_created INTEGER DEFAULT 0,
        error_message TEXT,
        metadata JSONB
      )
    `;

    try {
      await this.db.query(createTableQuery);
      logger.debug('Seeder registry table created/verified');
    } catch (error) {
      logger.error('Failed to create seeder registry table', { error: error.message });
      throw error;
    }
  }

  /**
   * Register a seeder execution
   * @param {string} seederName - Name of the seeder
   * @param {string} status - Status (running, completed, failed, rolled_back)
   * @param {Object} details - Additional details
   * @returns {Promise<void>}
   */
  async register(seederName, status, details = {}) {
    if (this.storageType === 'database') {
      await this.registerDatabase(seederName, status, details);
    } else {
      await this.registerFile(seederName, status, details);
    }
  }

  /**
   * Register in file storage
   * @private
   */
  async registerFile(seederName, status, details = {}) {
    if (!this.registry) {
      await this.initialize();
    }

    this.registry.seeders[seederName] = {
      status,
      executedAt: details.executedAt || new Date().toISOString(),
      executionTimeMs: details.executionTimeMs || 0,
      recordsCreated: details.recordsCreated || 0,
      errorMessage: details.errorMessage || null,
      metadata: details.metadata || {}
    };

    this.registry.lastRun = new Date().toISOString();
    await this.save();
  }

  /**
   * Register in database storage
   * @private
   */
  async registerDatabase(seederName, status, details = {}) {
    const query = `
      INSERT INTO ${this.tableName}
        (seeder_name, status, execution_time_ms, records_created, error_message, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (seeder_name)
      DO UPDATE SET
        status = $2,
        executed_at = CURRENT_TIMESTAMP,
        execution_time_ms = $3,
        records_created = $4,
        error_message = $5,
        metadata = $6
    `;

    const values = [
      seederName,
      status,
      details.executionTimeMs || 0,
      details.recordsCreated || 0,
      details.errorMessage || null,
      JSON.stringify(details.metadata || {})
    ];

    try {
      await this.db.query(query, values);
    } catch (error) {
      logger.error('Failed to register seeder in database', {
        seeder: seederName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if a seeder has been run
   * @param {string} seederName - Name of the seeder
   * @returns {Promise<boolean>}
   */
  async hasRun(seederName) {
    if (this.storageType === 'database') {
      return await this.hasRunDatabase(seederName);
    } else {
      return await this.hasRunFile(seederName);
    }
  }

  /**
   * Check file storage
   * @private
   */
  async hasRunFile(seederName) {
    if (!this.registry) {
      await this.initialize();
    }

    const seeder = this.registry.seeders[seederName];
    return seeder && seeder.status === 'completed';
  }

  /**
   * Check database storage
   * @private
   */
  async hasRunDatabase(seederName) {
    const query = `
      SELECT status FROM ${this.tableName}
      WHERE seeder_name = $1
      ORDER BY executed_at DESC
      LIMIT 1
    `;

    try {
      const result = await this.db.query(query, [seederName]);
      return result.rows.length > 0 && result.rows[0].status === 'completed';
    } catch (error) {
      logger.error('Failed to check seeder status', {
        seeder: seederName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get all registered seeders
   * @returns {Promise<Array>}
   */
  async getAll() {
    if (this.storageType === 'database') {
      return await this.getAllDatabase();
    } else {
      return await this.getAllFile();
    }
  }

  /**
   * Get all from file storage
   * @private
   */
  async getAllFile() {
    if (!this.registry) {
      await this.initialize();
    }

    return Object.entries(this.registry.seeders).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  /**
   * Get all from database storage
   * @private
   */
  async getAllDatabase() {
    const query = `
      SELECT * FROM ${this.tableName}
      ORDER BY executed_at DESC
    `;

    try {
      const result = await this.db.query(query);
      return result.rows.map(row => ({
        name: row.seeder_name,
        status: row.status,
        executedAt: row.executed_at,
        rolledBackAt: row.rolled_back_at,
        executionTimeMs: row.execution_time_ms,
        recordsCreated: row.records_created,
        errorMessage: row.error_message,
        metadata: row.metadata
      }));
    } catch (error) {
      logger.error('Failed to get all seeders', { error: error.message });
      return [];
    }
  }

  /**
   * Mark a seeder as rolled back
   * @param {string} seederName - Name of the seeder
   * @returns {Promise<void>}
   */
  async markRolledBack(seederName) {
    await this.register(seederName, 'rolled_back', {
      executedAt: new Date().toISOString()
    });

    logger.info(`Seeder marked as rolled back: ${seederName}`);
  }

  /**
   * Get seeder status
   * @param {string} seederName - Name of the seeder
   * @returns {Promise<Object|null>}
   */
  async getStatus(seederName) {
    if (this.storageType === 'database') {
      return await this.getStatusDatabase(seederName);
    } else {
      return await this.getStatusFile(seederName);
    }
  }

  /**
   * Get status from file
   * @private
   */
  async getStatusFile(seederName) {
    if (!this.registry) {
      await this.initialize();
    }

    return this.registry.seeders[seederName] || null;
  }

  /**
   * Get status from database
   * @private
   */
  async getStatusDatabase(seederName) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE seeder_name = $1
      ORDER BY executed_at DESC
      LIMIT 1
    `;

    try {
      const result = await this.db.query(query, [seederName]);
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        status: row.status,
        executedAt: row.executed_at,
        rolledBackAt: row.rolled_back_at,
        executionTimeMs: row.execution_time_ms,
        recordsCreated: row.records_created,
        errorMessage: row.error_message,
        metadata: row.metadata
      };
    } catch (error) {
      logger.error('Failed to get seeder status', {
        seeder: seederName,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Clear the registry
   * @returns {Promise<void>}
   */
  async clear() {
    if (this.storageType === 'database') {
      await this.clearDatabase();
    } else {
      await this.clearFile();
    }

    logger.info('Seeder registry cleared');
  }

  /**
   * Clear file storage
   * @private
   */
  async clearFile() {
    this.registry = {
      version: '1.0.0',
      seeders: {},
      lastRun: null
    };
    await this.save();
  }

  /**
   * Clear database storage
   * @private
   */
  async clearDatabase() {
    const query = `TRUNCATE TABLE ${this.tableName}`;

    try {
      await this.db.query(query);
    } catch (error) {
      logger.error('Failed to clear registry', { error: error.message });
      throw error;
    }
  }

  /**
   * Save file registry to disk
   * @private
   */
  async save() {
    if (this.storageType === 'file') {
      await fs.writeJson(this.storagePath, this.registry, { spaces: 2 });
    }
  }

  /**
   * Get registry statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    const all = await this.getAll();

    const stats = {
      total: all.length,
      completed: all.filter(s => s.status === 'completed').length,
      failed: all.filter(s => s.status === 'failed').length,
      rolledBack: all.filter(s => s.status === 'rolled_back').length,
      totalRecords: all.reduce((sum, s) => sum + (s.recordsCreated || 0), 0),
      totalExecutionTime: all.reduce((sum, s) => sum + (s.executionTimeMs || 0), 0)
    };

    return stats;
  }
}

module.exports = SeederRegistry;
