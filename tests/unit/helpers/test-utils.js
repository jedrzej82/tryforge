/**
 * Test Utilities
 * Reusable helpers and mocks for unit testing
 */

const { Readable } = require('stream');

/**
 * Mock file system operations
 * @returns {Object} Mocked fs-extra module
 */
function mockFileSystem() {
  const fs = require('fs-extra');

  // Mock all common fs operations
  jest.spyOn(fs, 'readFile').mockResolvedValue('file content');
  jest.spyOn(fs, 'writeFile').mockResolvedValue();
  jest.spyOn(fs, 'readFileSync').mockReturnValue('file content');
  jest.spyOn(fs, 'writeFileSync').mockReturnValue();
  jest.spyOn(fs, 'ensureDir').mockResolvedValue();
  jest.spyOn(fs, 'ensureDirSync').mockReturnValue();
  jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
  jest.spyOn(fs, 'pathExistsSync').mockReturnValue(true);
  jest.spyOn(fs, 'remove').mockResolvedValue();
  jest.spyOn(fs, 'removeSync').mockReturnValue();
  jest.spyOn(fs, 'copy').mockResolvedValue();
  jest.spyOn(fs, 'copySync').mockReturnValue();
  jest.spyOn(fs, 'move').mockResolvedValue();
  jest.spyOn(fs, 'readdir').mockResolvedValue([]);
  jest.spyOn(fs, 'stat').mockResolvedValue({
    size: 1024,
    isFile: () => true,
    isDirectory: () => false,
    mtime: new Date(),
  });

  return fs;
}

/**
 * Create a mock file system with specific structure
 * @param {Object} structure - File system structure { path: content }
 * @returns {Object} Mock fs module
 */
function createMockFileSystem(structure = {}) {
  const fs = require('fs-extra');
  const mockFs = { ...structure };

  jest.spyOn(fs, 'readFile').mockImplementation((path) => {
    if (mockFs[path] !== undefined) {
      return Promise.resolve(mockFs[path]);
    }
    return Promise.reject(new Error(`ENOENT: File not found: ${path}`));
  });

  jest.spyOn(fs, 'writeFile').mockImplementation((path, content) => {
    mockFs[path] = content;
    return Promise.resolve();
  });

  jest.spyOn(fs, 'pathExists').mockImplementation((path) => {
    return Promise.resolve(mockFs[path] !== undefined);
  });

  jest.spyOn(fs, 'readdir').mockImplementation((path) => {
    const files = Object.keys(mockFs)
      .filter(p => p.startsWith(path))
      .map(p => p.substring(path.length + 1).split('/')[0])
      .filter((v, i, a) => a.indexOf(v) === i);

    return Promise.resolve(files);
  });

  return { fs, mockFs };
}

/**
 * Mock database connection
 * @param {Object} options - Mock options
 * @returns {Object} Mock database object
 */
function mockDatabase(options = {}) {
  const defaultOptions = {
    queryResults: { rows: [], rowCount: 0 },
    connected: true,
    transactionActive: false,
  };

  const config = { ...defaultOptions, ...options };

  return {
    query: jest.fn().mockResolvedValue(config.queryResults),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    beginTransaction: jest.fn().mockImplementation(() => {
      config.transactionActive = true;
      return Promise.resolve();
    }),
    commitTransaction: jest.fn().mockImplementation(() => {
      config.transactionActive = false;
      return Promise.resolve();
    }),
    rollbackTransaction: jest.fn().mockImplementation(() => {
      config.transactionActive = false;
      return Promise.resolve();
    }),
    isConnected: jest.fn(() => config.connected),
    isTransactionActive: jest.fn(() => config.transactionActive),
    getClient: jest.fn(() => ({
      query: jest.fn().mockResolvedValue(config.queryResults),
    })),
  };
}

/**
 * Mock HTTP requests with axios
 * @param {Object} mockResponses - Map of URL to response data
 * @returns {Object} Mocked axios
 */
function mockAxios(mockResponses = {}) {
  const axios = require('axios');

  jest.spyOn(axios, 'get').mockImplementation((url) => {
    if (mockResponses[url]) {
      return Promise.resolve({ data: mockResponses[url], status: 200 });
    }
    return Promise.resolve({ data: {}, status: 200 });
  });

  jest.spyOn(axios, 'post').mockImplementation((url, data) => {
    if (mockResponses[url]) {
      return Promise.resolve({ data: mockResponses[url], status: 200 });
    }
    return Promise.resolve({ data: {}, status: 200 });
  });

  jest.spyOn(axios, 'put').mockResolvedValue({ data: {}, status: 200 });
  jest.spyOn(axios, 'delete').mockResolvedValue({ data: {}, status: 200 });
  jest.spyOn(axios, 'patch').mockResolvedValue({ data: {}, status: 200 });

  return axios;
}

/**
 * Create test logger that captures log calls
 * @returns {Object} Mock logger
 */
function createTestLogger() {
  const logs = {
    info: [],
    error: [],
    warn: [],
    debug: [],
  };

  return {
    info: jest.fn((...args) => logs.info.push(args)),
    error: jest.fn((...args) => logs.error.push(args)),
    warn: jest.fn((...args) => logs.warn.push(args)),
    debug: jest.fn((...args) => logs.debug.push(args)),
    logWithContext: jest.fn(),
    logOperation: jest.fn(),
    logAIRequest: jest.fn(),
    logAIResponse: jest.fn(),
    enableDebug: jest.fn(),
    disableDebug: jest.fn(),
    level: 'info',
    logs, // Access to captured logs
  };
}

/**
 * Create mock spinner (ora)
 * @returns {Object} Mock spinner
 */
function createMockSpinner() {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    text: '',
    isSpinning: false,
  };

  spinner.start.mockImplementation(() => {
    spinner.isSpinning = true;
    return spinner;
  });

  spinner.stop.mockImplementation(() => {
    spinner.isSpinning = false;
    return spinner;
  });

  return spinner;
}

/**
 * Create mock stream for testing streaming operations
 * @param {Array} chunks - Data chunks to stream
 * @returns {ReadableStream}
 */
function createMockStream(chunks = []) {
  let index = 0;

  return new Readable({
    read() {
      if (index < chunks.length) {
        this.push(chunks[index]);
        index++;
      } else {
        this.push(null); // End of stream
      }
    }
  });
}

/**
 * Create async iterator for testing streaming APIs
 * @param {Array} items - Items to iterate over
 * @returns {AsyncIterator}
 */
async function* createAsyncIterator(items) {
  for (const item of items) {
    await new Promise(resolve => setTimeout(resolve, 10));
    yield item;
  }
}

/**
 * Wait for condition to be true
 * @param {Function} condition - Condition function
 * @param {Object} options - Options
 * @returns {Promise<boolean>}
 */
async function waitForCondition(condition, options = {}) {
  const {
    timeout = 5000,
    interval = 100,
    errorMessage = 'Condition not met within timeout'
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(errorMessage);
}

/**
 * Create mock AI API client
 * @param {Object} options - Mock options
 * @returns {Object} Mock AI client
 */
function createMockAIClient(options = {}) {
  const defaultResponse = 'Mock AI response';

  return {
    generateCode: jest.fn().mockResolvedValue(options.response || defaultResponse),
    generateCodeStream: jest.fn().mockReturnValue(
      createAsyncIterator(['Mock', ' AI', ' response'])
    ),
    generateReactComponent: jest.fn().mockResolvedValue('Mock React component'),
    generateExpressRoute: jest.fn().mockResolvedValue('Mock Express route'),
    generateDatabaseSchema: jest.fn().mockResolvedValue('Mock DB schema'),
    fixCodeError: jest.fn().mockResolvedValue('Fixed code'),
    improveCode: jest.fn().mockResolvedValue('Improved code'),
    generateTests: jest.fn().mockResolvedValue('Mock tests'),
    analyzeCode: jest.fn().mockResolvedValue({
      issues: [],
      improvements: [],
      score: 100
    }),
    mockMode: true,
  };
}

/**
 * Create mock configuration object
 * @param {Object} overrides - Config overrides
 * @returns {Object} Mock config
 */
function createMockConfig(overrides = {}) {
  const defaultConfig = {
    database: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      name: 'test_db',
      user: 'test_user',
      password: 'test_password',
    },
    storage: {
      type: 'local',
      path: '/tmp/test-storage',
    },
    compression: {
      enabled: false,
      algorithm: 'gzip',
      level: 6,
    },
    encryption: {
      enabled: false,
      password: 'test-encryption-key',
    },
    migrations: {
      directory: '/tmp/migrations',
      autoRollback: false,
    },
    orm: {
      type: 'raw',
    },
  };

  return {
    ...defaultConfig,
    ...overrides,
    getDatabaseConfig: () => ({ ...defaultConfig.database, ...overrides.database }),
    getStorageConfig: () => ({ ...defaultConfig.storage, ...overrides.storage }),
    getMigrationConfig: () => ({ ...defaultConfig.migrations, ...overrides.migrations }),
    getORMConfig: () => ({ ...defaultConfig.orm, ...overrides.orm }),
    getConfig: () => ({ ...defaultConfig, ...overrides }),
  };
}

/**
 * Generate test data
 */
const generateTestData = {
  /**
   * Generate random string
   * @param {number} length - String length
   * @returns {string}
   */
  string: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  /**
   * Generate random number
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number}
   */
  number: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate random email
   * @returns {string}
   */
  email: () => {
    return `test-${Date.now()}@example.com`;
  },

  /**
   * Generate UUID v4
   * @returns {string}
   */
  uuid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Generate random date
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @returns {Date}
   */
  date: (start = new Date(2020, 0, 1), end = new Date()) => {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
  },

  /**
   * Generate random boolean
   * @returns {boolean}
   */
  boolean: () => {
    return Math.random() > 0.5;
  },

  /**
   * Generate array of items
   * @param {Function} generator - Generator function
   * @param {number} count - Array length
   * @returns {Array}
   */
  array: (generator, count = 5) => {
    return Array.from({ length: count }, generator);
  },

  /**
   * Pick random item from array
   * @param {Array} array - Source array
   * @returns {*}
   */
  pick: (array) => {
    return array[Math.floor(Math.random() * array.length)];
  },
};

/**
 * Assertion helpers
 */
const assertions = {
  /**
   * Assert function was called with partial match
   * @param {Function} fn - Jest mock function
   * @param {Object} partial - Partial object to match
   */
  toHaveBeenCalledWithPartial: (fn, partial) => {
    const calls = fn.mock.calls;
    const match = calls.some(call => {
      return call.some(arg => {
        if (typeof arg !== 'object') return false;
        return Object.keys(partial).every(key => {
          return arg[key] === partial[key];
        });
      });
    });
    expect(match).toBe(true);
  },

  /**
   * Assert async function eventually resolves
   * @param {Function} fn - Async function
   * @param {Object} options - Options
   */
  toEventuallyResolve: async (fn, options = {}) => {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        await fn();
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Function did not resolve within timeout');
  },
};

/**
 * Time manipulation helpers
 */
const timeHelpers = {
  /**
   * Freeze time at specific date
   * @param {Date|string} date - Date to freeze at
   */
  freezeTime: (date = new Date()) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(date));
  },

  /**
   * Restore real timers
   */
  restoreTime: () => {
    jest.useRealTimers();
  },

  /**
   * Advance timers by milliseconds
   * @param {number} ms - Milliseconds to advance
   */
  advanceTime: async (ms) => {
    await jest.advanceTimersByTimeAsync(ms);
  },

  /**
   * Run all pending timers
   */
  runAllTimers: async () => {
    await jest.runAllTimersAsync();
  },
};

/**
 * Cleanup helper
 * Restore all mocks and clear all timers
 */
function cleanup() {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.clearAllTimers();
  if (jest.isMockFunction(setTimeout)) {
    jest.useRealTimers();
  }
}

module.exports = {
  // File system mocks
  mockFileSystem,
  createMockFileSystem,

  // Database mocks
  mockDatabase,

  // HTTP mocks
  mockAxios,

  // Logger mocks
  createTestLogger,

  // UI mocks
  createMockSpinner,

  // Stream utilities
  createMockStream,
  createAsyncIterator,

  // AI mocks
  createMockAIClient,

  // Configuration mocks
  createMockConfig,

  // Test data generation
  generateTestData,

  // Async utilities
  waitForCondition,

  // Assertions
  assertions,

  // Time helpers
  timeHelpers,

  // Cleanup
  cleanup,
};
