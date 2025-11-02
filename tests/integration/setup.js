/**
 * Integration Test Setup
 *
 * Global setup for integration tests including database initialization,
 * migrations, seeding, and cleanup.
 */

const { DatabaseTestManager } = require('../../src/database/testing');
const { SeedManager } = require('../../src/database/seeding');
const { MigrationManager } = require('../../src/database');

let testDatabase;
let testManager;
let seedManager;
let migrationManager;

/**
 * Setup before all integration tests
 */
beforeAll(async () => {
  console.log('\n🔧 Setting up integration test environment...\n');

  try {
    // Create test database manager
    testManager = new DatabaseTestManager({
      type: 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || 5432,
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
      database: process.env.TEST_DB_NAME || 'tryforge_test',
      prefix: 'integration_test_'
    });

    // Initialize and wait for database
    await testManager.initialize();
    await testManager.waitForDatabase();

    // Create test database
    testDatabase = await testManager.createTestDatabase('integration-tests');
    console.log(`✅ Test database created: ${testDatabase.name}\n`);

    // Initialize migration manager
    migrationManager = new MigrationManager({
      databaseType: 'postgresql',
      connection: testDatabase.connection,
      migrationsDirectory: process.env.MIGRATIONS_DIR || './migrations'
    });

    // Run migrations
    console.log('🔄 Running migrations...');
    await migrationManager.initialize();

    // Check if migrations exist and run them
    const status = await migrationManager.status();
    if (status.pending.length > 0) {
      await migrationManager.migrate();
      console.log('✅ Migrations completed\n');
    } else {
      console.log('ℹ️  No pending migrations\n');
    }

    // Initialize seed manager
    seedManager = new SeedManager({
      db: testDatabase.connection,
      environment: 'test'
    });

    // Seed test data
    console.log('🌱 Seeding test data...');
    await seedManager.initialize();
    await seedManager.runAll({
      skipIfExists: true,
      continueOnError: true
    });
    console.log('✅ Test data seeded\n');

    // Make utilities available globally
    global.testDb = testDatabase.connection;
    global.testManager = testManager;
    global.testDatabase = testDatabase;
    global.seedManager = seedManager;
    global.migrationManager = migrationManager;

    console.log('✅ Integration test environment ready!\n');
  } catch (error) {
    console.error('❌ Failed to set up test environment:', error.message);
    throw error;
  }
}, 60000); // 60 second timeout for setup

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  console.log('\n🧹 Cleaning up integration test environment...\n');

  try {
    if (testDatabase && testManager) {
      // Close database connection
      await testDatabase.connection.end();

      // Destroy test database
      await testManager.destroyTestDatabase(testDatabase.name);
      console.log(`✅ Test database destroyed: ${testDatabase.name}`);
    }

    // Cleanup test manager
    if (testManager) {
      await testManager.cleanup();
    }

    // Close migration manager
    if (migrationManager) {
      await migrationManager.close();
    }

    console.log('✅ Cleanup complete\n');
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error.message);
  }
}, 30000); // 30 second timeout for cleanup

/**
 * Setup before each test
 */
beforeEach(async () => {
  // Clean database between tests to ensure test isolation
  if (testDatabase && testManager) {
    try {
      await testManager.resetDatabase(testDatabase.name);
    } catch (error) {
      console.warn('⚠️  Warning: Failed to reset database:', error.message);
    }
  }
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  // Additional cleanup if needed
  // This runs after each individual test
});

/**
 * Helper functions available in all tests
 */
global.testHelpers = {
  /**
   * Get a fresh database connection
   */
  async getConnection() {
    return global.testDb;
  },

  /**
   * Execute raw SQL query
   */
  async query(sql, params = []) {
    return await global.testDb.query(sql, params);
  },

  /**
   * Reset database to clean state
   */
  async resetDatabase() {
    await testManager.resetDatabase(testDatabase.name);
  },

  /**
   * Run in transaction and rollback
   */
  async runInTransaction(fn) {
    return await testManager.runInTransaction(testDatabase.name, fn);
  },

  /**
   * Wait for async operation
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

module.exports = {
  testManager,
  testDatabase,
  seedManager,
  migrationManager
};
