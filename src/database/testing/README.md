# TryForge Database Testing Utilities

Comprehensive database testing framework for TryForge applications.

## Features

- **Test Database Management** - Create, reset, and destroy isolated test databases
- **Fixture Management** - Load and manage test data from files or code
- **Data Factories** - Generate realistic test data with Faker.js integration
- **Custom Assertions** - Database-specific assertion helpers
- **Snapshots** - Save and restore database state
- **Transaction Support** - Run tests in transactions with automatic rollback
- **Jest Integration** - Seamless integration with Jest testing framework
- **Specialized Generators** - User and Product data generators with advanced features

## Quick Start

```javascript
const { DatabaseTestManager, FixtureManager, TestDataFactory } = require('./src/database/testing');

// Create test database
const testManager = new DatabaseTestManager();
await testManager.initialize();
const testDb = await testManager.createTestDatabase('my-tests');

// Load fixtures
const fixtureManager = new FixtureManager({ connection: testDb.connection });
await fixtureManager.loadFixtures('users.json');

// Generate test data
const factory = new TestDataFactory();
const userData = factory.generateUser({
  email: 'test@example.com',
  role: 'admin'
});
```

## Directory Structure

```
src/database/testing/
├── README.md                      # This file
├── index.js                       # Main exports
├── test-manager.js                # Database lifecycle management
├── fixture-manager.js             # Fixture loading and management
├── data-factory.js                # Test data generation
├── assertions.js                  # Custom database assertions
├── snapshot-manager.js            # Database snapshot management
├── test-helpers.js                # Utility functions
├── test-config.js                 # Configuration
├── fixtures/                      # Test fixtures
│   ├── users.json                 # User fixtures
│   └── products.json              # Product fixtures
├── generators/                    # Specialized generators
│   ├── user-generator.js          # User data generator
│   └── product-generator.js       # Product data generator
├── integrations/                  # Testing framework integrations
│   └── jest-setup.js              # Jest setup file
├── examples/                      # Example tests
│   └── user.test.js               # User model test example
├── snapshots/                     # Database snapshots
└── docs/                          # Documentation
    └── TESTING_GUIDE.md           # Comprehensive guide
```

## Core Components

### DatabaseTestManager

Manages test database lifecycle:

```javascript
const testManager = new DatabaseTestManager(config);
await testManager.initialize();

// Create isolated test database
const testDb = await testManager.createTestDatabase('user-tests');

// Reset database (truncate all tables)
await testManager.resetDatabase(testDb.name);

// Run in transaction (auto-rollback)
await testManager.runInTransaction(testDb.connection, async (client) => {
  // Your test code
});

// Cleanup
await testManager.destroyTestDatabase(testDb.name);
```

### FixtureManager

Load and manage test fixtures:

```javascript
const fixtureManager = new FixtureManager({ connection });

// Load from file
await fixtureManager.loadFixtures('users.json');

// Create programmatically
await fixtureManager.createFixture('users', {
  email: 'test@example.com'
});

// Create with traits
await fixtureManager.createFixture('users', {
  email: 'admin@example.com'
}, ['admin', 'verified']);

// Create with relationships
await fixtureManager.createWithRelations('posts', {
  title: 'Test Post'
}, {
  author: {
    table: 'users',
    data: { email: 'author@example.com' }
  }
});
```

### TestDataFactory

Generate realistic test data:

```javascript
const factory = new TestDataFactory();

// Generate users
const user = factory.generateUser();
const admin = factory.generateAdminUser();

// Generate products
const product = factory.generateProduct();
const featured = factory.generateProduct({ isFeatured: true });

// Generate other entities
const order = factory.generateOrder();
const address = factory.generateAddress();
const review = factory.generateReview();

// Use seeded data for reproducibility
const seededFactory = new TestDataFactory({ seed: 12345 });
```

### DatabaseAssertions

Custom assertions for database testing:

```javascript
const assertions = new DatabaseAssertions(connection);

// Assert existence
await assertions.assertRecordExists('users', { email: 'test@example.com' });
await assertions.assertRecordNotExists('users', { email: 'deleted@example.com' });

// Assert counts
await assertions.assertCount('users', 5);
await assertions.assertTableEmpty('temp_table');

// Assert values
await assertions.assertColumnValue('users', userId, 'role', 'admin');

// Assert relationships
await assertions.assertHasRelation('users', userId, 'posts', 'user_id', 5);
```

### SnapshotManager

Save and restore database state:

```javascript
const snapshotManager = new SnapshotManager({ connection });

// Save snapshot
await snapshotManager.saveSnapshot('baseline');

// Restore snapshot
await snapshotManager.restoreSnapshot('baseline');

// Compare snapshots
const diff = await snapshotManager.compareSnapshots('before', 'after');

// List snapshots
const snapshots = await snapshotManager.listSnapshots();
```

## Specialized Generators

### UserGenerator

Generate user data with advanced features:

```javascript
const { UserGenerator } = require('./src/database/testing');

const userGen = new UserGenerator();

// Generate users
const user = userGen.generate();
const admin = userGen.generateAdmin();
const verified = userGen.generateVerified();

// Generate with relationships
const withPosts = userGen.generateWithPosts(5);
const withOrders = userGen.generateWithOrders(3);
const complete = userGen.generateComplete({
  posts: 5,
  addresses: 2,
  orders: 3
});

// Generate teams
const team = userGen.generateTeam(10);
// { admin: {...}, moderators: [...], users: [...] }

// Generate cohorts
const cohort = userGen.generateCohort(
  100,
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
```

### ProductGenerator

Generate product data with advanced features:

```javascript
const { ProductGenerator } = require('./src/database/testing');

const productGen = new ProductGenerator();

// Generate products
const product = productGen.generate();
const featured = productGen.generateFeatured();
const onSale = productGen.generateOnSale();

// Generate with relationships
const withVariants = productGen.generateWithVariants(3);
const withReviews = productGen.generateWithReviews(10);
const complete = productGen.generateComplete({
  variants: 3,
  categories: 2,
  reviews: 10,
  images: 4
});

// Generate catalogs
const catalog = productGen.generateCatalog(50);
// { featured: [...], new: [...], onSale: [...], regular: [...] }

// Generate by price range
const byPrice = productGen.generateByPriceRange({
  budget: 5,
  midRange: 10,
  premium: 5,
  luxury: 2
});
```

## Jest Integration

Add to `jest.config.js`:

```javascript
module.exports = {
  setupFilesAfterEnv: ['./src/database/testing/integrations/jest-setup.js']
};
```

Use in tests:

```javascript
describe('User Tests', () => {
  it('should create user', async () => {
    // Global utilities available
    const user = await testHelpers.createUser({
      email: 'test@example.com'
    });

    // Custom matchers
    await expect('users').toHaveCount(1);
    await expect('users').toExistInDatabase({ email: 'test@example.com' });
  });
});
```

## Configuration

Configure in `test-config.js`:

```javascript
module.exports = {
  testDatabase: {
    postgres: { /* config */ }
  },
  options: {
    dropAfterTest: true,
    runInTransaction: false,
    isolateTests: true
  },
  fixtures: {
    path: './fixtures',
    autoLoad: false
  }
};
```

Or use environment variables:

```bash
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=test_db
TEST_DB_USER=test_user
TEST_DB_PASSWORD=test_password
TEST_DROP_DB=true
TEST_USE_TRANSACTIONS=true
TEST_LOG_QUERIES=true
```

## Test Helpers

Convenient helper functions:

```javascript
const {
  createTestUser,
  createTestUsers,
  createTestProduct,
  cleanDatabase,
  seedDatabase,
  waitForDatabase,
  getTableRowCount,
  tableExists
} = require('./src/database/testing');

// Create test data
const user = await createTestUser(connection, { role: 'admin' });
const users = await createTestUsers(connection, 10);

// Database operations
await cleanDatabase(connection);
await seedDatabase(connection, ['users', 'products']);

// Inspection
const count = await getTableRowCount(connection, 'users');
const exists = await tableExists(connection, 'users');
```

## Examples

See `examples/` directory for complete test examples:

- `user.test.js` - User model testing example

## Best Practices

1. **Isolate Tests** - Use separate databases or transactions
2. **Reset Between Tests** - Clean state for each test
3. **Use Fixtures** - For complex, repeatable test data
4. **Use Factories** - For varied, randomized test data
5. **Clean Up** - Always destroy test databases
6. **Use Transactions** - For faster test execution
7. **Test Edge Cases** - Empty databases, large datasets, etc.

## Documentation

See `docs/TESTING_GUIDE.md` for comprehensive documentation covering:

- Getting started
- All components in detail
- Advanced usage patterns
- Best practices
- Troubleshooting
- Complete examples

## Dependencies

Required:
- `pg` - PostgreSQL driver
- `winston` - Logging

Optional:
- `@faker-js/faker` - Enhanced data generation (highly recommended)

## License

MIT
