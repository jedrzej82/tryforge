const logger = require('../../utils/logger');
const fs = require('fs-extra');
const path = require('path');

/**
 * FixtureManager - Manages test fixtures and data loading
 *
 * Features:
 * - Load fixtures from JSON, YAML, or JS files
 * - Handle relationships between fixtures
 * - Support for fixture traits and states
 * - Fixture inheritance
 * - Generate realistic test data
 */
class FixtureManager {
  constructor(config = {}) {
    this.config = {
      fixturesPath: config.fixturesPath || path.join(process.cwd(), 'src/database/testing/fixtures'),
      connection: config.connection,
      ...config
    };

    this.traits = new Map();
    this.defaults = new Map();
    this.loadedFixtures = new Map();
    this.sequences = new Map();

    logger.debug('FixtureManager initialized', {
      fixturesPath: this.config.fixturesPath
    });
  }

  /**
   * Set database connection
   */
  setConnection(connection) {
    this.config.connection = connection;
  }

  /**
   * Load fixtures from file
   */
  async loadFixtures(fixtureFile) {
    try {
      const filePath = path.isAbsolute(fixtureFile)
        ? fixtureFile
        : path.join(this.config.fixturesPath, fixtureFile);

      // Add extension if not provided
      const extensions = ['.json', '.js', '.yaml', '.yml'];
      let fullPath = filePath;

      if (!path.extname(filePath)) {
        for (const ext of extensions) {
          const testPath = filePath + ext;
          if (await fs.pathExists(testPath)) {
            fullPath = testPath;
            break;
          }
        }
      }

      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`Fixture file not found: ${fullPath}`);
      }

      logger.debug(`Loading fixtures from: ${fullPath}`);

      let fixtures;
      const ext = path.extname(fullPath);

      if (ext === '.json') {
        fixtures = await fs.readJson(fullPath);
      } else if (ext === '.js') {
        fixtures = require(fullPath);
        if (typeof fixtures === 'function') {
          fixtures = await fixtures();
        }
      } else {
        throw new Error(`Unsupported fixture format: ${ext}`);
      }

      // Insert fixtures into database
      const insertedData = await this.insertFixtures(fixtures);

      // Store loaded fixtures
      const fixtureName = path.basename(fixtureFile, path.extname(fixtureFile));
      this.loadedFixtures.set(fixtureName, insertedData);

      logger.info(`Loaded fixtures: ${fixtureName}`, {
        tables: Object.keys(insertedData),
        records: Object.values(insertedData).reduce((sum, arr) => sum + arr.length, 0)
      });

      return insertedData;
    } catch (error) {
      logger.error(`Failed to load fixtures: ${fixtureFile}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Insert fixtures into database
   */
  async insertFixtures(fixtures) {
    const connection = this.config.connection;

    if (!connection) {
      throw new Error('Database connection not set');
    }

    const insertedData = {};

    // Insert fixtures in order to handle relationships
    for (const [tableName, records] of Object.entries(fixtures)) {
      if (!Array.isArray(records)) {
        logger.warn(`Skipping invalid fixture data for table: ${tableName}`);
        continue;
      }

      const inserted = [];

      for (const record of records) {
        try {
          const result = await this.insertRecord(connection, tableName, record);
          inserted.push(result);
        } catch (error) {
          logger.error(`Failed to insert fixture record in ${tableName}`, {
            error: error.message,
            record
          });
          throw error;
        }
      }

      insertedData[tableName] = inserted;
      logger.debug(`Inserted ${inserted.length} records into ${tableName}`);
    }

    return insertedData;
  }

  /**
   * Insert single record
   */
  async insertRecord(connection, tableName, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await connection.query(query, values);
    return result.rows[0];
  }

  /**
   * Create fixture with traits
   */
  async createFixture(tableName, data = {}, traits = []) {
    const connection = this.config.connection;

    if (!connection) {
      throw new Error('Database connection not set');
    }

    try {
      // Apply default values
      let fixtureData = { ...this.getDefaults(tableName), ...data };

      // Apply traits
      for (const traitName of traits) {
        const trait = this.getTrait(tableName, traitName);
        if (trait) {
          fixtureData = { ...fixtureData, ...trait };
        }
      }

      // Insert into database
      const result = await this.insertRecord(connection, tableName, fixtureData);

      logger.debug(`Created fixture in ${tableName}`, { id: result.id });

      return result;
    } catch (error) {
      logger.error(`Failed to create fixture in ${tableName}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Build fixture without saving to database
   */
  buildFixture(tableName, data = {}, traits = []) {
    // Apply default values
    let fixtureData = { ...this.getDefaults(tableName), ...data };

    // Apply traits
    for (const traitName of traits) {
      const trait = this.getTrait(tableName, traitName);
      if (trait) {
        fixtureData = { ...fixtureData, ...trait };
      }
    }

    return fixtureData;
  }

  /**
   * Create multiple fixtures
   */
  async createMany(tableName, count, data = {}, traits = []) {
    const fixtures = [];

    for (let i = 0; i < count; i++) {
      // Add sequence number to data
      const sequenceData = {
        ...data,
        sequence: this.getSequenceValue(tableName)
      };

      const fixture = await this.createFixture(tableName, sequenceData, traits);
      fixtures.push(fixture);
    }

    logger.debug(`Created ${count} fixtures in ${tableName}`);

    return fixtures;
  }

  /**
   * Create fixture with relationships
   */
  async createWithRelations(tableName, data = {}, relations = {}) {
    const connection = this.config.connection;

    if (!connection) {
      throw new Error('Database connection not set');
    }

    try {
      // Create related records first
      const relatedData = {};

      for (const [relationName, relationConfig] of Object.entries(relations)) {
        if (relationConfig.table && relationConfig.data) {
          const related = await this.createFixture(
            relationConfig.table,
            relationConfig.data
          );
          relatedData[relationConfig.foreignKey || `${relationName}_id`] = related.id;
        }
      }

      // Create main record with foreign keys
      const mainData = { ...data, ...relatedData };
      const result = await this.createFixture(tableName, mainData);

      logger.debug(`Created fixture with relations in ${tableName}`, { id: result.id });

      return result;
    } catch (error) {
      logger.error(`Failed to create fixture with relations: ${tableName}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Define defaults for a table
   */
  defineDefaults(tableName, defaults) {
    this.defaults.set(tableName, defaults);
    logger.debug(`Defined defaults for ${tableName}`);
  }

  /**
   * Get defaults for a table
   */
  getDefaults(tableName) {
    return this.defaults.get(tableName) || {};
  }

  /**
   * Define trait for a table
   */
  defineTrait(tableName, traitName, data) {
    const key = `${tableName}.${traitName}`;
    this.traits.set(key, data);
    logger.debug(`Defined trait: ${key}`);
  }

  /**
   * Get trait for a table
   */
  getTrait(tableName, traitName) {
    const key = `${tableName}.${traitName}`;
    return this.traits.get(key);
  }

  /**
   * Get sequence value
   */
  getSequenceValue(name) {
    const current = this.sequences.get(name) || 0;
    const next = current + 1;
    this.sequences.set(name, next);
    return next;
  }

  /**
   * Reset sequence
   */
  resetSequence(name) {
    this.sequences.set(name, 0);
  }

  /**
   * Reset all sequences
   */
  resetAllSequences() {
    this.sequences.clear();
  }

  /**
   * Get loaded fixtures
   */
  getLoadedFixtures(name) {
    return this.loadedFixtures.get(name);
  }

  /**
   * Clear loaded fixtures
   */
  clearLoadedFixtures() {
    this.loadedFixtures.clear();
  }

  /**
   * Unload fixtures (delete from database)
   */
  async unloadFixtures(name) {
    const fixtures = this.loadedFixtures.get(name);

    if (!fixtures) {
      logger.warn(`No loaded fixtures found: ${name}`);
      return;
    }

    const connection = this.config.connection;

    if (!connection) {
      throw new Error('Database connection not set');
    }

    try {
      // Delete in reverse order to handle relationships
      const tables = Object.keys(fixtures).reverse();

      for (const tableName of tables) {
        const records = fixtures[tableName];
        const ids = records.map(r => r.id).filter(id => id !== undefined);

        if (ids.length > 0) {
          await connection.query(
            `DELETE FROM ${tableName} WHERE id = ANY($1)`,
            [ids]
          );
          logger.debug(`Deleted ${ids.length} records from ${tableName}`);
        }
      }

      this.loadedFixtures.delete(name);
      logger.info(`Unloaded fixtures: ${name}`);
    } catch (error) {
      logger.error(`Failed to unload fixtures: ${name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * List available fixture files
   */
  async listFixtures() {
    try {
      const files = await fs.readdir(this.config.fixturesPath);
      return files.filter(f => /\.(json|js|ya?ml)$/.test(f));
    } catch (error) {
      logger.error('Failed to list fixtures', { error: error.message });
      return [];
    }
  }
}

module.exports = FixtureManager;
