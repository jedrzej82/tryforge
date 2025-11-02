/**
 * MongoDB Database Adapter
 */

const { MongoClient } = require('mongodb');
const BaseAdapter = require('./base-adapter');
const logger = require('../../utils/logger');
const { DatabaseConnectionError, MigrationLockError } = require('../migration-errors');

class MongoDBAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
    this.db = null;
    this.session = null;
  }

  /**
   * Connect to MongoDB database
   */
  async connect() {
    try {
      const url = this.config.url ||
        `mongodb://${this.config.user}:${this.config.password}@${this.config.host}:${this.config.port}`;

      this.client = new MongoClient(url, {
        maxPoolSize: this.config.pool?.max || 10,
        minPoolSize: this.config.pool?.min || 2,
        serverSelectionTimeoutMS: this.config.timeout?.connection || 10000
      });

      await this.client.connect();
      this.db = this.client.db(this.config.name);

      // Test connection
      await this.db.admin().ping();

      this.isConnected = true;
      logger.info('Connected to MongoDB database', {
        host: this.config.host,
        database: this.config.name
      });
    } catch (error) {
      throw new DatabaseConnectionError(
        `Failed to connect to MongoDB: ${error.message}`,
        'mongodb',
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB database');
    }
  }

  /**
   * Execute a query (MongoDB operation)
   */
  async query(operation, params = {}) {
    await this.ensureConnection();

    const startTime = Date.now();

    try {
      let result;

      // Handle different operation types
      if (typeof operation === 'function') {
        result = await operation(this.db);
      } else if (typeof operation === 'object') {
        const { collection, method, args } = operation;
        result = await this.db.collection(collection)[method](...args);
      }

      const executionTime = Date.now() - startTime;

      this.logQuery(JSON.stringify(operation), params, executionTime);

      return result;
    } catch (error) {
      logger.error('Query execution failed', {
        operation,
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

    this.session = this.client.startSession();
    this.session.startTransaction();

    logger.debug('Transaction started');
  }

  /**
   * Commit transaction
   */
  async commitTransaction() {
    if (!this.session) {
      throw new Error('No active transaction');
    }

    await this.session.commitTransaction();
    this.session.endSession();
    this.session = null;

    logger.debug('Transaction committed');
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction() {
    if (!this.session) {
      return;
    }

    try {
      await this.session.abortTransaction();
      this.session.endSession();
    } catch (error) {
      logger.error('Rollback failed', { error: error.message });
    } finally {
      this.session = null;
    }

    logger.debug('Transaction rolled back');
  }

  /**
   * Create migrations collection
   */
  async createMigrationsTable(collectionName = '_migrations') {
    await this.ensureConnection();

    // Check if collection exists
    const collections = await this.db.listCollections({ name: collectionName }).toArray();

    if (collections.length === 0) {
      await this.db.createCollection(collectionName);

      // Create indexes
      await this.db.collection(collectionName).createIndex({ name: 1 }, { unique: true });
      await this.db.collection(collectionName).createIndex({ batch: 1 });
      await this.db.collection(collectionName).createIndex({ status: 1 });
    }

    logger.debug('Migrations collection created', { collectionName });
  }

  /**
   * Get schema information
   */
  async getSchema() {
    const collections = await this.getTableNames();

    const schema = {};

    for (const collectionName of collections) {
      schema[collectionName] = await this.getTableSchema(collectionName);
    }

    return schema;
  }

  /**
   * Get collection names (table names)
   */
  async getTableNames() {
    const collections = await this.db.listCollections().toArray();
    return collections
      .map(col => col.name)
      .filter(name => !name.startsWith('system.'))
      .sort();
  }

  /**
   * Get collection schema (sample documents and indexes)
   */
  async getTableSchema(collectionName) {
    const collection = this.db.collection(collectionName);

    // Get indexes
    const indexes = await collection.indexes();

    // Get sample document to infer schema
    const sampleDoc = await collection.findOne();

    // Get collection stats
    const stats = await this.db.command({ collStats: collectionName });

    return {
      indexes,
      sampleDocument: sampleDoc,
      stats: {
        count: stats.count,
        size: stats.size,
        avgObjSize: stats.avgObjSize
      }
    };
  }

  /**
   * Check if collection exists
   */
  async tableExists(collectionName) {
    const collections = await this.db.listCollections({ name: collectionName }).toArray();
    return collections.length > 0;
  }

  /**
   * Drop collection
   */
  async dropTable(collectionName) {
    await this.db.collection(collectionName).drop();

    logger.debug('Collection dropped', { collectionName });
  }

  /**
   * Acquire lock for migrations
   */
  async acquireLock(lockName = 'migration_lock', timeout = 60000) {
    const startTime = Date.now();
    const lockCollection = this.db.collection('_locks');

    // Ensure lock collection exists with TTL index
    await lockCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    while (Date.now() - startTime < timeout) {
      try {
        // Try to insert lock document
        const lockDoc = {
          _id: lockName,
          acquiredAt: new Date(),
          expiresAt: new Date(Date.now() + timeout),
          holder: `${process.pid}@${require('os').hostname()}`
        };

        await lockCollection.insertOne(lockDoc);

        logger.debug('Migration lock acquired', { lockName });
        return true;
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - lock already exists
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw error;
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
      const lockCollection = this.db.collection('_locks');
      await lockCollection.deleteOne({ _id: lockName });

      logger.debug('Migration lock released', { lockName });
    } catch (error) {
      logger.error('Failed to release lock', { lockName, error: error.message });
    }
  }

  /**
   * Get MongoDB version
   */
  async getVersion() {
    const info = await this.db.admin().serverInfo();
    return info.version;
  }

  /**
   * Get database stats
   */
  async getDatabaseStats() {
    return await this.db.stats();
  }

  /**
   * Execute in transaction with session
   */
  async executeInTransaction(operations) {
    const session = this.client.startSession();

    try {
      await session.withTransaction(async () => {
        for (const operation of operations) {
          if (typeof operation === 'function') {
            await operation(this.db, session);
          }
        }
      });

      return true;
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

module.exports = MongoDBAdapter;
