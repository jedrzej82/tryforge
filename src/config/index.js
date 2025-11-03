/**
 * Configuration Manager
 *
 * Main configuration management module for TryForge.
 * Handles loading, merging, validating, and watching configuration.
 */

const EventEmitter = require('events');
const chokidar = require('chokidar');
const { getDefaults } = require('./defaults');
const { loadConfigSync, findConfigFile, findUserConfigFile } = require('./loader');
const { mergeWithPriority, getNestedValue, setNestedValue, getAllPaths } = require('./merge');
const { validateConfig, validateOrThrow } = require('./validator');
const { needsMigration, migrateConfig } = require('./migrator');
const { writeConfig, updateKey } = require('./writer');

/**
 * Configuration Manager Class
 */
class ConfigManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      autoLoad: true,
      validate: true,
      watch: false,
      searchFrom: process.cwd(),
      env: process.env.NODE_ENV || 'development',
      ...options
    };

    this._config = null;
    this._watcher = null;
    this._loaded = false;

    if (this.options.autoLoad) {
      this.load();
    }
  }

  /**
   * Load configuration from all sources
   *
   * @param {object} cliConfig - Configuration from CLI flags
   * @returns {object} Loaded and merged configuration
   */
  load(cliConfig = {}) {
    try {
      // 1. Get defaults for environment
      const defaults = getDefaults(this.options.env);

      // 2. Load from all sources (sync)
      const sources = loadConfigSync({
        searchFrom: this.options.searchFrom,
        ignoreEnv: false,
        ignoreUser: false
      });

      // 3. Extract configs from sources
      const userConfig = sources.user?.config || {};
      const projectConfig = sources.project?.config || {};
      const envConfig = sources.env || {};

      // 4. Merge with priority: defaults < user < project < env < cli
      this._config = mergeWithPriority({
        defaults,
        user: userConfig,
        project: projectConfig,
        env: envConfig,
        cli: cliConfig
      });

      // 5. Check if migration is needed
      const migrationCheck = needsMigration(this._config);
      if (migrationCheck.needed) {
        this.emit('migration-needed', migrationCheck);
      }

      // 6. Validate configuration
      if (this.options.validate) {
        const validation = validateConfig(this._config);

        if (!validation.valid) {
          this.emit('validation-error', validation);
          if (this.options.strict) {
            throw new Error('Configuration validation failed');
          }
        } else if (validation.warnings.length > 0) {
          this.emit('validation-warning', validation.warnings);
        }

        // Use validated config
        this._config = validation.config;
      }

      this._loaded = true;
      this.emit('loaded', this._config);

      // 7. Start watching if enabled
      if (this.options.watch) {
        this.startWatching();
      }

      return this._config;

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Reload configuration
   *
   * @param {object} cliConfig - Configuration from CLI flags
   * @returns {object} Reloaded configuration
   */
  reload(cliConfig = {}) {
    this.stopWatching();
    this._loaded = false;
    return this.load(cliConfig);
  }

  /**
   * Get the current configuration
   *
   * @returns {object} Current configuration
   */
  get() {
    if (!this._loaded) {
      this.load();
    }
    return this._config;
  }

  /**
   * Get a specific configuration value
   *
   * @param {string} key - Configuration key (dot notation)
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Configuration value
   */
  getValue(key, defaultValue = undefined) {
    if (!this._loaded) {
      this.load();
    }
    return getNestedValue(this._config, key, defaultValue);
  }

  /**
   * Set a configuration value (in memory only)
   *
   * @param {string} key - Configuration key (dot notation)
   * @param {*} value - Value to set
   * @returns {object} Updated configuration
   */
  setValue(key, value) {
    if (!this._loaded) {
      this.load();
    }

    setNestedValue(this._config, key, value);
    this.emit('changed', { key, value });

    return this._config;
  }

  /**
   * Set a configuration value and persist to file
   *
   * @param {string} key - Configuration key (dot notation)
   * @param {*} value - Value to set
   * @param {string} target - Target file ('user' or 'project')
   * @returns {Promise<void>}
   */
  async setValueAndSave(key, value, target = 'user') {
    // Update in memory
    this.setValue(key, value);

    // Determine target file
    let filepath;
    if (target === 'user') {
      const { USER_CONFIG_FILE } = require('./loader');
      filepath = USER_CONFIG_FILE;
    } else {
      filepath = findConfigFile(this.options.searchFrom) ||
                  `${this.options.searchFrom}/tryforge.config.json`;
    }

    // Update file
    await updateKey(filepath, key, value);

    this.emit('saved', { key, value, filepath });
  }

  /**
   * Get all configuration keys
   *
   * @returns {Array<string>} Array of configuration keys
   */
  getKeys() {
    if (!this._loaded) {
      this.load();
    }
    return getAllPaths(this._config);
  }

  /**
   * Validate the current configuration
   *
   * @returns {object} Validation result
   */
  validate() {
    if (!this._loaded) {
      this.load();
    }
    return validateConfig(this._config);
  }

  /**
   * Migrate configuration to current version
   *
   * @param {object} options - Migration options
   * @returns {Promise<object>} Migration result
   */
  async migrate(options = {}) {
    if (!this._loaded) {
      this.load();
    }

    const result = await migrateConfig(this._config, options);

    if (result.success && result.migrated) {
      this._config = result.config;
      this.emit('migrated', result);
    }

    return result;
  }

  /**
   * Start watching configuration files for changes
   */
  startWatching() {
    if (this._watcher) {
      return; // Already watching
    }

    const filesToWatch = [];

    // Add project config file if it exists
    const projectFile = findConfigFile(this.options.searchFrom);
    if (projectFile) {
      filesToWatch.push(projectFile);
    }

    // Add user config file if it exists
    const userFile = findUserConfigFile();
    if (userFile) {
      filesToWatch.push(userFile);
    }

    if (filesToWatch.length === 0) {
      return; // No files to watch
    }

    this._watcher = chokidar.watch(filesToWatch, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    this._watcher.on('change', (filepath) => {
      this.emit('file-changed', filepath);

      try {
        this.reload();
        this.emit('reloaded', this._config);
      } catch (error) {
        this.emit('reload-error', error);
      }
    });

    this.emit('watching', filesToWatch);
  }

  /**
   * Stop watching configuration files
   */
  stopWatching() {
    if (this._watcher) {
      this._watcher.close();
      this._watcher = null;
      this.emit('stopped-watching');
    }
  }

  /**
   * Export current configuration to file
   *
   * @param {string} filepath - Target file path
   * @param {object} options - Write options
   * @returns {Promise<void>}
   */
  async export(filepath, options = {}) {
    if (!this._loaded) {
      this.load();
    }

    await writeConfig(filepath, this._config, options);
    this.emit('exported', filepath);
  }

  /**
   * Reset configuration to defaults
   *
   * @param {string} env - Environment (development, production, test)
   * @returns {object} Reset configuration
   */
  reset(env = null) {
    const environment = env || this.options.env;
    this._config = getDefaults(environment);
    this._loaded = true;
    this.emit('reset', environment);
    return this._config;
  }

  /**
   * Get configuration info
   *
   * @returns {object} Configuration metadata
   */
  getInfo() {
    return {
      loaded: this._loaded,
      watching: this._watcher !== null,
      environment: this.options.env,
      projectFile: findConfigFile(this.options.searchFrom),
      userFile: findUserConfigFile(),
      version: this._config?.version || 'unknown'
    };
  }

  /**
   * Destroy the configuration manager
   */
  destroy() {
    this.stopWatching();
    this.removeAllListeners();
    this._config = null;
    this._loaded = false;
  }
}

/**
 * Create a singleton configuration manager instance
 */
let _instance = null;

function getInstance(options = {}) {
  if (!_instance) {
    _instance = new ConfigManager(options);
  }
  return _instance;
}

function resetInstance() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}

/**
 * Convenience functions for quick access
 */
function getConfig(options = {}) {
  return getInstance(options).get();
}

function getValue(key, defaultValue = undefined) {
  return getInstance().getValue(key, defaultValue);
}

function setValue(key, value) {
  return getInstance().setValue(key, value);
}

async function setValueAndSave(key, value, target = 'user') {
  return getInstance().setValueAndSave(key, value, target);
}

function validateCurrentConfig() {
  return getInstance().validate();
}

// Export everything
module.exports = {
  ConfigManager,
  getInstance,
  resetInstance,
  getConfig,
  getValue,
  setValue,
  setValueAndSave,
  validateCurrentConfig,

  // Re-export utilities
  getDefaults,
  loadConfigSync,
  validateConfig,
  validateOrThrow,
  needsMigration,
  migrateConfig
};
