# Testing Documentation

Complete guide to testing in TryForge - including testing strategy, how to run tests, coverage requirements, CI/CD pipeline, and best practices.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Pipeline](#cicd-pipeline)
- [Quality Gates](#quality-gates)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Testing Strategy

TryForge uses a comprehensive three-tier testing approach to ensure code quality and reliability:

### 1. Unit Tests

**Purpose**: Test individual functions and components in isolation.

**Location**: `tests/unit/`

**Tools**:
- Jest for test framework
- NYC/Istanbul for coverage

**What to Test**:
- Pure functions and utilities
- Component logic
- Service methods
- Data transformations
- Error handling

**Example**:
```javascript
// tests/unit/utils/formatter.test.js
const { formatProjectName } = require('../../../src/utils/formatter');

describe('formatProjectName', () => {
  it('should convert to kebab-case', () => {
    expect(formatProjectName('My Project')).toBe('my-project');
  });

  it('should handle special characters', () => {
    expect(formatProjectName('My@Project#123')).toBe('myproject123');
  });
});
```

### 2. Integration Tests

**Purpose**: Test interactions between multiple components and external services.

**Location**: `tests/integration/`

**Tools**:
- Jest for test framework
- PostgreSQL test database
- Mock API services

**What to Test**:
- Database operations
- API integrations (Claude, GitHub Spark, Pollinations)
- File system operations
- Configuration loading
- Service interactions

**Example**:
```javascript
// tests/integration/generators/app.test.js
const AppGenerator = require('../../../src/generators/app');
const db = require('../../../src/database');

describe('AppGenerator Integration', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it('should generate app and save to database', async () => {
    const generator = new AppGenerator();
    const result = await generator.generate({
      name: 'test-app',
      type: 'web'
    });

    expect(result.id).toBeDefined();

    const saved = await db.apps.findById(result.id);
    expect(saved.name).toBe('test-app');
  });
});
```

### 3. End-to-End (E2E) Tests

**Purpose**: Test complete user workflows and scenarios.

**Location**: `tests/e2e/`

**Tools**:
- Playwright for browser automation

**What to Test**:
- Complete user journeys
- Multi-step workflows
- Browser interactions
- Generated application functionality

**Example**:
```javascript
// tests/e2e/app-generation.test.js
const { test, expect } = require('@playwright/test');

test('complete app generation workflow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.fill('input[name="projectName"]', 'my-test-app');
  await page.selectOption('select[name="template"]', 'react-express');
  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.locator('.generated-code')).toContainText('my-test-app');
});
```

---

## Running Tests

### Quick Start

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run all E2E tests
npm run test:e2e

# Run all tests
npm run test:all

# Run with coverage
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch

# Run CI tests (optimized for CI environment)
npm run test:ci
```

### Running Specific Tests

```bash
# Run specific test file
npm test -- tests/unit/generators/app.test.js

# Run tests matching a pattern
npm test -- --testPathPattern=generators

# Run tests by name
npm test -- --testNamePattern="should generate app"

# Run only changed tests
npm test -- --onlyChanged

# Run with verbose output
npm test -- --verbose
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
npm run test:coverage:report

# Generate badges
npm run test:badges
```

Coverage reports are generated in multiple formats:
- **HTML**: `coverage/lcov-report/index.html` (interactive)
- **LCOV**: `coverage/lcov.info` (for CI tools)
- **JSON**: `coverage/coverage-final.json` (for processing)
- **Text**: Console output

---

## Writing Tests

### Test Structure

Follow the **Arrange-Act-Assert** (AAA) pattern:

```javascript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange - Set up test data and conditions
      const input = { name: 'test' };
      const expected = 'expected-result';

      // Act - Execute the code being tested
      const result = methodName(input);

      // Assert - Verify the results
      expect(result).toBe(expected);
    });
  });
});
```

### Test Naming Conventions

**Describe Blocks**: Use the component/function name
```javascript
describe('AppGenerator', () => {
  describe('generate', () => {
    // tests...
  });
});
```

**Test Cases**: Use "should" statements that describe expected behavior
```javascript
it('should generate React app with Express backend', () => {});
it('should throw error when invalid template provided', () => {});
it('should call Claude API with correct parameters', () => {});
```

### Mocking

#### Mocking Dependencies

```javascript
// Mock external modules
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Generated code' }]
      })
    }
  }))
}));

// Mock file system
jest.mock('fs-extra', () => ({
  writeFile: jest.fn().mockResolvedValue(),
  readFile: jest.fn().mockResolvedValue('content')
}));
```

#### Mocking Functions

```javascript
const mockCallback = jest.fn();
const mockReturnValue = jest.fn().mockReturnValue('value');
const mockResolvedValue = jest.fn().mockResolvedValue('async value');
const mockRejectedValue = jest.fn().mockRejectedValue(new Error('error'));

// Verify calls
expect(mockCallback).toHaveBeenCalledTimes(1);
expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
```

### Async Testing

```javascript
// Using async/await
it('should fetch data from API', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// Using promises
it('should save to database', () => {
  return saveToDatabase(data).then(result => {
    expect(result.success).toBe(true);
  });
});

// Using done callback (legacy)
it('should process callback', (done) => {
  processData((result) => {
    expect(result).toBe('processed');
    done();
  });
});
```

### Setup and Teardown

```javascript
describe('DatabaseTests', () => {
  // Runs once before all tests in this describe block
  beforeAll(async () => {
    await database.connect();
  });

  // Runs once after all tests in this describe block
  afterAll(async () => {
    await database.disconnect();
  });

  // Runs before each test
  beforeEach(() => {
    // Reset state
  });

  // Runs after each test
  afterEach(() => {
    // Clean up
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

---

## Coverage Requirements

### Minimum Thresholds

All code must meet these minimum coverage requirements:

| Metric      | Threshold | Description                           |
|-------------|-----------|---------------------------------------|
| Statements  | 80%       | Individual statements executed        |
| Branches    | 80%       | Conditional branches taken            |
| Functions   | 80%       | Functions called                      |
| Lines       | 80%       | Lines of code executed                |

### Coverage Watermarks

Coverage is color-coded based on percentage:

| Range     | Status      | Color       |
|-----------|-------------|-------------|
| 95-100%   | Excellent   | Bright Green|
| 80-94%    | Good        | Green       |
| 60-79%    | Warning     | Yellow      |
| 0-59%     | Critical    | Red         |

### Excluded Files

The following are excluded from coverage requirements:
- Test files (`**/*.test.js`, `**/*.spec.js`)
- Templates (`src/templates/**`)
- Examples (`src/examples/**`)
- Configuration files

### Checking Coverage

```bash
# Run tests with coverage
npm run test:coverage

# Coverage will fail if below thresholds
# Exit code 1 if any metric < 80%
```

---

## CI/CD Pipeline

### Pipeline Overview

TryForge uses GitHub Actions for continuous integration and deployment:

```
┌─────────────────────────────────────────────────────────┐
│                     Push/Pull Request                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼─────┐            ┌─────▼─────┐
   │   Lint   │            │   Tests   │
   └────┬─────┘            └─────┬─────┘
        │                         │
        │      ┌──────────────────┤
        │      │                  │
        │  ┌───▼───┐    ┌────────▼─────────┐
        │  │ Unit  │    │   Integration    │
        │  └───┬───┘    └────────┬─────────┘
        │      │                  │
        │      └──────┬───────────┘
        │             │
        │      ┌──────▼──────┐
        │      │     E2E     │
        │      └──────┬──────┘
        │             │
        └─────────────┤
                      │
              ┌───────▼────────┐
              │   Coverage     │
              │   Report       │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │  Quality       │
              │  Gates         │
              └───────┬────────┘
                      │
                   ✓ PASS
```

### Workflows

#### 1. Main CI Pipeline (`.github/workflows/ci.yml`)

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs**:
1. **Lint**: ESLint and Prettier checks
2. **Unit Tests**: Run on Node 16.x, 18.x, 20.x
3. **Integration Tests**: With PostgreSQL service
4. **E2E Tests**: With Playwright
5. **Coverage Report**: Aggregate coverage and upload to Codecov
6. **Quality Gates**: Enforce coverage thresholds

#### 2. Quick Test Pipeline (`.github/workflows/test.yml`)

**Triggers**:
- Push to any branch except `main`

**Jobs**:
- Fast test run
- Comment results on PR

#### 3. Performance Budget (`.github/workflows/performance-budget.yml`)

**Triggers**:
- Pull requests to `main`

**Jobs**:
- Lighthouse CI checks
- Performance budget enforcement

### Viewing Pipeline Results

1. **GitHub Actions Tab**: See all workflow runs
2. **PR Checks**: Status checks on pull requests
3. **Codecov**: Detailed coverage reports
4. **Artifacts**: Download test reports and coverage

### Local CI Simulation

Run the same checks locally before pushing:

```bash
# Lint check
npm run lint
npm run format:check

# Run all tests with coverage
npm run test:coverage

# Run quality report
node scripts/test-quality-report.js
```

---

## Quality Gates

### Automated Checks

Every commit and PR must pass these quality gates:

#### 1. Linting
- ESLint must pass with no errors
- Prettier formatting must be correct

#### 2. Tests
- All unit tests must pass
- All integration tests must pass
- All E2E tests must pass

#### 3. Coverage
- Minimum 80% coverage on all metrics
- No decrease in coverage from base branch

#### 4. Performance
- Lighthouse scores meet budgets
- Build size within limits

### Pre-commit Hooks

Git hooks run automatically before commit:

```bash
# Runs on every commit:
1. ESLint
2. Prettier check
3. Unit tests

# If any fail, commit is blocked
```

To bypass (not recommended):
```bash
git commit --no-verify
```

### Pull Request Requirements

Before merging, PRs must:
1. Pass all CI checks
2. Maintain or improve coverage
3. Have approved code review
4. Be up to date with base branch

---

## Best Practices

### General Testing Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Tests should survive refactoring

2. **Keep Tests Simple**
   - One assertion concept per test
   - Clear and readable test names
   - Minimal setup and teardown

3. **Test Edge Cases**
   - Empty inputs
   - Null/undefined values
   - Boundary conditions
   - Error scenarios

4. **Use Descriptive Assertions**
   ```javascript
   // Bad
   expect(result).toBe(true);

   // Good
   expect(user.isActive).toBe(true);
   expect(response.status).toBe(200);
   ```

### Unit Testing Best Practices

1. **Isolate Dependencies**
   - Mock external services
   - Use dependency injection
   - Test pure functions when possible

2. **Fast Tests**
   - No network calls
   - No file system operations
   - No database queries

3. **Deterministic Results**
   - Same input = same output
   - No random data
   - Fixed timestamps in tests

### Integration Testing Best Practices

1. **Use Test Database**
   - Separate from development database
   - Clean state between tests
   - Use transactions for isolation

2. **Mock External APIs**
   - Use test API keys
   - Mock third-party services
   - Control responses

3. **Test Real Interactions**
   - Don't mock everything
   - Test actual database queries
   - Test actual file operations

### E2E Testing Best Practices

1. **Test Critical Paths**
   - Focus on user journeys
   - Test happy paths and error flows
   - Cover different user roles

2. **Keep Tests Stable**
   - Use reliable selectors
   - Handle async operations properly
   - Avoid timing issues

3. **Parallelize When Possible**
   - Independent test scenarios
   - No shared state
   - Fast feedback

### Code Coverage Best Practices

1. **Don't Chase 100%**
   - 80% is sufficient
   - Focus on critical code
   - Some code is hard to test

2. **Quality Over Quantity**
   - Meaningful tests
   - Not just coverage numbers
   - Test important scenarios

3. **Review Uncovered Code**
   - Understand why it's uncovered
   - Is it worth testing?
   - Can it be simplified?

---

## Troubleshooting

### Common Issues

#### Tests Failing Locally

```bash
# Clear Jest cache
npm test -- --clearCache

# Update snapshots
npm test -- -u

# Run specific test file
npm test -- path/to/test.test.js
```

#### Coverage Not Generated

```bash
# Clean coverage directory
rm -rf coverage/

# Run with coverage flag
npm run test:coverage

# Check .nycrc.json configuration
cat .nycrc.json
```

#### Integration Tests Failing

```bash
# Check database connection
psql -U test_user -d test_db

# Reset test database
npm run db:reset:test

# Check environment variables
cat .env.test
```

#### E2E Tests Timing Out

```javascript
// Increase timeout
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code...
});

// Add explicit waits
await page.waitForSelector('.element', { timeout: 10000 });
```

#### Pre-commit Hook Failing

```bash
# Run checks manually
npm run lint
npm run format:check
npm run test:unit

# Fix formatting
npm run format

# Skip hook (emergency only)
git commit --no-verify
```

### Getting Help

1. **Check CI Logs**: Detailed error messages
2. **Review Coverage Report**: Identify uncovered code
3. **Run Tests Locally**: Reproduce issues
4. **Check Documentation**: This file and test examples
5. **Ask Team**: Create GitHub issue or discuss

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [NYC Coverage Documentation](https://github.com/istanbuljs/nyc)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com/)

---

**Last Updated**: 2025-11-02
**Maintained By**: TryForge Team
