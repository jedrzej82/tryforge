/**
 * TryForge Database Migration System
 * Export all database-related modules
 */

// Core components
const MigrationManager = require('./migration-manager');
const MigrationRegistry = require('./migration-registry');
const MigrationDependencies = require('./migration-dependencies');
const MigrationVersioning = require('./migration-version');
const SchemaDiff = require('./schema-diff');

// Configuration
const { DatabaseConfig, DatabaseTypes, ORMTypes } = require('./config/database-config');

// Adapters
const AdapterFactory = require('./adapters/adapter-factory');
const BaseAdapter = require('./adapters/base-adapter');
const PostgresAdapter = require('./adapters/postgres-adapter');
const MySQLAdapter = require('./adapters/mysql-adapter');
const MongoDBAdapter = require('./adapters/mongodb-adapter');
const SQLiteAdapter = require('./adapters/sqlite-adapter');

// Errors
const {
  MigrationError,
  MigrationExecutionError,
  MigrationValidationError,
  MigrationDependencyError,
  MigrationLockError,
  MigrationRollbackError,
  SchemaDiffError,
  DatabaseConnectionError,
  ORMAdapterError,
  MigrationVersionError,
  CircularDependencyError,
  MigrationConflictError
} = require('./migration-errors');

// CLI Commands
const DatabaseCommands = require('./cli-commands');

module.exports = {
  // Main classes
  MigrationManager,
  MigrationRegistry,
  MigrationDependencies,
  MigrationVersioning,
  SchemaDiff,

  // Configuration
  DatabaseConfig,
  DatabaseTypes,
  ORMTypes,

  // Adapters
  AdapterFactory,
  BaseAdapter,
  PostgresAdapter,
  MySQLAdapter,
  MongoDBAdapter,
  SQLiteAdapter,

  // Errors
  MigrationError,
  MigrationExecutionError,
  MigrationValidationError,
  MigrationDependencyError,
  MigrationLockError,
  MigrationRollbackError,
  SchemaDiffError,
  DatabaseConnectionError,
  ORMAdapterError,
  MigrationVersionError,
  CircularDependencyError,
  MigrationConflictError,

  // CLI
  DatabaseCommands
};
