# Unit Testing Infrastructure

Comprehensive unit testing for TryForge using Jest with 80% coverage target.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Mocking Strategies](#mocking-strategies)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

This testing infrastructure provides:

- **Jest Configuration**: Optimized for Node.js with comprehensive coverage settings
- **Test Utilities**: Reusable mocks and helpers for common testing scenarios
- **Custom Matchers**: Extended Jest matchers for specific use cases
- **Global Setup**: Consistent test environment across all test files
- **80% Coverage Target**: Enforced coverage thresholds for quality assurance

## Getting Started

### Prerequisites

```bash
npm install
```

All testing dependencies are included in `package.json`:
- `jest@^29.7.0` - Test framework
- `@types/node` - Node.js type definitions

### Project Structure

```
tests/
├── setup.js                    # Global test setup
├── unit/
│   ├── README.md              # This file
│   ├── helpers/
│   │   └── test-utils.js     # Reusable test utilities
│   ├── utils/
│   │   ├── logger.test.js    # Logger tests
│   │   └── error-handler.test.js
│   ├── database/
│   │   ├── migration-manager.test.js
│   │   └── backup-manager.test.js
│   └── ai-services/
│       └── claude-api.test.js
└── e2e/                       # End-to-end tests
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run with verbose output
npm run test:verbose

# Run in CI mode
npm run test:ci
```

### Running Specific Tests

```bash
# Run tests in a specific file
npm test -- logger.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should create"

# Run tests for a specific directory
npm test -- tests/unit/utils/

# Run failed tests only
npm test -- --onlyFailures
```

### Watch Mode

```bash
# Start watch mode
npm run test:watch

# In watch mode, press:
# - 'p' to filter by filename
# - 't' to filter by test name
# - 'a' to run all tests
# - 'q' to quit
```

## Writing Tests

### Test File Structure

Follow the AAA pattern: **Arrange, Act, Assert**

```javascript
describe('ModuleName', () => {
  // Setup
  let instance;

  beforeEach(() => {
    // Arrange - Set up test fixtures
    instance = new ModuleName();
  });

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should perform expected action', () => {
      // Arrange - Set up test data
      const input = 'test';

      // Act - Execute the method
      const result = instance.methodName(input);

      // Assert - Verify the result
      expect(result).toBe('expected');
    });
  });
});
```

### Naming Conventions

- **Test files**: `*.test.js` or `*.spec.js`
- **Describe blocks**: Use the module/class name
- **Test names**: Start with "should" and describe the expected behavior

```javascript
describe('ErrorHandler', () => {
  describe('handle', () => {
    it('should handle error with context', () => {});
    it('should log error details', () => {});
    it('should throw when exitOnError is true', () => {});
  });
});
```

### Async Tests

```javascript
// Using async/await
it('should resolve asynchronously', async () => {
  const result = await asyncFunction();
  expect(result).toBe('value');
});

// Using promises
it('should resolve with promise', () => {
  return asyncFunction().then(result => {
    expect(result).toBe('value');
  });
});

// Testing rejections
it('should reject with error', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

## Test Structure

### Organizing Tests

Group related tests using nested `describe` blocks:

```javascript
describe('BackupManager', () => {
  describe('Initialization', () => {
    it('should initialize with configuration', () => {});
  });

  describe('createBackup', () => {
    it('should create backup successfully', () => {});
    it('should compress when enabled', () => {});
    it('should encrypt when enabled', () => {});
  });

  describe('restore', () => {
    it('should restore from backup', () => {});
    it('should verify checksum', () => {});
  });

  describe('Edge Cases', () => {
    it('should handle missing configuration', () => {});
  });
});
```

### Setup and Teardown

```javascript
// Run once before all tests in this file
beforeAll(async () => {
  await setupDatabase();
});

// Run once after all tests in this file
afterAll(async () => {
  await teardownDatabase();
});

// Run before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Run after each test
afterEach(() => {
  jest.restoreAllMocks();
});
```

## Mocking Strategies

### Mocking Modules

```javascript
// Mock entire module
jest.mock('fs-extra', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

// Mock specific functions
jest.spyOn(fs, 'readFile').mockResolvedValue('content');

// Mock with implementation
jest.mock('axios', () => ({
  get: jest.fn((url) => Promise.resolve({ data: {} })),
}));
```

### Using Test Utilities

```javascript
const {
  mockDatabase,
  createTestLogger,
  mockFileSystem,
} = require('../helpers/test-utils');

describe('MyTest', () => {
  it('should use mocked dependencies', async () => {
    const db = mockDatabase();
    const logger = createTestLogger();

    // Use mocks in test
    await db.query('SELECT * FROM users');
    logger.info('Test message');

    expect(db.query).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Test message');
  });
});
```

### Mocking Classes

```javascript
// Mock class constructor
jest.mock('@database/BackupManager', () => {
  return jest.fn().mockImplementation(() => ({
    createBackup: jest.fn().mockResolvedValue({ success: true }),
    restore: jest.fn().mockResolvedValue({ success: true }),
  }));
});
```

### Partial Mocks

```javascript
// Mock only specific methods
const originalModule = jest.requireActual('@utils/logger');
jest.mock('@utils/logger', () => ({
  ...originalModule,
  error: jest.fn(), // Only mock error method
}));
```

## Coverage Requirements

### Coverage Thresholds

The project enforces 80% coverage across all metrics:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Reports

Multiple formats are generated:
- **Text**: Console output during test run
- **LCOV**: For CI/CD integration
- **HTML**: Interactive browser report
- **JSON**: Programmatic access

### Improving Coverage

1. **Identify uncovered code**:
   ```bash
   npm run test:coverage
   ```

2. **View HTML report** to see highlighted uncovered lines

3. **Write tests** for uncovered code:
   - Edge cases
   - Error conditions
   - Branch coverage
   - Default values

## Best Practices

### 1. Test Behavior, Not Implementation

```javascript
// ❌ Bad - Testing implementation
it('should call internal method', () => {
  expect(instance._privateMethod).toHaveBeenCalled();
});

// ✅ Good - Testing behavior
it('should return formatted data', () => {
  const result = instance.format(data);
  expect(result).toEqual({ formatted: true });
});
```

### 2. Keep Tests Independent

```javascript
// ❌ Bad - Tests depend on each other
let sharedState;
it('test 1', () => {
  sharedState = 'value';
});
it('test 2', () => {
  expect(sharedState).toBe('value'); // Fails if test 1 doesn't run
});

// ✅ Good - Each test is independent
beforeEach(() => {
  sharedState = 'value';
});
```

### 3. Use Descriptive Test Names

```javascript
// ❌ Bad
it('works', () => {});

// ✅ Good
it('should return user data when valid ID is provided', () => {});
```

### 4. Test Edge Cases

```javascript
describe('divide', () => {
  it('should divide two numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  // Edge cases
  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow();
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });

  it('should handle decimals', () => {
    expect(divide(10, 3)).toBeCloseTo(3.333, 2);
  });
});
```

### 5. Mock External Dependencies

```javascript
// ✅ Good - Mock external APIs
jest.mock('axios');
axios.get.mockResolvedValue({ data: mockData });

it('should fetch user data', async () => {
  const result = await fetchUser(123);
  expect(result).toEqual(mockData);
});
```

### 6. Use beforeEach for Setup

```javascript
describe('UserService', () => {
  let service;
  let mockDb;

  beforeEach(() => {
    mockDb = mockDatabase();
    service = new UserService(mockDb);
  });

  it('should create user', async () => {
    await service.createUser({ name: 'Test' });
    expect(mockDb.query).toHaveBeenCalled();
  });
});
```

### 7. Test Error Conditions

```javascript
describe('error handling', () => {
  it('should handle network errors', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));

    await expect(fetchData()).rejects.toThrow('Network error');
  });

  it('should handle invalid input', () => {
    expect(() => processData(null)).toThrow('Invalid input');
  });
});
```

## Examples

### Testing Async Functions

```javascript
const { retryWithBackoff } = require('@utils/error-handler');

describe('retryWithBackoff', () => {
  it('should retry failed operations', async () => {
    let attempts = 0;
    const fn = jest.fn(async () => {
      attempts++;
      if (attempts < 3) throw new Error('Fail');
      return 'success';
    });

    const result = await retryWithBackoff(fn, { maxRetries: 3 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
```

### Testing Streaming APIs

```javascript
describe('generateCodeStream', () => {
  it('should stream code generation', async () => {
    const chunks = [];

    for await (const chunk of claudeAPI.generateCodeStream('prompt')) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('')).toContain('code');
  });
});
```

### Testing Database Operations

```javascript
const { mockDatabase } = require('../helpers/test-utils');

describe('MigrationManager', () => {
  let manager;
  let mockDb;

  beforeEach(() => {
    mockDb = mockDatabase({
      queryResults: { rows: [{ id: 1 }], rowCount: 1 }
    });

    manager = new MigrationManager({ db: mockDb });
  });

  it('should apply migrations', async () => {
    await manager.migrate();

    expect(mockDb.beginTransaction).toHaveBeenCalled();
    expect(mockDb.query).toHaveBeenCalled();
    expect(mockDb.commitTransaction).toHaveBeenCalled();
  });
});
```

### Testing File Operations

```javascript
const { createMockFileSystem } = require('../helpers/test-utils');

describe('FileProcessor', () => {
  it('should read and process files', async () => {
    const { fs, mockFs } = createMockFileSystem({
      '/test/file.txt': 'test content'
    });

    const content = await processor.readFile('/test/file.txt');

    expect(content).toBe('test content');
    expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt');
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

```javascript
// Increase timeout for specific test
it('should handle long operation', async () => {
  // Test code
}, 10000); // 10 second timeout

// Or globally in jest.config.js
testTimeout: 10000
```

#### 2. Unhandled Promise Rejections

```javascript
// Always return or await promises
it('should handle async', async () => {
  await expect(asyncFn()).rejects.toThrow();
});
```

#### 3. Mock Not Working

```javascript
// Ensure mock is before require
jest.mock('module');
const module = require('module');

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### 4. Memory Leaks

```javascript
// Always clean up after tests
afterEach(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
});

afterAll(() => {
  // Close connections
  await db.close();
});
```

### Debug Mode

```javascript
// Enable console output
global.console = originalConsole;

// Use debugger
it('debug test', () => {
  debugger;
  // Test code
});

// Run with Node debugger
node --inspect-brk node_modules/.bin/jest
```

### Watch Mode Issues

If watch mode isn't working:

```bash
# Clear Jest cache
npm test -- --clearCache

# Run with --no-cache
npm test -- --no-cache
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Jest Expect API](https://jestjs.io/docs/expect)
- [Jest Mock Functions](https://jestjs.io/docs/mock-functions)
- [TryForge Architecture](../../ARCHITECTURE.md)

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure 80%+ coverage
3. Follow existing test patterns
4. Update this documentation if needed

## Support

For issues or questions:
- Check existing test examples
- Review Jest documentation
- Ask in project discussions
- Create an issue with test failure details
