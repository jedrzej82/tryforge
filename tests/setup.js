/**
 * Jest Global Setup
 * Configure test environment and provide global utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TRYFORGE_LOG_LEVEL = 'error'; // Reduce log noise in tests
process.env.ANTHROPIC_API_KEY = 'test-key-for-testing';
process.env.CLAUDE_AUTH_MODE = 'api';

// Mock console methods to reduce noise during testing
// Store original console methods for restoration
const originalConsole = {
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// Replace console methods with jest mocks
global.console = {
  ...console,
  log: jest.fn((...args) => {
    // Uncomment for debugging tests
    // originalConsole.log(...args);
  }),
  debug: jest.fn((...args) => {
    // originalConsole.debug(...args);
  }),
  info: jest.fn((...args) => {
    // originalConsole.info(...args);
  }),
  warn: jest.fn((...args) => {
    // originalConsole.warn(...args);
  }),
  error: jest.fn((...args) => {
    // Uncomment to see errors during test development
    // originalConsole.error(...args);
  }),
};

// Restore original console for specific use cases
global.originalConsole = originalConsole;

/**
 * Global test utilities
 */
global.testUtils = {
  /**
   * Wait for async operations
   * @param {number} ms - Milliseconds to wait
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Mock system date
   * @param {string|Date} date - Date to mock
   */
  mockDate: (date) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(date));
  },

  /**
   * Restore real timers
   */
  restoreDate: () => {
    jest.useRealTimers();
  },

  /**
   * Create a mock file system structure
   * @param {Object} structure - File system structure
   */
  createMockFileSystem: (structure) => {
    const fs = require('fs-extra');
    const mockFs = {};

    Object.keys(structure).forEach(path => {
      mockFs[path] = structure[path];
    });

    jest.spyOn(fs, 'readFile').mockImplementation((path) => {
      if (mockFs[path]) {
        return Promise.resolve(mockFs[path]);
      }
      return Promise.reject(new Error(`ENOENT: File not found: ${path}`));
    });

    jest.spyOn(fs, 'writeFile').mockImplementation((path, content) => {
      mockFs[path] = content;
      return Promise.resolve();
    });

    jest.spyOn(fs, 'pathExists').mockImplementation((path) => {
      return Promise.resolve(!!mockFs[path]);
    });

    return mockFs;
  },

  /**
   * Create a mock database connection
   * @param {Object} options - Mock options
   */
  createMockDatabase: (options = {}) => {
    return {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      ...options
    };
  },

  /**
   * Create a mock logger
   */
  createMockLogger: () => {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logWithContext: jest.fn(),
      logOperation: jest.fn(),
      logAIRequest: jest.fn(),
      logAIResponse: jest.fn(),
      enableDebug: jest.fn(),
      disableDebug: jest.fn(),
    };
  },

  /**
   * Create a spy on a module
   * @param {string} modulePath - Path to module
   * @param {Object} mocks - Methods to mock
   */
  mockModule: (modulePath, mocks = {}) => {
    jest.mock(modulePath, () => mocks);
  },

  /**
   * Generate random test data
   */
  generateTestData: {
    string: (length = 10) => {
      return Math.random().toString(36).substring(2, length + 2);
    },
    number: (min = 0, max = 100) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    email: () => {
      return `test-${Date.now()}@example.com`;
    },
    uuid: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    date: () => {
      return new Date(Date.now() - Math.random() * 10000000000);
    }
  }
};

/**
 * Global setup before all tests
 */
beforeAll(() => {
  // Setup code that runs once before all tests
});

/**
 * Global teardown after all tests
 */
afterAll(() => {
  // Cleanup code that runs once after all tests
});

/**
 * Setup before each test
 */
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

/**
 * Cleanup after each test
 */
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Restore all mocks
  jest.restoreAllMocks();

  // Clear all timers
  jest.clearAllTimers();

  // Restore real timers if they were faked
  if (jest.isMockFunction(setTimeout)) {
    jest.useRealTimers();
  }
});

/**
 * Custom Jest matchers
 */
expect.extend({
  /**
   * Check if value is a valid UUID
   */
  toBeUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid UUID`
        : `expected ${received} to be a valid UUID`
    };
  },

  /**
   * Check if value is a valid ISO date string
   */
  toBeISODate(received) {
    const pass = !isNaN(Date.parse(received)) && received.includes('T');

    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid ISO date`
        : `expected ${received} to be a valid ISO date`
    };
  },

  /**
   * Check if error has specific properties
   */
  toHaveErrorProperties(received, properties) {
    const pass = properties.every(prop => received.hasOwnProperty(prop));

    return {
      pass,
      message: () => pass
        ? `expected error not to have properties ${properties.join(', ')}`
        : `expected error to have properties ${properties.join(', ')}`
    };
  }
});

// Suppress specific warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  const warning = args[0];

  // Filter out known warnings
  if (
    typeof warning === 'string' &&
    (warning.includes('deprecated') ||
     warning.includes('Warning:'))
  ) {
    return;
  }

  originalWarn(...args);
};

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in test:', reason);
});

// Export for use in tests
module.exports = {
  testUtils: global.testUtils,
  originalConsole
};
