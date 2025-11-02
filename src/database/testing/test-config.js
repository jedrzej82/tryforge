/**
 * Test Database Configuration
 *
 * Configuration for test database connections and behavior
 */

module.exports = {
  // Test database settings for different database types
  testDatabase: {
    // PostgreSQL configuration
    postgres: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT) || 5432,
      database: process.env.TEST_DB_NAME || 'tryforge_test',
      user: process.env.TEST_DB_USER || 'test_user',
      password: process.env.TEST_DB_PASSWORD || 'test_password',
      max: 20, // Connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    },

    // MySQL configuration
    mysql: {
      host: process.env.TEST_MYSQL_HOST || 'localhost',
      port: parseInt(process.env.TEST_MYSQL_PORT) || 3306,
      database: process.env.TEST_MYSQL_DB || 'tryforge_test',
      user: process.env.TEST_MYSQL_USER || 'test_user',
      password: process.env.TEST_MYSQL_PASSWORD || 'test_password',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    },

    // MongoDB configuration
    mongodb: {
      url: process.env.TEST_MONGODB_URL || 'mongodb://localhost:27017',
      database: process.env.TEST_MONGODB_DB || 'tryforge_test',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10
      }
    },

    // SQLite configuration (in-memory for testing)
    sqlite: {
      database: process.env.TEST_SQLITE_DB || ':memory:',
      options: {
        verbose: false
      }
    }
  },

  // Test execution options
  options: {
    // Drop database after tests complete
    dropAfterTest: process.env.TEST_DROP_DB === 'true' || true,

    // Run each test in a transaction and rollback after
    runInTransaction: process.env.TEST_USE_TRANSACTIONS === 'true' || false,

    // Isolate tests by using separate databases
    isolateTests: process.env.TEST_ISOLATE === 'true' || false,

    // Enable parallel test execution
    parallelTests: process.env.TEST_PARALLEL === 'true' || false,

    // Maximum parallel test workers
    maxWorkers: parseInt(process.env.TEST_MAX_WORKERS) || 4,

    // Timeout for database operations (ms)
    timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,

    // Retry failed operations
    retryFailedOperations: true,
    maxRetries: 3,

    // Clean database between test suites
    cleanBetweenSuites: true,

    // Seed database before tests
    seedBeforeTests: false,

    // Use snapshots for faster test setup
    useSnapshots: false
  },

  // Fixture settings
  fixtures: {
    // Path to fixture files
    path: process.env.TEST_FIXTURES_PATH || './fixtures',

    // Auto-load fixtures before tests
    autoLoad: false,

    // Default fixtures to load
    defaultFixtures: [],

    // Format for fixture files (json, yaml, js)
    format: 'json'
  },

  // Snapshot settings
  snapshots: {
    // Path to snapshot files
    path: process.env.TEST_SNAPSHOTS_PATH || './snapshots',

    // Format for snapshots (json, sql)
    format: 'json',

    // Compress snapshot files
    compress: false,

    // Auto-cleanup old snapshots
    autoCleanup: true,

    // Keep snapshots for N days
    keepDays: 7
  },

  // Data factory settings
  factory: {
    // Seed for random data generation (null = random seed)
    seed: process.env.TEST_DATA_SEED ? parseInt(process.env.TEST_DATA_SEED) : null,

    // Locale for generated data
    locale: process.env.TEST_DATA_LOCALE || 'en',

    // Use faker.js if available
    useFaker: true
  },

  // Migration settings
  migrations: {
    // Path to migration files
    path: process.env.TEST_MIGRATIONS_PATH || './migrations',

    // Run migrations before tests
    runBeforeTests: true,

    // Table name for migration tracking
    tableName: 'migrations',

    // Schema name
    schemaName: 'public'
  },

  // Logging settings
  logging: {
    // Enable query logging
    logQueries: process.env.TEST_LOG_QUERIES === 'true' || false,

    // Log slow queries (ms threshold)
    slowQueryThreshold: parseInt(process.env.TEST_SLOW_QUERY_MS) || 1000,

    // Log level for database operations
    level: process.env.TEST_LOG_LEVEL || 'info',

    // Log to file
    logToFile: false,

    // Log file path
    logFile: './logs/test-database.log'
  },

  // Performance settings
  performance: {
    // Enable connection pooling
    useConnectionPool: true,

    // Pool size
    poolSize: parseInt(process.env.TEST_POOL_SIZE) || 10,

    // Cache prepared statements
    cachePreparedStatements: true,

    // Use bulk inserts for fixtures
    useBulkInserts: true,

    // Batch size for bulk operations
    batchSize: 100
  },

  // Cleanup settings
  cleanup: {
    // Auto-cleanup orphaned test databases
    autoCleanupOrphaned: true,

    // Cleanup interval (ms)
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours

    // Grace period before cleanup (ms)
    gracePeriod: 60 * 60 * 1000 // 1 hour
  },

  // Environment-specific overrides
  environments: {
    // CI/CD environment
    ci: {
      options: {
        dropAfterTest: true,
        parallelTests: true,
        maxWorkers: 2
      },
      logging: {
        logQueries: false,
        level: 'error'
      }
    },

    // Development environment
    development: {
      options: {
        dropAfterTest: false,
        isolateTests: true
      },
      logging: {
        logQueries: true,
        level: 'debug'
      }
    },

    // Local testing
    local: {
      options: {
        parallelTests: false,
        maxWorkers: 1
      },
      logging: {
        logQueries: true,
        level: 'debug'
      }
    }
  }
};

/**
 * Get configuration for current environment
 */
function getConfig(environment = null) {
  const env = environment || process.env.NODE_ENV || 'local';
  const baseConfig = module.exports;

  if (baseConfig.environments[env]) {
    return mergeConfig(baseConfig, baseConfig.environments[env]);
  }

  return baseConfig;
}

/**
 * Merge configurations
 */
function mergeConfig(base, override) {
  const merged = JSON.parse(JSON.stringify(base));

  for (const key in override) {
    if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
      merged[key] = { ...merged[key], ...override[key] };
    } else {
      merged[key] = override[key];
    }
  }

  return merged;
}

module.exports.getConfig = getConfig;
