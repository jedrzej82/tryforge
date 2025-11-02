# Database Testing - Quick Reference

Fast reference guide for TryForge database testing utilities.

## Installation

```bash
npm install --save-dev @faker-js/faker
```

## Basic Setup

```javascript
const { DatabaseTestManager, FixtureManager, TestDataFactory } = require('./src/database/testing');

let testManager, testDb;

beforeAll(async () => {
  testManager = new DatabaseTestManager();
  await testManager.initialize();
  testDb = await testManager.createTestDatabase('tests');
});

afterAll(async () => {
  await testManager.destroyTestDatabase(testDb.name);
  await testManager.cleanup();
});

beforeEach(async () => {
  await testManager.resetDatabase(testDb.name);
});
```

## Test Manager

```javascript
// Create database
const testDb = await testManager.createTestDatabase('my-tests');

// Reset database
await testManager.resetDatabase(testDb.name);

// Run in transaction
await testManager.runInTransaction(testDb.connection, async (client) => {
  // Test code - auto rollback
});

// Destroy database
await testManager.destroyTestDatabase(testDb.name);

// Cleanup all
await testManager.cleanup();
```

## Fixtures

```javascript
const fixtureManager = new FixtureManager({ connection: testDb.connection });

// Load fixtures
await fixtureManager.loadFixtures('users.json');

// Create fixture
await fixtureManager.createFixture('users', { email: 'test@example.com' });

// Create many
await fixtureManager.createMany('users', 10, { role: 'user' });

// With traits
await fixtureManager.createFixture('users', { email: 'admin@test.com' }, ['admin']);

// With relations
await fixtureManager.createWithRelations('posts', {
  title: 'Test'
}, {
  author: { table: 'users', data: { email: 'author@test.com' } }
});
```

## Data Factory

```javascript
const factory = new TestDataFactory();

// Users
factory.generateUser()
factory.generateAdminUser()

// Products
factory.generateProduct()

// Orders
factory.generateOrder()

// Addresses
factory.generateAddress()

// Reviews
factory.generateReview()

// Primitives
factory.generateEmail('john', 'doe')
factory.generatePrice(10, 100)
factory.generateInteger(1, 10)
factory.generateSlug('Product Name')
factory.generateUUID()
```

## Assertions

```javascript
const assertions = new DatabaseAssertions(connection);

// Existence
await assertions.assertRecordExists('users', { email: 'test@example.com' });
await assertions.assertRecordNotExists('users', { email: 'deleted@example.com' });

// Counts
await assertions.assertCount('users', 5);
await assertions.assertMinCount('users', 3);
await assertions.assertTableEmpty('temp');
await assertions.assertTableNotEmpty('users');

// Values
await assertions.assertColumnValue('users', userId, 'role', 'admin');

// Relations
await assertions.assertHasRelation('users', userId, 'posts', 'user_id', 5);

// Structure
await assertions.assertColumnExists('users', 'email');
await assertions.assertIndexExists('users', 'users_email_idx');
await assertions.assertSameStructure('users', 'users_backup');
```

## Snapshots

```javascript
const snapshotManager = new SnapshotManager({ connection });

// Save
await snapshotManager.saveSnapshot('baseline');

// Restore
await snapshotManager.restoreSnapshot('baseline');

// Compare
const diff = await snapshotManager.compareSnapshots('before', 'after');

// List
const snapshots = await snapshotManager.listSnapshots();

// Delete
await snapshotManager.deleteSnapshot('old');
```

## Generators

### User Generator

```javascript
const { UserGenerator } = require('./src/database/testing');
const userGen = new UserGenerator();

userGen.generate()
userGen.generateAdmin()
userGen.generateVerified()
userGen.generateWithPosts(5)
userGen.generateWithOrders(3)
userGen.generateComplete({ posts: 5, addresses: 2, orders: 3 })
userGen.generateTeam(10)
```

### Product Generator

```javascript
const { ProductGenerator } = require('./src/database/testing');
const productGen = new ProductGenerator();

productGen.generate()
productGen.generateFeatured()
productGen.generateOnSale()
productGen.generateWithVariants(3)
productGen.generateWithReviews(10)
productGen.generateComplete({ variants: 3, reviews: 10, images: 4 })
productGen.generateCatalog(50)
```

## Test Helpers

```javascript
const { createTestUser, cleanDatabase } = require('./src/database/testing');

// Create
await createTestUser(connection, { role: 'admin' });
await createTestUsers(connection, 10);
await createTestProduct(connection, { price: 99.99 });

// Database
await cleanDatabase(connection);
await seedDatabase(connection, ['users', 'products']);
await waitForDatabase();

// Inspection
await getTableRowCount(connection, 'users');
await getAllTableNames(connection);
await tableExists(connection, 'users');
await columnExists(connection, 'users', 'email');
```

## Jest Integration

**jest.config.js:**
```javascript
module.exports = {
  setupFilesAfterEnv: ['./src/database/testing/integrations/jest-setup.js']
};
```

**In tests:**
```javascript
it('should work', async () => {
  // Globals available
  const user = await testHelpers.createUser({ email: 'test@example.com' });

  // Custom matchers
  await expect('users').toHaveCount(1);
  await expect('users').toExistInDatabase({ email: 'test@example.com' });
  await expect('users').toBeEmptyTable(); // If empty
  await expect('users').toHaveColumnValue(userId, 'role', 'admin');
});
```

## Configuration

**Environment Variables:**
```bash
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=test_db
TEST_DB_USER=test_user
TEST_DB_PASSWORD=test_password
TEST_DROP_DB=true
TEST_USE_TRANSACTIONS=true
TEST_LOG_QUERIES=true
TEST_DATA_SEED=12345
```

## Common Patterns

### Create User with Posts

```javascript
const user = await createTestUser(connection);
const factory = new TestDataFactory();

for (let i = 0; i < 5; i++) {
  const post = factory.generatePost({ authorId: user.id });
  await connection.query('INSERT INTO posts ...', [...]);
}
```

### Test with Fixtures

```javascript
beforeEach(async () => {
  await fixtureManager.loadFixtures('users');
  await fixtureManager.loadFixtures('products');
});

it('should work', async () => {
  // Users and products already loaded
});
```

### Test in Transaction

```javascript
it('should rollback', async () => {
  await testManager.runInTransaction(testDb.connection, async (client) => {
    const user = await createTestUser(client);
    // User automatically rolled back
  });
});
```

### Generate Test Data Bundle

```javascript
const bundle = await createTestDataBundle(connection, {
  users: 5,
  products: 10,
  orders: 3
});
// { users: [...], products: [...], orders: [...] }
```

## Seeded Data

```javascript
// Reproducible data
const factory = new TestDataFactory({ seed: 12345 });
const user1 = factory.generateUser();

const factory2 = new TestDataFactory({ seed: 12345 });
const user2 = factory2.generateUser();
// user1 === user2
```

## Available Fixtures

- `users.json` - 5 users (admin, user, moderator, unverified, inactive)
- `products.json` - 10 products (laptops, accessories, etc.)
- `categories.json` - 8 categories (hierarchical)
- `orders.json` - 5 orders (various states)

## Troubleshooting

```javascript
// Wait for database
await testManager.waitForDatabase(10, 1000);

// List test databases
const dbs = await testManager.listTestDatabases();

// Cleanup orphaned
await testManager.cleanupOrphanedDatabases();

// List fixtures
const fixtures = await fixtureManager.listFixtures();
```

## Full Example

```javascript
const { DatabaseTestManager, FixtureManager, TestDataFactory } = require('./src/database/testing');

describe('User Tests', () => {
  let testManager, testDb, fixtureManager, factory;

  beforeAll(async () => {
    testManager = new DatabaseTestManager();
    await testManager.initialize();
    testDb = await testManager.createTestDatabase('user-tests');
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

  it('should create user', async () => {
    const userData = factory.generateUser({ email: 'test@example.com' });
    const result = await testDb.connection.query(
      'INSERT INTO users (...) VALUES (...) RETURNING *',
      [...]
    );
    expect(result.rows[0].email).toBe('test@example.com');
  });

  it('should load fixtures', async () => {
    await fixtureManager.loadFixtures('users');
    const result = await testDb.connection.query('SELECT COUNT(*) FROM users');
    expect(parseInt(result.rows[0].count)).toBe(5);
  });
});
```

---

For detailed documentation, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)
