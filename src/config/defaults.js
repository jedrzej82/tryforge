/**
 * Default Configuration Values
 *
 * This file contains all default configuration values for TryForge.
 * Values are organized by environment and can be overridden by:
 * - Project config files
 * - User config files
 * - Environment variables
 * - CLI flags
 */

const path = require('path');
const os = require('os');

/**
 * Base defaults shared across all environments
 */
const baseDefaults = {
  // General settings
  version: '1.0.0',
  logLevel: 'info', // debug, info, warn, error

  // AI Service settings
  ai: {
    provider: 'claude', // claude, openai, custom
    apiKey: null, // Should be set via environment variable
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    fallbackModels: [
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229'
    ]
  },

  // Template settings
  templates: {
    directory: path.join(os.homedir(), '.tryforge', 'templates'),
    autoUpdate: true,
    updateInterval: 86400000, // 24 hours in milliseconds
    custom: [],
    cache: true,
    cacheDir: path.join(os.homedir(), '.tryforge', 'cache', 'templates')
  },

  // Database settings
  database: {
    provider: 'postgresql',
    host: 'localhost',
    port: 5432,
    name: 'tryforge',
    username: 'postgres',
    password: null, // Should use environment variable
    ssl: false,
    poolMin: 2,
    poolMax: 10,
    timeout: 30000,
    migrations: {
      directory: 'migrations',
      tableName: 'knex_migrations',
      autoRun: false
    }
  },

  // Project settings
  project: {
    defaultTemplate: 'react-typescript',
    defaultDatabase: 'postgresql',
    includeTests: true,
    includeDocs: true,
    includeGitignore: true,
    includeEnvFile: true,
    gitInit: true,
    installDeps: true,
    outputDir: process.cwd(),
    overwrite: false,
    backup: true
  },

  // CLI settings
  cli: {
    interactive: true,
    verbose: false,
    color: true,
    progress: true,
    emoji: true,
    timestamps: false,
    editor: process.env.EDITOR || 'vim',
    pager: process.env.PAGER || 'less',
    confirmDestructive: true
  },

  // Generation settings
  generate: {
    fileCase: 'kebab', // kebab, camel, pascal, snake
    importStyle: 'named', // named, default, namespace
    quotes: 'single', // single, double
    semicolons: true,
    trailingComma: 'es5', // none, es5, all
    tabWidth: 2,
    useTabs: false,
    lineWidth: 80,
    endOfLine: 'lf', // lf, crlf, auto
    bracketSpacing: true,
    arrowParens: 'always' // always, avoid
  },

  // Server settings (for local development server)
  server: {
    host: 'localhost',
    port: 3000,
    https: false,
    cors: true,
    corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
    rateLimit: {
      enabled: true,
      windowMs: 900000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    compression: true,
    helmet: true
  },

  // Cache settings
  cache: {
    enabled: true,
    type: 'memory', // memory, redis, filesystem
    ttl: 3600, // 1 hour in seconds
    directory: path.join(os.homedir(), '.tryforge', 'cache'),
    maxSize: 104857600 // 100MB
  },

  // Plugin settings
  plugins: {
    enabled: true,
    directory: path.join(os.homedir(), '.tryforge', 'plugins'),
    autoLoad: true,
    custom: []
  },

  // Analytics settings
  analytics: {
    enabled: false,
    anonymous: true,
    endpoint: null
  },

  // Update settings
  updates: {
    checkOnStart: true,
    autoUpdate: false,
    channel: 'stable' // stable, beta, nightly
  }
};

/**
 * Development environment overrides
 */
const developmentDefaults = {
  logLevel: 'debug',
  cli: {
    ...baseDefaults.cli,
    verbose: true,
    timestamps: true
  },
  server: {
    ...baseDefaults.server,
    port: 3000
  },
  database: {
    ...baseDefaults.database,
    name: 'tryforge_dev',
    migrations: {
      ...baseDefaults.database.migrations,
      autoRun: true
    }
  },
  cache: {
    ...baseDefaults.cache,
    ttl: 300 // 5 minutes in dev
  },
  updates: {
    ...baseDefaults.updates,
    channel: 'beta'
  }
};

/**
 * Production environment overrides
 */
const productionDefaults = {
  logLevel: 'warn',
  cli: {
    ...baseDefaults.cli,
    interactive: false,
    verbose: false
  },
  server: {
    ...baseDefaults.server,
    port: process.env.PORT || 8080,
    https: true
  },
  database: {
    ...baseDefaults.database,
    name: 'tryforge_prod',
    ssl: true,
    poolMax: 20
  },
  cache: {
    ...baseDefaults.cache,
    type: 'redis',
    ttl: 7200 // 2 hours in production
  },
  analytics: {
    ...baseDefaults.analytics,
    enabled: true
  }
};

/**
 * Test environment overrides
 */
const testDefaults = {
  logLevel: 'error',
  cli: {
    ...baseDefaults.cli,
    interactive: false,
    color: false,
    progress: false,
    emoji: false,
    confirmDestructive: false
  },
  server: {
    ...baseDefaults.server,
    port: 0 // Random port for testing
  },
  database: {
    ...baseDefaults.database,
    name: 'tryforge_test',
    poolMax: 5
  },
  cache: {
    ...baseDefaults.cache,
    type: 'memory',
    ttl: 60 // 1 minute in tests
  },
  templates: {
    ...baseDefaults.templates,
    autoUpdate: false,
    cache: false
  },
  updates: {
    ...baseDefaults.updates,
    checkOnStart: false
  }
};

/**
 * Get defaults for the specified environment
 *
 * @param {string} env - Environment name (development, production, test)
 * @returns {object} Configuration defaults for the environment
 */
function getDefaults(env = process.env.NODE_ENV || 'development') {
  const envDefaults = {
    development: developmentDefaults,
    production: productionDefaults,
    test: testDefaults
  };

  const selectedDefaults = envDefaults[env] || baseDefaults;

  // Deep merge base defaults with environment-specific defaults
  return deepMerge(baseDefaults, selectedDefaults);
}

/**
 * Deep merge two objects
 *
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

/**
 * Check if value is an object
 *
 * @param {*} item - Value to check
 * @returns {boolean} True if value is an object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

module.exports = {
  baseDefaults,
  developmentDefaults,
  productionDefaults,
  testDefaults,
  getDefaults,
  deepMerge
};
