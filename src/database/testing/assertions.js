const logger = require('../../utils/logger');

/**
 * DatabaseAssertions - Custom assertions for database testing
 *
 * Features:
 * - Assert record existence
 * - Assert record counts
 * - Assert relationships
 * - Assert column values
 * - Assert table states
 */
class DatabaseAssertions {
  constructor(connection) {
    this.connection = connection;
  }

  /**
   * Set database connection
   */
  setConnection(connection) {
    this.connection = connection;
  }

  /**
   * Assert that a record exists
   */
  async assertRecordExists(tableName, conditions = {}) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const { whereClause, values } = this.buildWhereClause(conditions);
    const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;

    try {
      const result = await this.connection.query(query, values);
      const count = parseInt(result.rows[0].count);

      if (count === 0) {
        throw new Error(
          `Expected record to exist in ${tableName} with conditions: ${JSON.stringify(conditions)}`
        );
      }

      logger.debug(`Record exists in ${tableName}`, { conditions, count });
      return true;
    } catch (error) {
      if (error.message.includes('Expected record to exist')) {
        throw error;
      }
      logger.error(`Failed to assert record exists in ${tableName}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Assert that a record does not exist
   */
  async assertRecordNotExists(tableName, conditions = {}) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const { whereClause, values } = this.buildWhereClause(conditions);
    const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;

    try {
      const result = await this.connection.query(query, values);
      const count = parseInt(result.rows[0].count);

      if (count > 0) {
        throw new Error(
          `Expected record to not exist in ${tableName} with conditions: ${JSON.stringify(conditions)}, but found ${count}`
        );
      }

      logger.debug(`Record does not exist in ${tableName}`, { conditions });
      return true;
    } catch (error) {
      if (error.message.includes('Expected record to not exist')) {
        throw error;
      }
      logger.error(`Failed to assert record not exists in ${tableName}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Assert record count
   */
  async assertCount(tableName, expectedCount, conditions = {}) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const { whereClause, values } = this.buildWhereClause(conditions);
    const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;

    try {
      const result = await this.connection.query(query, values);
      const actualCount = parseInt(result.rows[0].count);

      if (actualCount !== expectedCount) {
        throw new Error(
          `Expected ${expectedCount} records in ${tableName}, but found ${actualCount}`
        );
      }

      logger.debug(`Record count matches in ${tableName}`, {
        expected: expectedCount,
        actual: actualCount,
        conditions
      });

      return true;
    } catch (error) {
      if (error.message.includes('Expected')) {
        throw error;
      }
      logger.error(`Failed to assert count in ${tableName}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Assert minimum count
   */
  async assertMinCount(tableName, minCount, conditions = {}) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const { whereClause, values } = this.buildWhereClause(conditions);
    const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;

    try {
      const result = await this.connection.query(query, values);
      const actualCount = parseInt(result.rows[0].count);

      if (actualCount < minCount) {
        throw new Error(
          `Expected at least ${minCount} records in ${tableName}, but found ${actualCount}`
        );
      }

      logger.debug(`Record count meets minimum in ${tableName}`, {
        minimum: minCount,
        actual: actualCount
      });

      return true;
    } catch (error) {
      if (error.message.includes('Expected')) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Assert column value
   */
  async assertColumnValue(tableName, id, column, expectedValue) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const query = `SELECT ${column} FROM ${tableName} WHERE id = $1`;

    try {
      const result = await this.connection.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error(`Record with id ${id} not found in ${tableName}`);
      }

      const actualValue = result.rows[0][column];

      if (actualValue !== expectedValue) {
        throw new Error(
          `Expected ${column} to be ${expectedValue}, but got ${actualValue}`
        );
      }

      logger.debug(`Column value matches in ${tableName}`, {
        id,
        column,
        expected: expectedValue,
        actual: actualValue
      });

      return true;
    } catch (error) {
      if (error.message.includes('Expected') || error.message.includes('not found')) {
        throw error;
      }
      logger.error(`Failed to assert column value in ${tableName}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Assert has relation
   */
  async assertHasRelation(tableName, recordId, relationTable, foreignKey, expectedCount = null) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const query = `
      SELECT COUNT(*) as count
      FROM ${relationTable}
      WHERE ${foreignKey} = $1
    `;

    try {
      const result = await this.connection.query(query, [recordId]);
      const actualCount = parseInt(result.rows[0].count);

      if (expectedCount !== null && actualCount !== expectedCount) {
        throw new Error(
          `Expected ${expectedCount} related records in ${relationTable}, but found ${actualCount}`
        );
      }

      if (expectedCount === null && actualCount === 0) {
        throw new Error(
          `Expected related records in ${relationTable}, but found none`
        );
      }

      logger.debug(`Relation exists in ${relationTable}`, {
        recordId,
        foreignKey,
        count: actualCount
      });

      return true;
    } catch (error) {
      if (error.message.includes('Expected')) {
        throw error;
      }
      logger.error(`Failed to assert relation in ${relationTable}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Assert table is empty
   */
  async assertTableEmpty(tableName) {
    return await this.assertCount(tableName, 0);
  }

  /**
   * Assert table is not empty
   */
  async assertTableNotEmpty(tableName) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const query = `SELECT COUNT(*) as count FROM ${tableName}`;

    try {
      const result = await this.connection.query(query);
      const count = parseInt(result.rows[0].count);

      if (count === 0) {
        throw new Error(`Expected ${tableName} to not be empty, but it is empty`);
      }

      logger.debug(`Table is not empty: ${tableName}`, { count });
      return true;
    } catch (error) {
      if (error.message.includes('Expected')) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Assert tables have same structure
   */
  async assertSameStructure(table1, table2) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;

    try {
      const [result1, result2] = await Promise.all([
        this.connection.query(query, [table1]),
        this.connection.query(query, [table2])
      ]);

      const columns1 = result1.rows;
      const columns2 = result2.rows;

      if (columns1.length !== columns2.length) {
        throw new Error(
          `Tables have different number of columns: ${table1} (${columns1.length}) vs ${table2} (${columns2.length})`
        );
      }

      for (let i = 0; i < columns1.length; i++) {
        const col1 = columns1[i];
        const col2 = columns2[i];

        if (col1.column_name !== col2.column_name) {
          throw new Error(
            `Column name mismatch at position ${i}: ${col1.column_name} vs ${col2.column_name}`
          );
        }

        if (col1.data_type !== col2.data_type) {
          throw new Error(
            `Data type mismatch for column ${col1.column_name}: ${col1.data_type} vs ${col2.data_type}`
          );
        }
      }

      logger.debug(`Tables have same structure: ${table1}, ${table2}`);
      return true;
    } catch (error) {
      if (error.message.includes('mismatch') || error.message.includes('different')) {
        throw error;
      }
      logger.error('Failed to assert same structure', { error: error.message });
      throw error;
    }
  }

  /**
   * Assert column exists
   */
  async assertColumnExists(tableName, columnName) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    `;

    try {
      const result = await this.connection.query(query, [tableName, columnName]);

      if (result.rows.length === 0) {
        throw new Error(`Column ${columnName} does not exist in table ${tableName}`);
      }

      logger.debug(`Column exists in ${tableName}: ${columnName}`);
      return true;
    } catch (error) {
      if (error.message.includes('does not exist')) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Assert index exists
   */
  async assertIndexExists(tableName, indexName) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const query = `
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = $1 AND indexname = $2
    `;

    try {
      const result = await this.connection.query(query, [tableName, indexName]);

      if (result.rows.length === 0) {
        throw new Error(`Index ${indexName} does not exist on table ${tableName}`);
      }

      logger.debug(`Index exists on ${tableName}: ${indexName}`);
      return true;
    } catch (error) {
      if (error.message.includes('does not exist')) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Assert unique constraint
   */
  async assertUniqueConstraint(tableName, columnName) {
    if (!this.connection) {
      throw new Error('Database connection not set');
    }

    const query = `
      SELECT constraint_name
      FROM information_schema.constraint_column_usage
      WHERE table_name = $1 AND column_name = $2
        AND constraint_name LIKE '%_key'
    `;

    try {
      const result = await this.connection.query(query, [tableName, columnName]);

      if (result.rows.length === 0) {
        throw new Error(
          `No unique constraint found on column ${columnName} in table ${tableName}`
        );
      }

      logger.debug(`Unique constraint exists on ${tableName}.${columnName}`);
      return true;
    } catch (error) {
      if (error.message.includes('No unique constraint')) {
        throw error;
      }
      throw error;
    }
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  buildWhereClause(conditions) {
    if (Object.keys(conditions).length === 0) {
      return { whereClause: '', values: [] };
    }

    const whereParts = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(conditions)) {
      if (value === null) {
        whereParts.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        whereParts.push(`${key} = ANY($${paramIndex})`);
        values.push(value);
        paramIndex++;
      } else {
        whereParts.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    const whereClause = `WHERE ${whereParts.join(' AND ')}`;
    return { whereClause, values };
  }
}

module.exports = DatabaseAssertions;
