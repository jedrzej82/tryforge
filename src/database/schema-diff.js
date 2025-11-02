/**
 * Schema Diff Generator
 * Compares database schemas and generates migrations
 */

const logger = require('../utils/logger');
const { SchemaDiffError } = require('./migration-errors');

class SchemaDiff {
  constructor(adapter) {
    this.adapter = adapter;
  }

  /**
   * Compare two schemas
   */
  async compare(schema1, schema2) {
    try {
      logger.debug('Comparing schemas');

      const diff = {
        tables: {
          added: [],
          removed: [],
          modified: []
        },
        columns: {
          added: [],
          removed: [],
          modified: []
        },
        indexes: {
          added: [],
          removed: []
        },
        foreignKeys: {
          added: [],
          removed: []
        }
      };

      // Compare tables
      this.compareTables(schema1, schema2, diff);

      // Compare columns for common tables
      const commonTables = Object.keys(schema1).filter(table => schema2[table]);

      for (const table of commonTables) {
        this.compareColumns(table, schema1[table], schema2[table], diff);
        this.compareIndexes(table, schema1[table], schema2[table], diff);
        this.compareForeignKeys(table, schema1[table], schema2[table], diff);
      }

      logger.debug('Schema comparison complete', {
        tablesAdded: diff.tables.added.length,
        tablesRemoved: diff.tables.removed.length,
        tablesModified: diff.tables.modified.length
      });

      return diff;
    } catch (error) {
      throw new SchemaDiffError(
        `Failed to compare schemas: ${error.message}`,
        'schema1',
        'schema2',
        { error: error.message }
      );
    }
  }

  /**
   * Compare tables between schemas
   */
  compareTables(schema1, schema2, diff) {
    const tables1 = new Set(Object.keys(schema1));
    const tables2 = new Set(Object.keys(schema2));

    // Added tables
    for (const table of tables2) {
      if (!tables1.has(table)) {
        diff.tables.added.push({
          name: table,
          schema: schema2[table]
        });
      }
    }

    // Removed tables
    for (const table of tables1) {
      if (!tables2.has(table)) {
        diff.tables.removed.push({
          name: table,
          schema: schema1[table]
        });
      }
    }

    // Modified tables (common tables with changes)
    for (const table of tables1) {
      if (tables2.has(table)) {
        if (this.hasTableChanged(schema1[table], schema2[table])) {
          diff.tables.modified.push({
            name: table,
            oldSchema: schema1[table],
            newSchema: schema2[table]
          });
        }
      }
    }
  }

  /**
   * Check if table schema has changed
   */
  hasTableChanged(oldSchema, newSchema) {
    // Compare columns
    const oldColumns = new Set(oldSchema.columns?.map(c => c.column_name || c.name) || []);
    const newColumns = new Set(newSchema.columns?.map(c => c.column_name || c.name) || []);

    if (oldColumns.size !== newColumns.size) {
      return true;
    }

    for (const col of oldColumns) {
      if (!newColumns.has(col)) {
        return true;
      }
    }

    // Compare indexes
    const oldIndexes = new Set(oldSchema.indexes?.map(i => i.indexname || i.name) || []);
    const newIndexes = new Set(newSchema.indexes?.map(i => i.indexname || i.name) || []);

    if (oldIndexes.size !== newIndexes.size) {
      return true;
    }

    return false;
  }

  /**
   * Compare columns between table schemas
   */
  compareColumns(tableName, oldSchema, newSchema, diff) {
    const oldColumns = new Map(
      (oldSchema.columns || []).map(col => [
        col.column_name || col.name,
        col
      ])
    );

    const newColumns = new Map(
      (newSchema.columns || []).map(col => [
        col.column_name || col.name,
        col
      ])
    );

    // Added columns
    for (const [colName, colDef] of newColumns) {
      if (!oldColumns.has(colName)) {
        diff.columns.added.push({
          table: tableName,
          column: colName,
          definition: colDef
        });
      }
    }

    // Removed columns
    for (const [colName, colDef] of oldColumns) {
      if (!newColumns.has(colName)) {
        diff.columns.removed.push({
          table: tableName,
          column: colName,
          definition: colDef
        });
      }
    }

    // Modified columns
    for (const [colName, newDef] of newColumns) {
      if (oldColumns.has(colName)) {
        const oldDef = oldColumns.get(colName);

        if (this.hasColumnChanged(oldDef, newDef)) {
          diff.columns.modified.push({
            table: tableName,
            column: colName,
            oldDefinition: oldDef,
            newDefinition: newDef
          });
        }
      }
    }
  }

  /**
   * Check if column definition has changed
   */
  hasColumnChanged(oldDef, newDef) {
    const oldType = oldDef.data_type || oldDef.type;
    const newType = newDef.data_type || newDef.type;

    if (oldType !== newType) {
      return true;
    }

    if (oldDef.is_nullable !== newDef.is_nullable) {
      return true;
    }

    if (oldDef.column_default !== newDef.column_default) {
      return true;
    }

    return false;
  }

  /**
   * Compare indexes between table schemas
   */
  compareIndexes(tableName, oldSchema, newSchema, diff) {
    const oldIndexes = new Map(
      (oldSchema.indexes || []).map(idx => [
        idx.indexname || idx.name,
        idx
      ])
    );

    const newIndexes = new Map(
      (newSchema.indexes || []).map(idx => [
        idx.indexname || idx.name,
        idx
      ])
    );

    // Added indexes
    for (const [idxName, idxDef] of newIndexes) {
      if (!oldIndexes.has(idxName)) {
        diff.indexes.added.push({
          table: tableName,
          index: idxName,
          definition: idxDef
        });
      }
    }

    // Removed indexes
    for (const [idxName, idxDef] of oldIndexes) {
      if (!newIndexes.has(idxName)) {
        diff.indexes.removed.push({
          table: tableName,
          index: idxName,
          definition: idxDef
        });
      }
    }
  }

  /**
   * Compare foreign keys between table schemas
   */
  compareForeignKeys(tableName, oldSchema, newSchema, diff) {
    const oldForeignKeys = new Map(
      (oldSchema.foreignKeys || []).map(fk => [
        fk.constraint_name,
        fk
      ])
    );

    const newForeignKeys = new Map(
      (newSchema.foreignKeys || []).map(fk => [
        fk.constraint_name,
        fk
      ])
    );

    // Added foreign keys
    for (const [fkName, fkDef] of newForeignKeys) {
      if (!oldForeignKeys.has(fkName)) {
        diff.foreignKeys.added.push({
          table: tableName,
          constraint: fkName,
          definition: fkDef
        });
      }
    }

    // Removed foreign keys
    for (const [fkName, fkDef] of oldForeignKeys) {
      if (!newForeignKeys.has(fkName)) {
        diff.foreignKeys.removed.push({
          table: tableName,
          constraint: fkName,
          definition: fkDef
        });
      }
    }
  }

  /**
   * Generate migration from diff
   */
  async generateMigration(diff, options = {}) {
    const { name = 'auto_migration', databaseType = 'postgresql' } = options;

    logger.debug('Generating migration from diff', { name });

    const migration = {
      name,
      up: [],
      down: []
    };

    // Generate SQL for added tables
    for (const table of diff.tables.added) {
      migration.up.push(this.generateCreateTableSQL(table, databaseType));
      migration.down.push(this.generateDropTableSQL(table, databaseType));
    }

    // Generate SQL for removed tables
    for (const table of diff.tables.removed) {
      migration.up.push(this.generateDropTableSQL(table, databaseType));
      migration.down.push(this.generateCreateTableSQL(table, databaseType));
    }

    // Generate SQL for added columns
    for (const column of diff.columns.added) {
      migration.up.push(this.generateAddColumnSQL(column, databaseType));
      migration.down.push(this.generateDropColumnSQL(column, databaseType));
    }

    // Generate SQL for removed columns
    for (const column of diff.columns.removed) {
      migration.up.push(this.generateDropColumnSQL(column, databaseType));
      migration.down.push(this.generateAddColumnSQL(column, databaseType));
    }

    // Generate SQL for modified columns
    for (const column of diff.columns.modified) {
      migration.up.push(this.generateAlterColumnSQL(column, databaseType));
      migration.down.push(this.generateAlterColumnSQL(
        {
          ...column,
          newDefinition: column.oldDefinition,
          oldDefinition: column.newDefinition
        },
        databaseType
      ));
    }

    // Generate SQL for added indexes
    for (const index of diff.indexes.added) {
      migration.up.push(this.generateCreateIndexSQL(index, databaseType));
      migration.down.push(this.generateDropIndexSQL(index, databaseType));
    }

    // Generate SQL for removed indexes
    for (const index of diff.indexes.removed) {
      migration.up.push(this.generateDropIndexSQL(index, databaseType));
      migration.down.push(this.generateCreateIndexSQL(index, databaseType));
    }

    // Generate SQL for foreign keys
    for (const fk of diff.foreignKeys.added) {
      migration.up.push(this.generateAddForeignKeySQL(fk, databaseType));
      migration.down.push(this.generateDropForeignKeySQL(fk, databaseType));
    }

    for (const fk of diff.foreignKeys.removed) {
      migration.up.push(this.generateDropForeignKeySQL(fk, databaseType));
      migration.down.push(this.generateAddForeignKeySQL(fk, databaseType));
    }

    logger.debug('Migration generated', {
      upStatements: migration.up.length,
      downStatements: migration.down.length
    });

    return migration;
  }

  /**
   * Generate CREATE TABLE SQL
   */
  generateCreateTableSQL(table, databaseType) {
    // This is a simplified version - real implementation would be more complex
    return `CREATE TABLE ${table.name} (...);`;
  }

  /**
   * Generate DROP TABLE SQL
   */
  generateDropTableSQL(table, databaseType) {
    return `DROP TABLE IF EXISTS ${table.name};`;
  }

  /**
   * Generate ADD COLUMN SQL
   */
  generateAddColumnSQL(column, databaseType) {
    const { table, column: colName, definition } = column;
    const type = definition.data_type || definition.type;
    return `ALTER TABLE ${table} ADD COLUMN ${colName} ${type};`;
  }

  /**
   * Generate DROP COLUMN SQL
   */
  generateDropColumnSQL(column, databaseType) {
    const { table, column: colName } = column;
    return `ALTER TABLE ${table} DROP COLUMN ${colName};`;
  }

  /**
   * Generate ALTER COLUMN SQL
   */
  generateAlterColumnSQL(column, databaseType) {
    const { table, column: colName, newDefinition } = column;
    const type = newDefinition.data_type || newDefinition.type;

    if (databaseType === 'postgresql') {
      return `ALTER TABLE ${table} ALTER COLUMN ${colName} TYPE ${type};`;
    } else if (databaseType === 'mysql') {
      return `ALTER TABLE ${table} MODIFY COLUMN ${colName} ${type};`;
    }

    return `-- ALTER COLUMN ${table}.${colName}`;
  }

  /**
   * Generate CREATE INDEX SQL
   */
  generateCreateIndexSQL(index, databaseType) {
    const { table, index: idxName } = index;
    return `CREATE INDEX ${idxName} ON ${table} (...);`;
  }

  /**
   * Generate DROP INDEX SQL
   */
  generateDropIndexSQL(index, databaseType) {
    const { table, index: idxName } = index;
    return `DROP INDEX IF EXISTS ${idxName};`;
  }

  /**
   * Generate ADD FOREIGN KEY SQL
   */
  generateAddForeignKeySQL(fk, databaseType) {
    const { table, constraint } = fk;
    return `ALTER TABLE ${table} ADD CONSTRAINT ${constraint} FOREIGN KEY (...) REFERENCES ...;`;
  }

  /**
   * Generate DROP FOREIGN KEY SQL
   */
  generateDropForeignKeySQL(fk, databaseType) {
    const { table, constraint } = fk;
    return `ALTER TABLE ${table} DROP CONSTRAINT ${constraint};`;
  }

  /**
   * Print diff in human-readable format
   */
  async printDiff(diff) {
    const lines = [];

    lines.push('\n=== Schema Diff ===\n');

    // Tables
    if (diff.tables.added.length > 0) {
      lines.push('Tables Added:');
      diff.tables.added.forEach(t => lines.push(`  + ${t.name}`));
      lines.push('');
    }

    if (diff.tables.removed.length > 0) {
      lines.push('Tables Removed:');
      diff.tables.removed.forEach(t => lines.push(`  - ${t.name}`));
      lines.push('');
    }

    if (diff.tables.modified.length > 0) {
      lines.push('Tables Modified:');
      diff.tables.modified.forEach(t => lines.push(`  ~ ${t.name}`));
      lines.push('');
    }

    // Columns
    if (diff.columns.added.length > 0) {
      lines.push('Columns Added:');
      diff.columns.added.forEach(c => lines.push(`  + ${c.table}.${c.column}`));
      lines.push('');
    }

    if (diff.columns.removed.length > 0) {
      lines.push('Columns Removed:');
      diff.columns.removed.forEach(c => lines.push(`  - ${c.table}.${c.column}`));
      lines.push('');
    }

    if (diff.columns.modified.length > 0) {
      lines.push('Columns Modified:');
      diff.columns.modified.forEach(c => lines.push(`  ~ ${c.table}.${c.column}`));
      lines.push('');
    }

    // Indexes
    if (diff.indexes.added.length > 0) {
      lines.push('Indexes Added:');
      diff.indexes.added.forEach(i => lines.push(`  + ${i.table}.${i.index}`));
      lines.push('');
    }

    if (diff.indexes.removed.length > 0) {
      lines.push('Indexes Removed:');
      diff.indexes.removed.forEach(i => lines.push(`  - ${i.table}.${i.index}`));
      lines.push('');
    }

    // Foreign Keys
    if (diff.foreignKeys.added.length > 0) {
      lines.push('Foreign Keys Added:');
      diff.foreignKeys.added.forEach(fk => lines.push(`  + ${fk.table}.${fk.constraint}`));
      lines.push('');
    }

    if (diff.foreignKeys.removed.length > 0) {
      lines.push('Foreign Keys Removed:');
      diff.foreignKeys.removed.forEach(fk => lines.push(`  - ${fk.table}.${fk.constraint}`));
      lines.push('');
    }

    lines.push('=== End of Diff ===\n');

    return lines.join('\n');
  }

  /**
   * Check if diff is empty
   */
  isEmpty(diff) {
    return (
      diff.tables.added.length === 0 &&
      diff.tables.removed.length === 0 &&
      diff.tables.modified.length === 0 &&
      diff.columns.added.length === 0 &&
      diff.columns.removed.length === 0 &&
      diff.columns.modified.length === 0 &&
      diff.indexes.added.length === 0 &&
      diff.indexes.removed.length === 0 &&
      diff.foreignKeys.added.length === 0 &&
      diff.foreignKeys.removed.length === 0
    );
  }
}

module.exports = SchemaDiff;
