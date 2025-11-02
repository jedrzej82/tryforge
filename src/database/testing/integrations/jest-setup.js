/**
 * Jest Setup for Database Testing
 *
 * Automatically configures Jest for database testing with TryForge utilities
 */

const DatabaseTestManager = require('../test-manager');
const FixtureManager = require('../fixture-manager');
const TestDataFactory = require('../data-factory');
const DatabaseAssertions = require('../assertions');
const testConfig = require('../test-config');

// Global instances
let testManager;
let fixtureManager;
let dataFactory;
let assertions;
let testDatabase;

/**
 * Setup before all tests
 */
beforeAll(async () => {
  const config = testConfig.getConfig();

  // Initialize test manager
  testManager = new DatabaseTestManager(config.testDatabase.postgres);
  await testManager.initialize();

  // Wait for database to be ready
  await testManager.waitForDatabase();

  // Create test database
  testDatabase = await testManager.createTestDatabase('jest-tests');

  // Initialize other utilities
  fixtureManager = new FixtureManager({
    connection: testDatabase.connection,
    fixturesPath: config.fixtures.path
  });

  dataFactory = new TestDataFactory(config.factory);

  assertions = new DatabaseAssertions(testDatabase.connection);

  // Run migrations if configured
  if (config.migrations.runBeforeTests && config.migrations.migrate) {
    await config.migrations.migrate(testDatabase.connection);
  }

  // Make utilities available globally
  global.testDb = testDatabase.connection;
  global.testManager = testManager;
  global.fixtureManager = fixtureManager;
  global.dataFactory = dataFactory;
  global.dbAssert = assertions;

  console.log(`Test database created: ${testDatabase.name}`);
}, 60000); // 60 second timeout for setup

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  const config = testConfig.getConfig();

  if (testDatabase && config.options.dropAfterTest) {
    await testManager.destroyTestDatabase(testDatabase.name);
    console.log(`Test database destroyed: ${testDatabase.name}`);
  }

  // Cleanup test manager
  if (testManager) {
    await testManager.cleanup();
  }
}, 30000); // 30 second timeout for cleanup

/**
 * Setup before each test
 */
beforeEach(async () => {
  const config = testConfig.getConfig();

  if (config.options.runInTransaction) {
    // Start transaction - will be rolled back in afterEach
    global.testTransaction = await testDb.query('BEGIN');
  } else if (config.options.cleanBetweenSuites) {
    // Clean database between tests
    await testManager.resetDatabase(testDatabase.name);
  }
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  const config = testConfig.getConfig();

  if (config.options.runInTransaction && global.testTransaction) {
    // Rollback transaction
    await testDb.query('ROLLBACK');
    global.testTransaction = null;
  }

  // Clear loaded fixtures
  fixtureManager.clearLoadedFixtures();

  // Reset data factory sequences
  dataFactory.resetAllSequences();
});

/**
 * Custom Jest matchers for database testing
 */
expect.extend({
  /**
   * Assert record exists in database
   */
  async toExistInDatabase(tableName, conditions) {
    try {
      await assertions.assertRecordExists(tableName, conditions);
      return {
        pass: true,
        message: () => `Expected record not to exist in ${tableName}`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => error.message
      };
    }
  },

  /**
   * Assert record does not exist in database
   */
  async toNotExistInDatabase(tableName, conditions) {
    try {
      await assertions.assertRecordNotExists(tableName, conditions);
      return {
        pass: true,
        message: () => `Expected record to exist in ${tableName}`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => error.message
      };
    }
  },

  /**
   * Assert table has specific row count
   */
  async toHaveCount(tableName, expectedCount) {
    try {
      await assertions.assertCount(tableName, expectedCount);
      return {
        pass: true,
        message: () => `Expected ${tableName} not to have ${expectedCount} records`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => error.message
      };
    }
  },

  /**
   * Assert table is empty
   */
  async toBeEmptyTable(tableName) {
    try {
      await assertions.assertTableEmpty(tableName);
      return {
        pass: true,
        message: () => `Expected ${tableName} not to be empty`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => error.message
      };
    }
  },

  /**
   * Assert column has specific value
   */
  async toHaveColumnValue(tableName, id, column, expectedValue) {
    try {
      await assertions.assertColumnValue(tableName, id, column, expectedValue);
      return {
        pass: true,
        message: () => `Expected ${column} not to be ${expectedValue}`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => error.message
      };
    }
  }
});

/**
 * Helper functions available in tests
 */
global.testHelpers = {
  /**
   * Create test user
   */
  async createUser(overrides = {}) {
    const userData = dataFactory.generateUser(overrides);
    const result = await testDb.query(
      `INSERT INTO users (email, username, first_name, last_name, name, password, role, is_active, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userData.email,
        userData.username,
        userData.firstName,
        userData.lastName,
        userData.name,
        userData.password,
        userData.role,
        userData.isActive,
        userData.emailVerified,
        userData.createdAt,
        userData.updatedAt
      ]
    );
    return result.rows[0];
  },

  /**
   * Create test product
   */
  async createProduct(overrides = {}) {
    const productData = dataFactory.generateProduct(overrides);
    const result = await testDb.query(
      `INSERT INTO products (name, slug, description, price, sku, stock, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        productData.name,
        productData.slug,
        productData.description,
        productData.price,
        productData.sku,
        productData.stock,
        productData.isActive,
        productData.createdAt,
        productData.updatedAt
      ]
    );
    return result.rows[0];
  },

  /**
   * Load fixtures
   */
  async loadFixtures(fixtureName) {
    return await fixtureManager.loadFixtures(fixtureName);
  },

  /**
   * Clean database
   */
  async cleanDatabase() {
    await testManager.resetDatabase(testDatabase.name);
  },

  /**
   * Get row count
   */
  async getRowCount(tableName) {
    const result = await testDb.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  }
};

// Export for use in tests
module.exports = {
  testManager,
  fixtureManager,
  dataFactory,
  assertions,
  testDatabase
};
