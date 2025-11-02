/**
 * Database Adapter Factory
 * Creates the appropriate database adapter based on configuration
 */

const PostgresAdapter = require('./postgres-adapter');
const MySQLAdapter = require('./mysql-adapter');
const MongoDBAdapter = require('./mongodb-adapter');
const SQLiteAdapter = require('./sqlite-adapter');
const { DatabaseTypes } = require('../config/database-config');
const { DatabaseConnectionError } = require('../migration-errors');
const logger = require('../../utils/logger');

class AdapterFactory {
  /**
   * Create database adapter based on configuration
   */
  static createAdapter(config) {
    const databaseType = config.type || config.database?.type;

    logger.debug('Creating database adapter', { databaseType });

    switch (databaseType) {
      case DatabaseTypes.POSTGRESQL:
        return new PostgresAdapter(config);

      case DatabaseTypes.MYSQL:
        return new MySQLAdapter(config);

      case DatabaseTypes.MONGODB:
        return new MongoDBAdapter(config);

      case DatabaseTypes.SQLITE:
        return new SQLiteAdapter(config);

      default:
        throw new DatabaseConnectionError(
          `Unsupported database type: ${databaseType}`,
          databaseType,
          null,
          { supportedTypes: Object.values(DatabaseTypes) }
        );
    }
  }

  /**
   * Get supported database types
   */
  static getSupportedDatabaseTypes() {
    return Object.values(DatabaseTypes);
  }

  /**
   * Check if database type is supported
   */
  static isSupportedDatabaseType(databaseType) {
    return Object.values(DatabaseTypes).includes(databaseType);
  }
}

module.exports = AdapterFactory;
