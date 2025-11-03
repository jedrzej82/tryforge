/**
 * Configuration Loader
 *
 * This module handles loading configuration from multiple sources:
 * - JavaScript files (tryforge.config.js)
 * - JSON files (.tryforgerc, tryforge.config.json)
 * - YAML files (.tryforgerc.yaml, .tryforgerc.yml)
 * - package.json (tryforge field)
 * - User home directory (~/.tryforge/config.json)
 * - Environment variables (TRYFORGE_*)
 */

const { cosmiconfig, cosmiconfigSync } = require('cosmiconfig');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ini = require('ini');
const { loadEnvFile, parseEnvConfig } = require('./env');

const CONFIG_NAME = 'tryforge';
const USER_CONFIG_DIR = path.join(os.homedir(), '.tryforge');
const USER_CONFIG_FILE = path.join(USER_CONFIG_DIR, 'config.json');

/**
 * Load configuration from all sources
 *
 * @param {object} options - Load options
 * @param {string} options.searchFrom - Directory to start searching from
 * @param {boolean} options.ignoreEnv - Ignore environment variables
 * @param {boolean} options.ignoreUser - Ignore user config file
 * @param {boolean} options.sync - Use synchronous loading
 * @returns {Promise<object>|object} Loaded configuration
 */
function loadConfig(options = {}) {
  const {
    searchFrom = process.cwd(),
    ignoreEnv = false,
    ignoreUser = false,
    sync = false
  } = options;

  if (sync) {
    return loadConfigSync({ searchFrom, ignoreEnv, ignoreUser });
  }

  return loadConfigAsync({ searchFrom, ignoreEnv, ignoreUser });
}

/**
 * Load configuration asynchronously
 *
 * @param {object} options - Load options
 * @returns {Promise<object>} Loaded configuration
 */
async function loadConfigAsync({ searchFrom, ignoreEnv, ignoreUser }) {
  const configs = {};

  // 1. Load environment variables
  if (!ignoreEnv) {
    loadEnvFile();
    configs.env = parseEnvConfig();
  }

  // 2. Load user config from home directory
  if (!ignoreUser) {
    configs.user = await loadUserConfig();
  }

  // 3. Load project config using cosmiconfig
  configs.project = await loadProjectConfig(searchFrom);

  return {
    env: configs.env || {},
    user: configs.user || {},
    project: configs.project || {}
  };
}

/**
 * Load configuration synchronously
 *
 * @param {object} options - Load options
 * @returns {object} Loaded configuration
 */
function loadConfigSync({ searchFrom, ignoreEnv, ignoreUser }) {
  const configs = {};

  // 1. Load environment variables
  if (!ignoreEnv) {
    loadEnvFile();
    configs.env = parseEnvConfig();
  }

  // 2. Load user config from home directory
  if (!ignoreUser) {
    configs.user = loadUserConfigSync();
  }

  // 3. Load project config using cosmiconfig
  configs.project = loadProjectConfigSync(searchFrom);

  return {
    env: configs.env || {},
    user: configs.user || {},
    project: configs.project || {}
  };
}

/**
 * Load project configuration using cosmiconfig (async)
 *
 * @param {string} searchFrom - Directory to start searching from
 * @returns {Promise<object|null>} Configuration object or null
 */
async function loadProjectConfig(searchFrom) {
  try {
    const explorer = cosmiconfig(CONFIG_NAME, {
      searchPlaces: [
        'package.json',
        `.${CONFIG_NAME}rc`,
        `.${CONFIG_NAME}rc.json`,
        `.${CONFIG_NAME}rc.yaml`,
        `.${CONFIG_NAME}rc.yml`,
        `.${CONFIG_NAME}rc.js`,
        `.${CONFIG_NAME}rc.cjs`,
        `${CONFIG_NAME}.config.js`,
        `${CONFIG_NAME}.config.cjs`,
        `${CONFIG_NAME}.config.json`
      ],
      loaders: {
        '.ini': loadIniFile
      }
    });

    const result = await explorer.search(searchFrom);

    if (result && !result.isEmpty) {
      return {
        config: result.config,
        filepath: result.filepath
      };
    }

    return null;
  } catch (error) {
    console.error('Error loading project config:', error.message);
    return null;
  }
}

/**
 * Load project configuration using cosmiconfig (sync)
 *
 * @param {string} searchFrom - Directory to start searching from
 * @returns {object|null} Configuration object or null
 */
function loadProjectConfigSync(searchFrom) {
  try {
    const explorer = cosmiconfigSync(CONFIG_NAME, {
      searchPlaces: [
        'package.json',
        `.${CONFIG_NAME}rc`,
        `.${CONFIG_NAME}rc.json`,
        `.${CONFIG_NAME}rc.yaml`,
        `.${CONFIG_NAME}rc.yml`,
        `.${CONFIG_NAME}rc.js`,
        `.${CONFIG_NAME}rc.cjs`,
        `${CONFIG_NAME}.config.js`,
        `${CONFIG_NAME}.config.cjs`,
        `${CONFIG_NAME}.config.json`
      ],
      loaders: {
        '.ini': loadIniFile
      }
    });

    const result = explorer.search(searchFrom);

    if (result && !result.isEmpty) {
      return {
        config: result.config,
        filepath: result.filepath
      };
    }

    return null;
  } catch (error) {
    console.error('Error loading project config:', error.message);
    return null;
  }
}

/**
 * Load user configuration from home directory (async)
 *
 * @returns {Promise<object|null>} Configuration object or null
 */
async function loadUserConfig() {
  try {
    if (fs.existsSync(USER_CONFIG_FILE)) {
      const content = await fs.promises.readFile(USER_CONFIG_FILE, 'utf8');
      return {
        config: JSON.parse(content),
        filepath: USER_CONFIG_FILE
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading user config:', error.message);
    return null;
  }
}

/**
 * Load user configuration from home directory (sync)
 *
 * @returns {object|null} Configuration object or null
 */
function loadUserConfigSync() {
  try {
    if (fs.existsSync(USER_CONFIG_FILE)) {
      const content = fs.readFileSync(USER_CONFIG_FILE, 'utf8');
      return {
        config: JSON.parse(content),
        filepath: USER_CONFIG_FILE
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading user config:', error.message);
    return null;
  }
}

/**
 * Load INI file format
 *
 * @param {string} filepath - Path to INI file
 * @param {string} content - File content
 * @returns {object} Parsed configuration
 */
function loadIniFile(filepath, content) {
  try {
    return ini.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse INI file ${filepath}: ${error.message}`);
  }
}

/**
 * Find project config file path
 *
 * @param {string} searchFrom - Directory to start searching from
 * @returns {string|null} Config file path or null
 */
function findConfigFile(searchFrom = process.cwd()) {
  const result = loadProjectConfigSync(searchFrom);
  return result ? result.filepath : null;
}

/**
 * Find user config file path
 *
 * @returns {string|null} Config file path or null
 */
function findUserConfigFile() {
  return fs.existsSync(USER_CONFIG_FILE) ? USER_CONFIG_FILE : null;
}

/**
 * Load configuration from a specific file
 *
 * @param {string} filepath - Path to config file
 * @returns {Promise<object>} Configuration object
 */
async function loadFromFile(filepath) {
  try {
    const ext = path.extname(filepath);
    const content = await fs.promises.readFile(filepath, 'utf8');

    switch (ext) {
      case '.json':
        return JSON.parse(content);

      case '.js':
      case '.cjs':
        // Require JavaScript config files
        delete require.cache[require.resolve(filepath)];
        return require(filepath);

      case '.ini':
        return ini.parse(content);

      case '.yaml':
      case '.yml':
        // Require yaml parser
        const yaml = require('js-yaml');
        return yaml.load(content);

      default:
        // Try parsing as JSON by default
        return JSON.parse(content);
    }
  } catch (error) {
    throw new Error(`Failed to load config from ${filepath}: ${error.message}`);
  }
}

/**
 * Load configuration from a specific file (sync)
 *
 * @param {string} filepath - Path to config file
 * @returns {object} Configuration object
 */
function loadFromFileSync(filepath) {
  try {
    const ext = path.extname(filepath);
    const content = fs.readFileSync(filepath, 'utf8');

    switch (ext) {
      case '.json':
        return JSON.parse(content);

      case '.js':
      case '.cjs':
        // Require JavaScript config files
        delete require.cache[require.resolve(filepath)];
        return require(filepath);

      case '.ini':
        return ini.parse(content);

      case '.yaml':
      case '.yml':
        // Require yaml parser
        const yaml = require('js-yaml');
        return yaml.load(content);

      default:
        // Try parsing as JSON by default
        return JSON.parse(content);
    }
  } catch (error) {
    throw new Error(`Failed to load config from ${filepath}: ${error.message}`);
  }
}

/**
 * Get all possible config file locations
 *
 * @param {string} searchFrom - Directory to start searching from
 * @returns {Array<string>} Array of possible config file paths
 */
function getConfigFilePaths(searchFrom = process.cwd()) {
  return [
    // Project configs
    path.join(searchFrom, 'package.json'),
    path.join(searchFrom, `.${CONFIG_NAME}rc`),
    path.join(searchFrom, `.${CONFIG_NAME}rc.json`),
    path.join(searchFrom, `.${CONFIG_NAME}rc.yaml`),
    path.join(searchFrom, `.${CONFIG_NAME}rc.yml`),
    path.join(searchFrom, `.${CONFIG_NAME}rc.js`),
    path.join(searchFrom, `${CONFIG_NAME}.config.js`),
    path.join(searchFrom, `${CONFIG_NAME}.config.json`),
    // User config
    USER_CONFIG_FILE
  ];
}

/**
 * Check if config file exists at path
 *
 * @param {string} filepath - Path to check
 * @returns {boolean} True if file exists
 */
function configFileExists(filepath) {
  return fs.existsSync(filepath);
}

/**
 * Initialize user config directory
 *
 * @returns {Promise<void>}
 */
async function initUserConfigDir() {
  try {
    if (!fs.existsSync(USER_CONFIG_DIR)) {
      await fs.promises.mkdir(USER_CONFIG_DIR, { recursive: true });
    }

    // Create subdirectories
    const subdirs = ['templates', 'cache', 'plugins', 'backups'];
    for (const subdir of subdirs) {
      const dirPath = path.join(USER_CONFIG_DIR, subdir);
      if (!fs.existsSync(dirPath)) {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }
    }
  } catch (error) {
    throw new Error(`Failed to initialize user config directory: ${error.message}`);
  }
}

/**
 * Initialize user config directory (sync)
 *
 * @returns {void}
 */
function initUserConfigDirSync() {
  try {
    if (!fs.existsSync(USER_CONFIG_DIR)) {
      fs.mkdirSync(USER_CONFIG_DIR, { recursive: true });
    }

    // Create subdirectories
    const subdirs = ['templates', 'cache', 'plugins', 'backups'];
    for (const subdir of subdirs) {
      const dirPath = path.join(USER_CONFIG_DIR, subdir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  } catch (error) {
    throw new Error(`Failed to initialize user config directory: ${error.message}`);
  }
}

module.exports = {
  loadConfig,
  loadConfigAsync,
  loadConfigSync,
  loadProjectConfig,
  loadProjectConfigSync,
  loadUserConfig,
  loadUserConfigSync,
  findConfigFile,
  findUserConfigFile,
  loadFromFile,
  loadFromFileSync,
  getConfigFilePaths,
  configFileExists,
  initUserConfigDir,
  initUserConfigDirSync,
  USER_CONFIG_DIR,
  USER_CONFIG_FILE,
  CONFIG_NAME
};
