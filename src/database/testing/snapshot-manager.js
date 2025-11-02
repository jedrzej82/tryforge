const logger = require('../../utils/logger');
const fs = require('fs-extra');
const path = require('path');

/**
 * SnapshotManager - Manage database snapshots
 *
 * Features:
 * - Save database state to snapshots
 * - Restore database from snapshots
 * - Compare snapshots
 * - Generate snapshot diffs
 * - Snapshot versioning
 */
class SnapshotManager {
  constructor(config = {}) {
    this.config = {
      snapshotsPath: config.snapshotsPath || path.join(process.cwd(), 'src/database/testing/snapshots'),
      connection: config.connection,
      format: config.format || 'json', // json or sql
      ...config
    };

    // Ensure snapshots directory exists
    fs.ensureDirSync(this.config.snapshotsPath);

    logger.debug('SnapshotManager initialized', {
      snapshotsPath: this.config.snapshotsPath
    });
  }

  /**
   * Set database connection
   */
  setConnection(connection) {
    this.config.connection = connection;
  }

  /**
   * Save database snapshot
   */
  async saveSnapshot(name, options = {}) {
    if (!this.config.connection) {
      throw new Error('Database connection not set');
    }

    const {
      tables = null, // null = all tables
      includeSchema = true,
      compress = false
    } = options;

    try {
      logger.info(`Saving snapshot: ${name}`);

      // Get tables to snapshot
      const tablesToSnapshot = tables || await this.getAllTables();

      // Collect snapshot data
      const snapshot = {
        name,
        timestamp: new Date().toISOString(),
        tables: {},
        metadata: {
          tableCount: tablesToSnapshot.length,
          format: this.config.format,
          includeSchema
        }
      };

      // Save each table
      for (const tableName of tablesToSnapshot) {
        const tableData = await this.captureTableData(tableName, includeSchema);
        snapshot.tables[tableName] = tableData;
      }

      // Save snapshot to file
      const filename = this.getSnapshotFilename(name);
      await this.writeSnapshot(filename, snapshot, compress);

      logger.info(`Snapshot saved: ${name}`, {
        tables: tablesToSnapshot.length,
        file: filename
      });

      return {
        name,
        filename,
        tables: tablesToSnapshot.length,
        timestamp: snapshot.timestamp
      };
    } catch (error) {
      logger.error(`Failed to save snapshot: ${name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Restore database from snapshot
   */
  async restoreSnapshot(name, options = {}) {
    if (!this.config.connection) {
      throw new Error('Database connection not set');
    }

    const {
      clearExisting = true,
      tables = null // null = all tables in snapshot
    } = options;

    try {
      logger.info(`Restoring snapshot: ${name}`);

      // Load snapshot
      const filename = this.getSnapshotFilename(name);
      const snapshot = await this.readSnapshot(filename);

      if (!snapshot) {
        throw new Error(`Snapshot not found: ${name}`);
      }

      const tablesToRestore = tables || Object.keys(snapshot.tables);

      // Clear existing data if requested
      if (clearExisting) {
        await this.clearTables(tablesToRestore);
      }

      // Restore each table
      for (const tableName of tablesToRestore) {
        const tableData = snapshot.tables[tableName];
        if (tableData) {
          await this.restoreTableData(tableName, tableData);
        }
      }

      logger.info(`Snapshot restored: ${name}`, {
        tables: tablesToRestore.length
      });

      return {
        name,
        tables: tablesToRestore.length,
        timestamp: snapshot.timestamp
      };
    } catch (error) {
      logger.error(`Failed to restore snapshot: ${name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Compare two snapshots
   */
  async compareSnapshots(snapshot1Name, snapshot2Name) {
    try {
      logger.info(`Comparing snapshots: ${snapshot1Name} vs ${snapshot2Name}`);

      const [snapshot1, snapshot2] = await Promise.all([
        this.readSnapshot(this.getSnapshotFilename(snapshot1Name)),
        this.readSnapshot(this.getSnapshotFilename(snapshot2Name))
      ]);

      if (!snapshot1 || !snapshot2) {
        throw new Error('One or both snapshots not found');
      }

      const differences = {
        snapshot1: snapshot1Name,
        snapshot2: snapshot2Name,
        timestamp1: snapshot1.timestamp,
        timestamp2: snapshot2.timestamp,
        tables: {}
      };

      // Get all unique table names
      const allTables = new Set([
        ...Object.keys(snapshot1.tables),
        ...Object.keys(snapshot2.tables)
      ]);

      for (const tableName of allTables) {
        const table1 = snapshot1.tables[tableName];
        const table2 = snapshot2.tables[tableName];

        if (!table1) {
          differences.tables[tableName] = {
            status: 'added',
            rows: table2.rows.length
          };
        } else if (!table2) {
          differences.tables[tableName] = {
            status: 'removed',
            rows: table1.rows.length
          };
        } else {
          const diff = this.compareTableData(table1, table2);
          if (diff.hasChanges) {
            differences.tables[tableName] = diff;
          }
        }
      }

      return differences;
    } catch (error) {
      logger.error('Failed to compare snapshots', { error: error.message });
      throw error;
    }
  }

  /**
   * List all snapshots
   */
  async listSnapshots() {
    try {
      const files = await fs.readdir(this.config.snapshotsPath);
      const snapshotFiles = files.filter(f => f.endsWith('.snapshot.json'));

      const snapshots = [];

      for (const file of snapshotFiles) {
        const filePath = path.join(this.config.snapshotsPath, file);
        const stats = await fs.stat(filePath);
        const snapshot = await this.readSnapshot(file);

        snapshots.push({
          name: snapshot.name,
          filename: file,
          timestamp: snapshot.timestamp,
          tables: snapshot.metadata.tableCount,
          size: stats.size,
          createdAt: stats.mtime
        });
      }

      // Sort by timestamp descending
      snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return snapshots;
    } catch (error) {
      logger.error('Failed to list snapshots', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(name) {
    try {
      const filename = this.getSnapshotFilename(name);
      const filePath = path.join(this.config.snapshotsPath, filename);

      if (!(await fs.pathExists(filePath))) {
        throw new Error(`Snapshot not found: ${name}`);
      }

      await fs.remove(filePath);

      logger.info(`Snapshot deleted: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete snapshot: ${name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get snapshot info
   */
  async getSnapshotInfo(name) {
    try {
      const filename = this.getSnapshotFilename(name);
      const snapshot = await this.readSnapshot(filename);

      if (!snapshot) {
        throw new Error(`Snapshot not found: ${name}`);
      }

      const filePath = path.join(this.config.snapshotsPath, filename);
      const stats = await fs.stat(filePath);

      return {
        name: snapshot.name,
        timestamp: snapshot.timestamp,
        tables: Object.keys(snapshot.tables).map(tableName => ({
          name: tableName,
          rows: snapshot.tables[tableName].rows.length,
          schema: snapshot.tables[tableName].schema ? 'included' : 'not included'
        })),
        metadata: snapshot.metadata,
        size: stats.size,
        createdAt: stats.mtime
      };
    } catch (error) {
      logger.error(`Failed to get snapshot info: ${name}`, { error: error.message });
      throw error;
    }
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  async getAllTables() {
    const result = await this.config.connection.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    return result.rows.map(row => row.tablename);
  }

  async captureTableData(tableName, includeSchema = true) {
    const tableData = {
      rows: [],
      rowCount: 0
    };

    // Get schema if requested
    if (includeSchema) {
      const schemaResult = await this.config.connection.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      tableData.schema = schemaResult.rows;
    }

    // Get data
    const dataResult = await this.config.connection.query(`SELECT * FROM ${tableName}`);
    tableData.rows = dataResult.rows;
    tableData.rowCount = dataResult.rows.length;

    return tableData;
  }

  async restoreTableData(tableName, tableData) {
    if (tableData.rows.length === 0) {
      return;
    }

    const connection = this.config.connection;

    // Insert rows
    for (const row of tableData.rows) {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
      `;

      await connection.query(query, values);
    }

    logger.debug(`Restored ${tableData.rows.length} rows to ${tableName}`);
  }

  async clearTables(tables) {
    const connection = this.config.connection;

    for (const tableName of tables) {
      await connection.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
      logger.debug(`Cleared table: ${tableName}`);
    }
  }

  compareTableData(table1, table2) {
    const diff = {
      hasChanges: false,
      rowCountDiff: table2.rowCount - table1.rowCount,
      added: 0,
      removed: 0,
      modified: 0
    };

    if (table1.rowCount !== table2.rowCount) {
      diff.hasChanges = true;
    }

    // Simple comparison based on row count
    // For more detailed comparison, would need to compare row by row
    if (diff.rowCountDiff > 0) {
      diff.added = diff.rowCountDiff;
    } else if (diff.rowCountDiff < 0) {
      diff.removed = Math.abs(diff.rowCountDiff);
    }

    return diff;
  }

  getSnapshotFilename(name) {
    if (name.endsWith('.snapshot.json')) {
      return name;
    }
    return `${name}.snapshot.json`;
  }

  async writeSnapshot(filename, snapshot, compress = false) {
    const filePath = path.join(this.config.snapshotsPath, filename);

    if (compress) {
      await fs.writeJson(filePath, snapshot);
    } else {
      await fs.writeJson(filePath, snapshot, { spaces: 2 });
    }
  }

  async readSnapshot(filename) {
    const filePath = path.join(this.config.snapshotsPath, filename);

    if (!(await fs.pathExists(filePath))) {
      return null;
    }

    return await fs.readJson(filePath);
  }
}

module.exports = SnapshotManager;
