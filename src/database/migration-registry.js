/**
 * Migration Registry
 * Tracks all migrations in the database
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const {
  MigrationError,
  MigrationLockError,
  MigrationConflictError
} = require('./migration-errors');

class MigrationRegistry {
  constructor(adapter, config) {
    this.adapter = adapter;
    this.config = config;
    this.tableName = config.migrations?.tableName || '_migrations';
    this.lockTable = config.migrations?.lockTable || '_migrations_lock';
    this.currentBatch = null;
  }

  /**
   * Initialize migrations table
   */
  async initialize() {
    try {
      await this.adapter.connect();
      await this.adapter.createMigrationsTable(this.tableName);

      logger.info('Migration registry initialized', { tableName: this.tableName });
    } catch (error) {
      throw new MigrationError(
        `Failed to initialize migration registry: ${error.message}`,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Register a new migration
   */
  async register(migration) {
    try {
      const checksum = this.calculateChecksum(migration.content);

      const sql = `
        INSERT INTO ${this.tableName}
        (name, batch, checksum, status)
        VALUES (?, ?, ?, 'pending')
      `;

      await this.adapter.query(sql, [
        migration.name,
        this.getCurrentBatch(),
        checksum
      ]);

      logger.debug('Migration registered', {
        name: migration.name,
        batch: this.getCurrentBatch()
      });

      return {
        name: migration.name,
        batch: this.getCurrentBatch(),
        checksum,
        status: 'pending'
      };
    } catch (error) {
      throw new MigrationError(
        `Failed to register migration: ${error.message}`,
        migration.name,
        { error: error.message }
      );
    }
  }

  /**
   * Get all migrations
   */
  async getAll() {
    try {
      const sql = `
        SELECT *
        FROM ${this.tableName}
        ORDER BY executed_at ASC
      `;

      return await this.adapter.query(sql);
    } catch (error) {
      throw new MigrationError(
        `Failed to get migrations: ${error.message}`,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Get pending migrations
   */
  async getPending() {
    try {
      const sql = `
        SELECT *
        FROM ${this.tableName}
        WHERE status = 'pending'
        ORDER BY name ASC
      `;

      return await this.adapter.query(sql);
    } catch (error) {
      throw new MigrationError(
        `Failed to get pending migrations: ${error.message}`,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Get applied migrations
   */
  async getApplied() {
    try {
      const sql = `
        SELECT *
        FROM ${this.tableName}
        WHERE status = 'applied'
        ORDER BY executed_at DESC
      `;

      return await this.adapter.query(sql);
    } catch (error) {
      throw new MigrationError(
        `Failed to get applied migrations: ${error.message}`,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Get failed migrations
   */
  async getFailed() {
    try {
      const sql = `
        SELECT *
        FROM ${this.tableName}
        WHERE status = 'failed'
        ORDER BY executed_at DESC
      `;

      return await this.adapter.query(sql);
    } catch (error) {
      throw new MigrationError(
        `Failed to get failed migrations: ${error.message}`,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Get migration by name
   */
  async getByName(name) {
    try {
      const sql = `
        SELECT *
        FROM ${this.tableName}
        WHERE name = ?
        LIMIT 1
      `;

      const result = await this.adapter.query(sql, [name]);
      return result[0] || null;
    } catch (error) {
      throw new MigrationError(
        `Failed to get migration: ${error.message}`,
        name,
        { error: error.message }
      );
    }
  }

  /**
   * Get migrations by batch
   */
  async getByBatch(batch) {
    try {
      const sql = `
        SELECT *
        FROM ${this.tableName}
        WHERE batch = ?
        ORDER BY executed_at DESC
      `;

      return await this.adapter.query(sql, [batch]);
    } catch (error) {
      throw new MigrationError(
        `Failed to get migrations by batch: ${error.message}`,
        null,
        { batch, error: error.message }
      );
    }
  }

  /**
   * Get last batch number
   */
  async getLastBatch() {
    try {
      const sql = `
        SELECT MAX(batch) as last_batch
        FROM ${this.tableName}
      `;

      const result = await this.adapter.query(sql);
      return result[0]?.last_batch || 0;
    } catch (error) {
      throw new MigrationError(
        `Failed to get last batch: ${error.message}`,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Get current batch number
   */
  getCurrentBatch() {
    if (this.currentBatch === null) {
      throw new MigrationError(
        'Current batch not set. Call startBatch() first.',
        null
      );
    }
    return this.currentBatch;
  }

  /**
   * Start a new batch
   */
  async startBatch() {
    const lastBatch = await this.getLastBatch();
    this.currentBatch = lastBatch + 1;

    logger.debug('Started new migration batch', { batch: this.currentBatch });

    return this.currentBatch;
  }

  /**
   * Mark migration as applied
   */
  async markAsApplied(migrationName, executionTime) {
    try {
      const sql = `
        UPDATE ${this.tableName}
        SET status = 'applied',
            executed_at = CURRENT_TIMESTAMP,
            execution_time = ?
        WHERE name = ?
      `;

      await this.adapter.query(sql, [executionTime, migrationName]);

      logger.info('Migration applied', {
        name: migrationName,
        executionTime
      });
    } catch (error) {
      throw new MigrationError(
        `Failed to mark migration as applied: ${error.message}`,
        migrationName,
        { error: error.message }
      );
    }
  }

  /**
   * Mark migration as failed
   */
  async markAsFailed(migrationName, errorMessage) {
    try {
      const sql = `
        UPDATE ${this.tableName}
        SET status = 'failed',
            error_message = ?
        WHERE name = ?
      `;

      await this.adapter.query(sql, [errorMessage, migrationName]);

      logger.error('Migration failed', {
        name: migrationName,
        error: errorMessage
      });
    } catch (error) {
      throw new MigrationError(
        `Failed to mark migration as failed: ${error.message}`,
        migrationName,
        { error: error.message }
      );
    }
  }

  /**
   * Mark migration as rolled back
   */
  async markAsRolledBack(migrationName) {
    try {
      const sql = `
        UPDATE ${this.tableName}
        SET rolled_back_at = CURRENT_TIMESTAMP
        WHERE name = ?
      `;

      await this.adapter.query(sql, [migrationName]);

      logger.info('Migration rolled back', { name: migrationName });
    } catch (error) {
      throw new MigrationError(
        `Failed to mark migration as rolled back: ${error.message}`,
        migrationName,
        { error: error.message }
      );
    }
  }

  /**
   * Remove migration from registry
   */
  async remove(migrationName) {
    try {
      const sql = `
        DELETE FROM ${this.tableName}
        WHERE name = ?
      `;

      await this.adapter.query(sql, [migrationName]);

      logger.debug('Migration removed from registry', { name: migrationName });
    } catch (error) {
      throw new MigrationError(
        `Failed to remove migration: ${error.message}`,
        migrationName,
        { error: error.message }
      );
    }
  }

  /**
   * Acquire migration lock
   */
  async acquireLock() {
    const lockTimeout = this.config.migrations?.lockTimeout || 60000;

    try {
      await this.adapter.acquireLock('migration_lock', lockTimeout);

      logger.debug('Migration lock acquired');

      return true;
    } catch (error) {
      throw new MigrationLockError(
        `Failed to acquire migration lock: ${error.message}`,
        'migration_lock',
        { timeout: lockTimeout }
      );
    }
  }

  /**
   * Release migration lock
   */
  async releaseLock() {
    try {
      await this.adapter.releaseLock('migration_lock');

      logger.debug('Migration lock released');
    } catch (error) {
      logger.error('Failed to release migration lock', { error: error.message });
    }
  }

  /**
   * Check if migration exists
   */
  async exists(migrationName) {
    const migration = await this.getByName(migrationName);
    return migration !== null;
  }

  /**
   * Verify migration checksum
   */
  async verifyChecksum(migrationName, content) {
    const migration = await this.getByName(migrationName);

    if (!migration) {
      return true; // Migration doesn't exist yet
    }

    const currentChecksum = this.calculateChecksum(content);

    if (migration.checksum !== currentChecksum) {
      throw new MigrationConflictError(
        `Migration checksum mismatch: ${migrationName}`,
        [migrationName],
        {
          expectedChecksum: migration.checksum,
          actualChecksum: currentChecksum
        }
      );
    }

    return true;
  }

  /**
   * Calculate checksum for migration content
   */
  calculateChecksum(content) {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  /**
   * Get migration statistics
   */
  async getStatistics() {
    try {
      const all = await this.getAll();

      const stats = {
        total: all.length,
        applied: all.filter(m => m.status === 'applied').length,
        pending: all.filter(m => m.status === 'pending').length,
        failed: all.filter(m => m.status === 'failed').length,
        batches: await this.getLastBatch(),
        averageExecutionTime: 0
      };

      const appliedMigrations = all.filter(m => m.status === 'applied' && m.execution_time);

      if (appliedMigrations.length > 0) {
        const totalTime = appliedMigrations.reduce((sum, m) => sum + m.execution_time, 0);
        stats.averageExecutionTime = Math.round(totalTime / appliedMigrations.length);
      }

      return stats;
    } catch (error) {
      throw new MigrationError(
        `Failed to get statistics: ${error.message}`,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Clean up old migrations
   */
  async cleanup(olderThanDays = 90) {
    try {
      const sql = `
        DELETE FROM ${this.tableName}
        WHERE status = 'applied'
          AND rolled_back_at IS NOT NULL
          AND rolled_back_at < datetime('now', '-${olderThanDays} days')
      `;

      await this.adapter.query(sql);

      logger.info('Old migrations cleaned up', { olderThanDays });
    } catch (error) {
      throw new MigrationError(
        `Failed to cleanup migrations: ${error.message}`,
        null,
        { error: error.message }
      );
    }
  }
}

module.exports = MigrationRegistry;
