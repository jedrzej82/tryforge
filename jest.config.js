/**
 * Jest Configuration for TryForge
 * Comprehensive unit testing setup with 80% coverage target
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/templates/**',
    '!src/examples/**',
    '!src/**/__tests__/**',
    '!src/cli/index.js', // Entry point
  ],

  // Coverage thresholds - 80% across all metrics
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test match patterns
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/unit/**/*.spec.js'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@ai-services/(.*)$': '<rootDir>/src/ai-services/$1',
    '^@automation/(.*)$': '<rootDir>/src/automation/$1',
    '^@orchestrator/(.*)$': '<rootDir>/src/orchestrator/$1',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@memory/(.*)$': '<rootDir>/src/memory/$1',
    '^@admin/(.*)$': '<rootDir>/src/admin/$1',
  },

  // Timeouts
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Transform - no transformation needed for Node.js
  transform: {},

  // Watch plugins for better development experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/',
    '/temp/',
    '/logs/'
  ],

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'node'],

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Maximum number of workers
  maxWorkers: '50%',

  // Collect coverage from
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/',
    '/logs/',
    '/examples/',
    '/.git/'
  ],

  // Global setup/teardown
  // globalSetup: '<rootDir>/tests/global-setup.js',
  // globalTeardown: '<rootDir>/tests/global-teardown.js',

  // Bail after first test failure in CI
  bail: process.env.CI ? 1 : 0,

  // Error on deprecated APIs
  errorOnDeprecated: true,

  // Notify on completion
  notify: false,

  // Respect .gitignore
  respectIgnorePatterns: true,
};
