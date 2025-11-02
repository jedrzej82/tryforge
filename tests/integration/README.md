# TryForge Integration Tests

Comprehensive integration testing framework for TryForge, testing API endpoints, database operations, and complete system workflows.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Integration Tests](#writing-integration-tests)
- [Test Patterns](#test-patterns)
- [Database Setup](#database-setup)
- [API Testing](#api-testing)
- [Workflow Testing](#workflow-testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Integration tests verify that different components of TryForge work together correctly. These tests:

- Use real database connections
- Make actual HTTP requests to API endpoints
- Test complete user workflows
- Verify data persistence
- Test error handling and edge cases

**Key Features:**
- Isolated test database for each test run
- Automatic database migration and seeding
- Real HTTP requests using supertest
- Complete workflow testing
- Test data factories and fixtures
- Comprehensive assertions

## Getting Started

### Prerequisites

1. **PostgreSQL Database**
   - PostgreSQL 12+ installed and running
   - Test database access credentials

2. **Node.js**
   - Node.js 18+ installed
   - npm 9+ installed

3. **Environment Variables**

Create a `.env.test` file in the project root:

```env
# Test Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_USER=postgres
TEST_DB_PASSWORD=postgres
TEST_DB_NAME=tryforge_test

# Test Environment
NODE_ENV=test

# JWT Secret (for testing)
JWT_SECRET=test-secret-key-change-in-production

# Optional: Migration Directory
MIGRATIONS_DIR=./migrations
```

### Installation

Install dependencies including test utilities:

```bash
npm install
```

This will install:
- `jest` - Testing framework
- `supertest` - HTTP assertion library
- `jest-junit` - JUnit reporter for CI/CD

### Initial Setup

1. **Create Test Database**

```bash
# Using psql
createdb tryforge_test

# Or using SQL
psql -U postgres -c "CREATE DATABASE tryforge_test;"
```

2. **Run Migrations**

The test setup automatically runs migrations, but you can run them manually:

```bash
npm run db:migrate:test
```

3. **Verify Setup**

```bash
npm run test:integration
```

## Test Structure

```
tests/integration/
├── setup.js                    # Global test setup
├── api/                        # API endpoint tests
│   ├── auth.test.js           # Authentication endpoints
│   └── users.test.js          # User management endpoints
├── database/                   # Database operation tests
│   ├── migrations.test.js     # Migration tests
│   └── seeding.test.js        # Seeding tests
├── workflows/                  # Complete workflow tests
│   └── user-registration-workflow.test.js
└── README.md                   # This file
```

### File Naming Convention

- Test files: `*.test.js` or `*.spec.js`
- Located in `tests/integration/` subdirectories
- Organized by feature or component

## Running Tests

### All Integration Tests

```bash
npm run test:integration
```

### Specific Test Suite

```bash
# Run API tests only
npm run test:integration -- tests/integration/api

# Run specific test file
npm run test:integration -- tests/integration/api/auth.test.js

# Run specific test by name
npm run test:integration -- -t "should register a new user"
```

### Watch Mode

Automatically re-run tests on file changes:

```bash
npm run test:integration:watch
```

### With Coverage

```bash
npm run test:integration -- --coverage
```

### CI/CD Mode

```bash
npm run test:ci
```

## Writing Integration Tests

### Basic Test Structure

```javascript
/**
 * Feature Integration Tests
 *
 * Description of what this test suite covers
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Feature Integration Tests', () => {
  // Setup before each test
  beforeEach(async () => {
    // Reset database or create test data
    await global.testHelpers.resetDatabase();
  });

  // Cleanup after each test
  afterEach(async () => {
    // Additional cleanup if needed
  });

  describe('Specific functionality', () => {
    it('should perform expected behavior', async () => {
      // Arrange - Set up test data
      const testData = {
        name: 'Test Item',
        value: 123
      };

      // Act - Perform the action
      const response = await request(app)
        .post('/api/v1/items')
        .send(testData)
        .expect(201);

      // Assert - Verify the results
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testData.name);

      // Verify database state
      const result = await global.testDb.query(
        'SELECT * FROM items WHERE name = $1',
        [testData.name]
      );
      expect(result.rows.length).toBe(1);
    });
  });
});
```

### Using Test Helpers

Global test helpers are available in all tests:

```javascript
// Get database connection
const db = await global.testHelpers.getConnection();

// Execute raw SQL
const result = await global.testHelpers.query(
  'SELECT * FROM users WHERE email = $1',
  ['test@example.com']
);

// Reset database to clean state
await global.testHelpers.resetDatabase();

// Run in transaction with automatic rollback
await global.testHelpers.runInTransaction(async (client) => {
  // Your test code here
});

// Wait for async operations
await global.testHelpers.wait(1000); // Wait 1 second
```

## Test Patterns

### API Endpoint Testing

```javascript
describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User'
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(userData.email);

    // Verify in database
    const dbResult = await global.testDb.query(
      'SELECT * FROM users WHERE email = $1',
      [userData.email]
    );
    expect(dbResult.rows.length).toBe(1);
  });
});
```

### Database Testing

```javascript
describe('Migration Tests', () => {
  it('should run migrations successfully', async () => {
    const migrationManager = global.migrationManager;

    const result = await migrationManager.migrate();

    expect(result.applied.length).toBeGreaterThan(0);

    // Verify tables exist
    const tables = await global.testDb.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
    `);

    expect(tables.rows.length).toBeGreaterThan(0);
  });
});
```

### Workflow Testing

```javascript
describe('User Registration Workflow', () => {
  it('should complete full registration flow', async () => {
    // Step 1: Register
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'Pass123!' });

    const { token, user } = registerResponse.body;

    // Step 2: Verify token works
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Step 3: Update profile
    await request(app)
      .patch(`/api/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' })
      .expect(200);

    // Step 4: Logout
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Step 5: Verify token invalidated
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});
```

## Database Setup

### Automatic Setup

The test setup automatically:
1. Creates a unique test database
2. Runs all migrations
3. Seeds test data
4. Provides a clean database for each test

### Manual Database Operations

```javascript
// Reset database between tests
beforeEach(async () => {
  await global.testManager.resetDatabase(global.testDatabase.name);
});

// Run specific seeder
await global.seedManager.run('UsersSeeder');

// Run all seeders
await global.seedManager.runAll();

// Rollback seeders
await global.seedManager.rollback();
```

## API Testing

### Making Requests

```javascript
// GET request
const response = await request(app)
  .get('/api/v1/users')
  .expect(200);

// POST request with body
const response = await request(app)
  .post('/api/v1/auth/login')
  .send({ email: 'test@example.com', password: 'pass123' })
  .expect(200);

// With authentication
const response = await request(app)
  .get('/api/v1/auth/me')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);

// With query parameters
const response = await request(app)
  .get('/api/v1/users')
  .query({ page: 1, limit: 10 })
  .expect(200);
```

### Common Assertions

```javascript
// Status codes
.expect(200)
.expect(201)
.expect(400)
.expect(401)
.expect(403)
.expect(404)

// Response body
expect(response.body).toHaveProperty('token');
expect(response.body.user.email).toBe('test@example.com');
expect(Array.isArray(response.body.data)).toBe(true);

// Response headers
expect(response.headers['content-type']).toMatch(/json/);
```

## Workflow Testing

Workflow tests verify complete user journeys:

### Registration Workflow
1. User registers
2. Email verification
3. Login
4. Access protected resources
5. Update profile
6. Logout

### Password Reset Workflow
1. Request password reset
2. Receive reset token
3. Reset password
4. Login with new password
5. Verify old password doesn't work

### Example

```javascript
it('should complete password reset workflow', async () => {
  // Register user
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'test@example.com', password: 'OldPass123!' });

  // Request reset
  await request(app)
    .post('/api/v1/auth/forgot-password')
    .send({ email: 'test@example.com' })
    .expect(200);

  // Get reset token from database
  const result = await global.testDb.query(
    'SELECT reset_token FROM users WHERE email = $1',
    ['test@example.com']
  );
  const resetToken = result.rows[0].reset_token;

  // Reset password
  await request(app)
    .post('/api/v1/auth/reset-password')
    .send({ token: resetToken, password: 'NewPass123!' })
    .expect(200);

  // Login with new password
  await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'test@example.com', password: 'NewPass123!' })
    .expect(200);
});
```

## Best Practices

### Test Isolation

✅ **Do:**
- Reset database between tests
- Use unique test data
- Clean up after tests
- Use transactions when possible

❌ **Don't:**
- Share state between tests
- Rely on test execution order
- Leave test data in database

### Descriptive Tests

✅ **Do:**
```javascript
it('should return 401 when user provides incorrect password', async () => {
  // Test implementation
});
```

❌ **Don't:**
```javascript
it('test login', async () => {
  // Test implementation
});
```

### Test Organization

✅ **Do:**
- Group related tests with `describe`
- Use `beforeEach` for common setup
- Test one thing per test
- Use meaningful variable names

### Error Testing

Always test both success and failure cases:

```javascript
describe('POST /api/v1/auth/login', () => {
  it('should login with correct credentials', async () => {
    // Success case
  });

  it('should reject incorrect password', async () => {
    // Failure case
  });

  it('should reject non-existent email', async () => {
    // Failure case
  });
});
```

### Async/Await

Always use async/await for asynchronous operations:

```javascript
// ✅ Good
it('should create user', async () => {
  const response = await request(app)
    .post('/api/v1/users')
    .send({ name: 'Test' });

  expect(response.status).toBe(201);
});

// ❌ Bad
it('should create user', () => {
  request(app)
    .post('/api/v1/users')
    .send({ name: 'Test' })
    .then(response => {
      expect(response.status).toBe(201);
    });
});
```

## Troubleshooting

### Common Issues

**1. Database Connection Errors**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Ensure PostgreSQL is running
- Check connection credentials in `.env.test`
- Verify test database exists

**2. Test Timeout**

```
Timeout - Async callback was not invoked within the 30000 ms timeout
```

**Solution:**
- Increase timeout for specific test:
  ```javascript
  it('should complete long operation', async () => {
    // Test code
  }, 60000); // 60 second timeout
  ```
- Or in jest config: `testTimeout: 60000`

**3. Port Already in Use**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
- Use different port for tests
- Ensure previous test process terminated
- Check for zombie processes: `lsof -i :3000`

**4. Migration Errors**

```
Error: Migration failed: column "id" already exists
```

**Solution:**
- Reset test database
- Check migration order
- Verify migration hasn't been run before

### Debug Mode

Enable verbose logging:

```bash
# Set debug environment variable
DEBUG=* npm run test:integration

# Or in test file
console.log('Debug info:', variable);
```

### Isolate Failing Test

```bash
# Run only specific test
npm run test:integration -- -t "test name"

# Run specific file
npm run test:integration -- tests/integration/api/auth.test.js
```

## Performance Tips

1. **Use Transactions**
   - Wrap tests in transactions for automatic rollback
   - Faster than truncating tables

2. **Seed Only Necessary Data**
   - Don't seed entire database for every test
   - Create minimal test data

3. **Run Tests in Parallel** (when safe)
   - Use separate databases per worker
   - Ensure no shared state

4. **Reuse Database Connections**
   - Connection pooling is automatic
   - Don't create new connections per test

## Contributing

When adding new integration tests:

1. Follow existing patterns
2. Add descriptive test names
3. Test both success and failure cases
4. Include database verification
5. Document complex workflows
6. Keep tests independent
7. Update this README if needed

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TryForge Documentation](../../README.md)

## Questions or Issues?

- Create an issue in the repository
- Contact the TryForge team
- Check existing tests for examples

---

**Last Updated:** November 2025
**Maintained By:** TryForge Team
