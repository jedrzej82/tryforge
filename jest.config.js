module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    // CLI command files are implementations, not tests, but were incorrectly picked up by Jest
    '!src/cli/commands/*.js'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    // Exclude CLI commands from being picked up as test files
    '/src/cli/commands/'
  ],
  moduleFileExtensions: ['js', 'json'],
  verbose: true
};
