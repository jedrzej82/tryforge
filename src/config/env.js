/**
 * Environment Variable Handler
 *
 * This module handles loading and parsing environment variables for TryForge.
 * It supports:
 * - Loading from .env files
 * - Parsing TRYFORGE_* prefixed variables
 * - Converting to nested configuration objects
 * - Type coercion (strings to numbers, booleans, etc.)
 */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

/**
 * Load environment variables from .env file
 *
 * @param {string} envPath - Path to .env file (optional)
 * @returns {object} Loaded environment variables
 */
function loadEnvFile(envPath = null) {
  // Try to load from specified path or default locations
  const paths = envPath ? [envPath] : [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.env.HOME || process.env.USERPROFILE, '.tryforge', '.env')
  ];

  for (const filePath of paths) {
    if (fs.existsSync(filePath)) {
      const result = dotenv.config({ path: filePath });
      if (!result.error) {
        return result.parsed || {};
      }
    }
  }

  return {};
}

/**
 * Parse environment variables into configuration object
 *
 * @returns {object} Configuration object from environment variables
 */
function parseEnvConfig() {
  const config = {};
  const prefix = 'TRYFORGE_';

  // Get all TRYFORGE_* environment variables
  Object.keys(process.env)
    .filter(key => key.startsWith(prefix))
    .forEach(key => {
      // Remove prefix and convert to lowercase
      const configKey = key.substring(prefix.length).toLowerCase();

      // Split by underscore to create nested paths
      // Example: TRYFORGE_AI_API_KEY -> ai.apiKey
      const parts = configKey.split('_');
      const value = parseValue(process.env[key]);

      // Build nested object
      setNestedValue(config, parts, value);
    });

  // Handle special database URL format
  if (process.env.TRYFORGE_DATABASE_URL) {
    const dbConfig = parseDatabaseUrl(process.env.TRYFORGE_DATABASE_URL);
    if (dbConfig) {
      config.database = { ...config.database, ...dbConfig };
    }
  }

  // Handle special cases for common environment variables
  if (process.env.NODE_ENV) {
    config.env = process.env.NODE_ENV;
  }

  if (process.env.PORT) {
    if (!config.server) config.server = {};
    config.server.port = parseInt(process.env.PORT, 10);
  }

  if (process.env.LOG_LEVEL || process.env.TRYFORGE_LOG_LEVEL) {
    config.logLevel = process.env.TRYFORGE_LOG_LEVEL || process.env.LOG_LEVEL;
  }

  return config;
}

/**
 * Parse a value from string to appropriate type
 *
 * @param {string} value - String value to parse
 * @returns {*} Parsed value (string, number, boolean, null, array)
 */
function parseValue(value) {
  if (!value || value === '') {
    return null;
  }

  // Boolean values
  if (value.toLowerCase() === 'true') {
    return true;
  }
  if (value.toLowerCase() === 'false') {
    return false;
  }

  // Null/undefined
  if (value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined') {
    return null;
  }

  // Numbers (integers and floats)
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // Arrays (comma-separated values)
  if (value.includes(',')) {
    return value.split(',').map(v => v.trim()).filter(v => v !== '');
  }

  // JSON objects/arrays
  if ((value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // If parsing fails, return as string
      return value;
    }
  }

  // Default: return as string
  return value;
}

/**
 * Set a value in a nested object using a path array
 *
 * @param {object} obj - Target object
 * @param {Array<string>} path - Path array (e.g., ['ai', 'api', 'key'])
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
  const lastKey = path[path.length - 1];
  const targetObj = path.slice(0, -1).reduce((current, key) => {
    // Convert to camelCase for nested keys
    const camelKey = toCamelCase(key);
    if (!current[camelKey]) {
      current[camelKey] = {};
    }
    return current[camelKey];
  }, obj);

  // Set the final value using camelCase key
  targetObj[toCamelCase(lastKey)] = value;
}

/**
 * Convert string to camelCase
 *
 * @param {string} str - String to convert
 * @returns {string} CamelCase string
 */
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Parse database URL into configuration object
 * Format: protocol://username:password@host:port/database?options
 *
 * @param {string} url - Database URL
 * @returns {object|null} Database configuration object
 */
function parseDatabaseUrl(url) {
  try {
    // Match pattern: protocol://username:password@host:port/database
    const pattern = /^(\w+):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?.*)?$/;
    const match = url.match(pattern);

    if (!match) {
      // Try simpler pattern without password
      const simplePattern = /^(\w+):\/\/([^@]+)@([^:]+):(\d+)\/(.+?)(\?.*)?$/;
      const simpleMatch = url.match(simplePattern);

      if (simpleMatch) {
        const [, provider, username, host, port, name] = simpleMatch;
        return {
          provider: normalizeProvider(provider),
          username,
          host,
          port: parseInt(port, 10),
          name,
          password: null
        };
      }

      return null;
    }

    const [, provider, username, password, host, port, name, options] = match;

    const config = {
      provider: normalizeProvider(provider),
      username,
      password,
      host,
      port: parseInt(port, 10),
      name
    };

    // Parse query string options if present
    if (options) {
      const params = new URLSearchParams(options);
      if (params.get('ssl') === 'true') {
        config.ssl = true;
      }
    }

    return config;
  } catch (error) {
    console.error('Failed to parse database URL:', error.message);
    return null;
  }
}

/**
 * Normalize database provider name
 *
 * @param {string} provider - Provider name from URL
 * @returns {string} Normalized provider name
 */
function normalizeProvider(provider) {
  const providers = {
    postgres: 'postgresql',
    postgresql: 'postgresql',
    pg: 'postgresql',
    mysql: 'mysql',
    mariadb: 'mysql',
    sqlite: 'sqlite',
    sqlite3: 'sqlite',
    mongodb: 'mongodb',
    mongo: 'mongodb'
  };

  return providers[provider.toLowerCase()] || provider;
}

/**
 * Get all environment variable names with TRYFORGE_ prefix
 *
 * @returns {Array<string>} Array of environment variable names
 */
function getEnvVarNames() {
  return Object.keys(process.env)
    .filter(key => key.startsWith('TRYFORGE_'))
    .sort();
}

/**
 * Check if a specific environment variable is set
 *
 * @param {string} name - Variable name (without TRYFORGE_ prefix)
 * @returns {boolean} True if variable is set
 */
function hasEnvVar(name) {
  const fullName = name.startsWith('TRYFORGE_') ? name : `TRYFORGE_${name}`;
  return process.env[fullName] !== undefined;
}

/**
 * Get environment variable value
 *
 * @param {string} name - Variable name (without TRYFORGE_ prefix)
 * @param {*} defaultValue - Default value if not set
 * @returns {*} Environment variable value or default
 */
function getEnvVar(name, defaultValue = null) {
  const fullName = name.startsWith('TRYFORGE_') ? name : `TRYFORGE_${name}`;
  const value = process.env[fullName];
  return value !== undefined ? parseValue(value) : defaultValue;
}

/**
 * Set environment variable
 *
 * @param {string} name - Variable name (without TRYFORGE_ prefix)
 * @param {*} value - Value to set
 */
function setEnvVar(name, value) {
  const fullName = name.startsWith('TRYFORGE_') ? name : `TRYFORGE_${name}`;
  process.env[fullName] = String(value);
}

/**
 * Validate environment variables
 *
 * @returns {object} Validation result with errors and warnings
 */
function validateEnv() {
  const errors = [];
  const warnings = [];

  // Check for required variables
  const requiredVars = [];

  for (const varName of requiredVars) {
    if (!hasEnvVar(varName)) {
      errors.push(`Required environment variable ${varName} is not set`);
    }
  }

  // Check for deprecated variables
  const deprecatedVars = {};

  for (const [oldVar, newVar] of Object.entries(deprecatedVars)) {
    if (hasEnvVar(oldVar)) {
      warnings.push(`Environment variable ${oldVar} is deprecated. Use ${newVar} instead.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  loadEnvFile,
  parseEnvConfig,
  parseValue,
  parseDatabaseUrl,
  getEnvVarNames,
  hasEnvVar,
  getEnvVar,
  setEnvVar,
  validateEnv,
  toCamelCase
};
