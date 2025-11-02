/**
 * Custom Error Classes for Database Migrations
 * Extends TryForge error handling system with migration-specific errors
 */

const { TryForgeError } = require('../utils/error-handler');

/**
 * Base Migration Error
 */
class MigrationError extends TryForgeError {
  constructor(message, migrationName = null, context = {}) {
    super(message, { migrationName, ...context });
    this.migrationName = migrationName;
  }
}

/**
 * Migration execution failed
 */
class MigrationExecutionError extends MigrationError {
  constructor(message, migrationName, sql = null, context = {}) {
    super(message, migrationName, { sql, ...context });
    this.sql = sql;
  }
}

/**
 * Migration validation failed
 */
class MigrationValidationError extends MigrationError {
  constructor(message, migrationName, validationIssues = [], context = {}) {
    super(message, migrationName, { validationIssues, ...context });
    this.validationIssues = validationIssues;
  }
}

/**
 * Migration dependency error
 */
class MigrationDependencyError extends MigrationError {
  constructor(message, migrationName, dependencies = [], context = {}) {
    super(message, migrationName, { dependencies, ...context });
    this.dependencies = dependencies;
  }
}

/**
 * Migration lock error
 */
class MigrationLockError extends MigrationError {
  constructor(message, lockHolder = null, context = {}) {
    super(message, null, { lockHolder, ...context });
    this.lockHolder = lockHolder;
  }
}

/**
 * Migration rollback error
 */
class MigrationRollbackError extends MigrationError {
  constructor(message, migrationName, originalError = null, context = {}) {
    super(message, migrationName, { originalError: originalError?.message, ...context });
    this.originalError = originalError;
  }
}

/**
 * Schema diff error
 */
class SchemaDiffError extends MigrationError {
  constructor(message, schema1 = null, schema2 = null, context = {}) {
    super(message, null, { schema1, schema2, ...context });
    this.schema1 = schema1;
    this.schema2 = schema2;
  }
}

/**
 * Database connection error
 */
class DatabaseConnectionError extends MigrationError {
  constructor(message, databaseType = null, connectionString = null, context = {}) {
    super(message, null, { databaseType, connectionString: connectionString ? '***' : null, ...context });
    this.databaseType = databaseType;
  }
}

/**
 * ORM adapter error
 */
class ORMAdapterError extends MigrationError {
  constructor(message, ormType = null, operation = null, context = {}) {
    super(message, null, { ormType, operation, ...context });
    this.ormType = ormType;
    this.operation = operation;
  }
}

/**
 * Migration version error
 */
class MigrationVersionError extends MigrationError {
  constructor(message, currentVersion = null, targetVersion = null, context = {}) {
    super(message, null, { currentVersion, targetVersion, ...context });
    this.currentVersion = currentVersion;
    this.targetVersion = targetVersion;
  }
}

/**
 * Circular dependency error
 */
class CircularDependencyError extends MigrationDependencyError {
  constructor(message, cycle = [], context = {}) {
    super(message, null, cycle, { cycle, ...context });
    this.cycle = cycle;
  }
}

/**
 * Migration conflict error
 */
class MigrationConflictError extends MigrationError {
  constructor(message, conflictingMigrations = [], context = {}) {
    super(message, null, { conflictingMigrations, ...context });
    this.conflictingMigrations = conflictingMigrations;
  }
}

module.exports = {
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
};
