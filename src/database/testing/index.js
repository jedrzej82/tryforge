/**
 * TryForge Database Testing Utilities
 *
 * Comprehensive testing tools for database operations
 */

const DatabaseTestManager = require('./test-manager');
const FixtureManager = require('./fixture-manager');
const TestDataFactory = require('./data-factory');
const DatabaseAssertions = require('./assertions');
const SnapshotManager = require('./snapshot-manager');
const testHelpers = require('./test-helpers');
const testConfig = require('./test-config');

// Generators
const UserGenerator = require('./generators/user-generator');
const ProductGenerator = require('./generators/product-generator');

module.exports = {
  // Core classes
  DatabaseTestManager,
  FixtureManager,
  TestDataFactory,
  DatabaseAssertions,
  SnapshotManager,

  // Generators
  UserGenerator,
  ProductGenerator,

  // Helpers
  ...testHelpers,

  // Configuration
  testConfig,

  // Convenience functions
  createTestManager: (config) => new DatabaseTestManager(config),
  createFixtureManager: (config) => new FixtureManager(config),
  createDataFactory: (config) => new TestDataFactory(config),
  createAssertions: (connection) => new DatabaseAssertions(connection),
  createSnapshotManager: (config) => new SnapshotManager(config),
  createUserGenerator: (config) => new UserGenerator(config),
  createProductGenerator: (config) => new ProductGenerator(config)
};
