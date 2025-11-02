/**
 * Jest Configuration for Integration Tests
 *
 * Separate configuration for integration tests that:
 * - Run against real database
 * - Test complete workflows
 * - Use actual HTTP requests
 * - Run serially for test isolation
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/integration/**/*.test.js',
    '**/tests/integration/**/*.spec.js'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/setup.js'
  ],

  // Test timeout - integration tests may take longer
  testTimeout: 30000, // 30 seconds

  // Run tests serially to avoid database conflicts
  maxWorkers: 1,

  // Coverage - usually collected from unit tests instead
  collectCoverage: false,

  // Verbose output for better debugging
  verbose: true,

  // Display individual test results
  displayName: {
    name: 'INTEGRATION',
    color: 'blue'
  },

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,

  // Module paths
  moduleDirectories: [
    'node_modules',
    'src'
  ],

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@ai-services/(.*)$': '<rootDir>/src/ai-services/$1',
    '^@automation/(.*)$': '<rootDir>/src/automation/$1'
  },

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.git/'
  ],

  // Transform files
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
  },

  // Global setup/teardown (if needed)
  // globalSetup: '<rootDir>/tests/integration/global-setup.js',
  // globalTeardown: '<rootDir>/tests/integration/global-teardown.js',

  // Detect open handles
  detectOpenHandles: true,
  forceExit: true,

  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results/integration',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],

  // Error handling
  bail: false, // Continue running tests after first failure

  // Show progress
  notify: false,
  notifyMode: 'failure-change'
};
