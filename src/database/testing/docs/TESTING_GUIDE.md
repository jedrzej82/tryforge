# TryForge Database Testing Guide

Complete guide to database testing with TryForge utilities.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Test Manager](#test-manager)
3. [Fixtures](#fixtures)
4. [Data Factory](#data-factory)
5. [Assertions](#assertions)
6. [Snapshots](#snapshots)
7. [Test Helpers](#test-helpers)
8. [Jest Integration](#jest-integration)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Getting Started

### Installation

The database testing utilities are included with TryForge. Install the optional faker dependency for enhanced data generation:

```bash
npm install --save-dev @faker-js/faker
```

### Basic Setup

```javascript
const { DatabaseTestManager, FixtureManager, TestDataFactory } = require('../src/database/testing');

let testManager;
let testDatabase;

beforeAll(async () => {
  testManager = new DatabaseTestManager();
  await testManager.initialize();
  testDatabase = await testManager.createTestDatabase('my-tests');
});

afterAll(async () => {
  await testManager.destroyTestDatabase(testDatabase.name);
  await testManager.cleanup();
});
```

---

## Test Manager

The `DatabaseTestManager` handles test database lifecycle.

### Creating Test Databases

```javascript
const testManager = new DatabaseTestManager({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  user: 'test_user',
  password: 'test_password'
});

await testManager.initialize();

// Create isolated test database
const testDb = await testManager.createTestDatabase('user-tests');
console.log(testDb.name); // test_user_tests_abc123
console.log(testDb.connection); // Database connection pool
```

### Resetting Database

```javascript
// Truncate all tables but keep schema
await testManager.resetDatabase(testDb.name);
```

### Running in Transactions

```javascript
// Test runs in transaction, automatically rolled back
await testManager.runInTransaction(testDb.connection, async (client) => {
  // Perform database operations
  await client.query('INSERT INTO users ...');

  // Transaction will rollback after this function
});
```

### Cleanup

```javascript
// Destroy specific database
await testManager.destroyTestDatabase(testDb.name);

// Cleanup all test databases
await testManager.cleanup();

// Cleanup orphaned databases from previous runs
await testManager.cleanupOrphanedDatabases();
```

---

## Fixtures

Fixtures provide predefined test data loaded from files.

### Loading Fixtures

```javascript
const fixtureManager = new FixtureManager({
  connection: testDb.connection,
  fixturesPath: './src/database/testing/fixtures'
});

// Load from JSON file
const fixtures = await fixtureManager.loadFixtures('users.json');
console.log(fixtures.users); // Array of inserted users
```

### Fixture File Format

**users.json:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Creating Fixtures Programmatically

```javascript
// Create single fixture
const user = await fixtureManager.createFixture('users', {
  email: 'test@example.com',
  name: 'Test User'
});

// Create multiple fixtures
const users = await fixtureManager.createMany('users', 5, {
  role: 'user'
});

// Create with relationships
const user = await fixtureManager.createWithRelations('users', {
  email: 'test@example.com'
}, {
  profile: {
    table: 'profiles',
    data: { bio: 'Test bio' },
    foreignKey: 'user_id'
  }
});
```

### Fixture Traits

```javascript
// Define traits
fixtureManager.defineTrait('users', 'admin', {
  role: 'admin',
  email_verified: true
});

fixtureManager.defineTrait('users', 'inactive', {
  is_active: false
});

// Use traits
const admin = await fixtureManager.createFixture('users', {
  email: 'admin@test.com'
}, ['admin']);

const inactiveAdmin = await fixtureManager.createFixture('users', {
  email: 'inactive@test.com'
}, ['admin', 'inactive']);
```

### Fixture Defaults

```javascript
// Set defaults for a table
fixtureManager.defineDefaults('users', {
  role: 'user',
  is_active: true,
  email_verified: false
});

// Defaults applied automatically
const user = await fixtureManager.createFixture('users', {
  email: 'test@example.com'
  // role: 'user' (from defaults)
  // is_active: true (from defaults)
});
```

---

## Data Factory

Generate realistic test data with `TestDataFactory`.

### Basic Usage

```javascript
const factory = new TestDataFactory();

// Generate user data
const userData = factory.generateUser();
console.log(userData);
// {
//   email: 'john.doe@example.com',
//   username: 'johndoe123',
//   firstName: 'John',
//   lastName: 'Doe',
//   password: '...',
//   role: 'user',
//   ...
// }
```

### Generating Different Types

```javascript
// Users
const user = factory.generateUser();
const admin = factory.generateAdminUser();

// Products
const product = factory.generateProduct();

// Orders
const order = factory.generateOrder();

// Addresses
const address = factory.generateAddress();

// Posts
const post = factory.generatePost();

// Reviews
const review = factory.generateReview();
```

### Overriding Values

```javascript
const user = factory.generateUser({
  email: 'custom@example.com',
  role: 'admin',
  emailVerified: true
});
```

### Primitive Generators

```javascript
// Email
const email = factory.generateEmail('john', 'doe');

// Names
const firstName = factory.generateFirstName();
const lastName = factory.generateLastName();

// Numbers
const price = factory.generatePrice(10, 100);
const integer = factory.generateInteger(1, 10);

// Text
const slug = factory.generateSlug('My Product Name');
const text = factory.generateText(100, 500);

// Dates
const date = factory.generateDate(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// UUIDs
const uuid = factory.generateUUID();
```

### Seeded Data

```javascript
// Use same seed for reproducible data
const factory1 = new TestDataFactory({ seed: 12345 });
const factory2 = new TestDataFactory({ seed: 12345 });

// These will generate identical data
const user1 = factory1.generateUser();
const user2 = factory2.generateUser();
```

---

## Assertions

Custom assertions for database testing.

### Basic Assertions

```javascript
const assertions = new DatabaseAssertions(connection);

// Assert record exists
await assertions.assertRecordExists('users', {
  email: 'test@example.com'
});

// Assert record doesn't exist
await assertions.assertRecordNotExists('users', {
  email: 'deleted@example.com'
});

// Assert count
await assertions.assertCount('users', 5);
await assertions.assertMinCount('users', 3);

// Assert table empty
await assertions.assertTableEmpty('users');
await assertions.assertTableNotEmpty('users');
```

### Column Assertions

```javascript
// Assert column value
await assertions.assertColumnValue('users', userId, 'email', 'test@example.com');

// Assert column exists
await assertions.assertColumnExists('users', 'email');
```

### Relationship Assertions

```javascript
// Assert has relations
await assertions.assertHasRelation(
  'users',           // Table
  userId,            // Record ID
  'posts',           // Related table
  'user_id',         // Foreign key
  5                  // Expected count (optional)
);
```

### Structure Assertions

```javascript
// Assert tables have same structure
await assertions.assertSameStructure('users', 'users_backup');

// Assert index exists
await assertions.assertIndexExists('users', 'users_email_idx');

// Assert unique constraint
await assertions.assertUniqueConstraint('users', 'email');
```

---

## Snapshots

Save and restore database state with snapshots.

### Creating Snapshots

```javascript
const snapshotManager = new SnapshotManager({
  connection: testDb.connection,
  snapshotsPath: './snapshots'
});

// Save current database state
await snapshotManager.saveSnapshot('baseline', {
  includeSchema: true
});

// Save specific tables
await snapshotManager.saveSnapshot('users-only', {
  tables: ['users', 'profiles']
});
```

### Restoring Snapshots

```javascript
// Restore from snapshot
await snapshotManager.restoreSnapshot('baseline');

// Restore specific tables
await snapshotManager.restoreSnapshot('baseline', {
  tables: ['users'],
  clearExisting: true
});
```

### Comparing Snapshots

```javascript
const diff = await snapshotManager.compareSnapshots('before', 'after');

console.log(diff);
// {
//   snapshot1: 'before',
//   snapshot2: 'after',
//   tables: {
//     users: {
//       hasChanges: true,
//       added: 5,
//       removed: 2,
//       modified: 3
//     }
//   }
// }
```

### Managing Snapshots

```javascript
// List all snapshots
const snapshots = await snapshotManager.listSnapshots();

// Get snapshot info
const info = await snapshotManager.getSnapshotInfo('baseline');

// Delete snapshot
await snapshotManager.deleteSnapshot('old-snapshot');
```

---

## Test Helpers

Utility functions for common test operations.

### Helper Functions

```javascript
const { createTestUser, createTestUsers, cleanDatabase } = require('./test-helpers');

// Create test users
const user = await createTestUser(connection, {
  email: 'test@example.com'
});

const users = await createTestUsers(connection, 10);

// Clean database
await cleanDatabase(connection);

// Seed database
await seedDatabase(connection, ['users', 'products']);

// Wait for database
await waitForDatabase();

// Get table info
const count = await getTableRowCount(connection, 'users');
const tables = await getAllTableNames(connection);
const exists = await tableExists(connection, 'users');
```

### Creating Test Data Bundles

```javascript
const bundle = await createTestDataBundle(connection, {
  users: 5,
  products: 10,
  orders: 3
});

console.log(bundle);
// {
//   users: [...],
//   products: [...],
//   orders: [...]
// }
```

---

## Jest Integration

Automatic setup for Jest tests.

### Setup File

**jest.config.js:**
```javascript
module.exports = {
  setupFilesAfterEnv: ['./src/database/testing/integrations/jest-setup.js']
};
```

### Using in Tests

```javascript
describe('User Tests', () => {
  it('should create user', async () => {
    // Global utilities available
    const user = await testHelpers.createUser({
      email: 'test@example.com'
    });

    expect(user.id).toBeDefined();

    // Custom matchers
    await expect('users').toHaveCount(1);
    await expect('users').toExistInDatabase({ email: 'test@example.com' });
  });

  it('should use data factory', async () => {
    // Global dataFactory available
    const userData = dataFactory.generateUser();

    // Global testDb connection available
    const result = await testDb.query('INSERT INTO users ...');
  });

  it('should load fixtures', async () => {
    // Global fixtureManager available
    await testHelpers.loadFixtures('users');

    await expect('users').toHaveCount(5);
  });
});
```

### Custom Matchers

```javascript
// Assert record exists
await expect('users').toExistInDatabase({ email: 'test@example.com' });

// Assert record doesn't exist
await expect('users').toNotExistInDatabase({ email: 'deleted@example.com' });

// Assert count
await expect('users').toHaveCount(5);

// Assert empty
await expect('temp_table').toBeEmptyTable();

// Assert column value
await expect('users').toHaveColumnValue(userId, 'email', 'test@example.com');
```

---

## Best Practices

### 1. Isolate Tests

```javascript
// Use separate databases for each test suite
beforeAll(async () => {
  testDb = await testManager.createTestDatabase('user-tests');
});

// Reset between tests
beforeEach(async () => {
  await testManager.resetDatabase(testDb.name);
});
```

### 2. Use Transactions for Speed

```javascript
// Faster than truncating
beforeEach(async () => {
  await testDb.query('BEGIN');
});

afterEach(async () => {
  await testDb.query('ROLLBACK');
});
```

### 3. Use Fixtures for Complex Data

```javascript
// Instead of creating data in each test
beforeEach(async () => {
  await fixtureManager.loadFixtures('base-data');
});
```

### 4. Use Factory for Variations

```javascript
// Generate variations easily
const activeUser = factory.generateUser({ isActive: true });
const inactiveUser = factory.generateUser({ isActive: false });
```

### 5. Clean Up Resources

```javascript
afterAll(async () => {
  await testManager.destroyTestDatabase(testDb.name);
  await testManager.cleanup();
});
```

### 6. Use Meaningful Test Data

```javascript
// Good
const admin = factory.generateUser({
  email: 'admin@test.com',
  role: 'admin'
});

// Avoid magic values
const user = factory.generateUser({
  email: 'a@b.com', // Not descriptive
  role: 'x'         // What is 'x'?
});
```

### 7. Test Edge Cases

```javascript
it('should handle empty database', async () => {
  await assertions.assertTableEmpty('users');
});

it('should handle large datasets', async () => {
  const users = await createTestUsers(connection, 1000);
  await assertions.assertCount('users', 1000);
});
```

---

## Examples

### Complete Test Suite

```javascript
const {
  DatabaseTestManager,
  FixtureManager,
  TestDataFactory
} = require('../src/database/testing');

describe('E-commerce Tests', () => {
  let testManager, testDb, fixtureManager, factory;

  beforeAll(async () => {
    testManager = new DatabaseTestManager();
    await testManager.initialize();
    testDb = await testManager.createTestDatabase('ecommerce');

    fixtureManager = new FixtureManager({ connection: testDb.connection });
    factory = new TestDataFactory();
  });

  afterAll(async () => {
    await testManager.destroyTestDatabase(testDb.name);
    await testManager.cleanup();
  });

  beforeEach(async () => {
    await testManager.resetDatabase(testDb.name);
  });

  describe('Order Creation', () => {
    beforeEach(async () => {
      await fixtureManager.loadFixtures('users');
      await fixtureManager.loadFixtures('products');
    });

    it('should create order with items', async () => {
      const orderData = factory.generateOrder();

      const result = await testDb.connection.query(
        'INSERT INTO orders (...) VALUES (...) RETURNING *',
        [...]
      );

      expect(result.rows[0].id).toBeDefined();
    });
  });
});
```

### Using Generators

```javascript
const { UserGenerator, ProductGenerator } = require('../src/database/testing');

const userGen = new UserGenerator();
const productGen = new ProductGenerator();

// Generate team
const team = userGen.generateTeam(10);
console.log(team.admin);
console.log(team.moderators); // Array of moderators
console.log(team.users);      // Array of users

// Generate catalog
const catalog = productGen.generateCatalog(50);
console.log(catalog.featured);
console.log(catalog.onSale);
console.log(catalog.new);
```

---

## Troubleshooting

### Database Connection Issues

```javascript
// Wait for database to be ready
await testManager.waitForDatabase(10, 1000);
```

### Cleanup Orphaned Databases

```javascript
// List test databases
const dbs = await testManager.listTestDatabases();

// Cleanup orphaned
await testManager.cleanupOrphanedDatabases();
```

### Fixture Loading Errors

```javascript
// Check fixture file exists
const fixtures = await fixtureManager.listFixtures();
console.log('Available fixtures:', fixtures);
```

---

## Configuration

See `test-config.js` for all configuration options:

- Database connections
- Test execution options
- Fixture settings
- Snapshot settings
- Logging settings
- Performance tuning

---

## Additional Resources

- [PostgreSQL Testing Best Practices](https://www.postgresql.org/docs/current/regress.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Faker.js Documentation](https://fakerjs.dev/)

---

**Happy Testing!** 🧪
