/**
 * Plugin Loader
 * Loads and validates plugins from directories
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const PluginValidator = require('./plugin-validator');

class PluginLoader {
  constructor(options = {}) {
    this.options = {
      validateCode: true,
      hotReload: false,
      ...options
    };
    this.loadedModules = new Map();
    this.watchers = new Map();
  }

  /**
   * Load a plugin from directory
   * @param {string} pluginPath - Path to plugin directory
   * @param {string} tryforgeVersion - Current TryForge version
   * @returns {Promise<Object>} Loaded plugin
   */
  async load(pluginPath, tryforgeVersion) {
    logger.info(`Loading plugin from: ${pluginPath}`);

    // Validate plugin
    const validation = await PluginValidator.validate(pluginPath, tryforgeVersion);

    if (!validation.valid) {
      throw new Error(
        `Plugin validation failed:\n${validation.errors.join('\n')}`
      );
    }

    // Log warnings
    if (validation.warnings.length > 0) {
      logger.warn(`Plugin warnings:\n${validation.warnings.join('\n')}`);
    }

    // Load main module
    const mainFile = validation.metadata.main || 'index.js';
    const mainPath = path.join(pluginPath, mainFile);

    let pluginModule;
    try {
      // Clear cache for hot reload
      if (this.loadedModules.has(pluginPath)) {
        delete require.cache[require.resolve(mainPath)];
      }

      pluginModule = require(mainPath);
      this.loadedModules.set(pluginPath, mainPath);
    } catch (error) {
      throw new Error(`Failed to load plugin module: ${error.message}`);
    }

    // Validate plugin exports
    this.validatePluginModule(pluginModule, validation.metadata);

    // Setup hot reload if enabled
    if (this.options.hotReload) {
      this.setupHotReload(pluginPath, mainPath);
    }

    return {
      module: pluginModule,
      metadata: validation.metadata,
      path: pluginPath,
      mainFile: mainPath
    };
  }

  /**
   * Load plugins from a directory
   * @param {string} dir - Directory containing plugins
   * @param {string} tryforgeVersion - Current TryForge version
   * @returns {Promise<Array<Object>>} Loaded plugins
   */
  async loadFromDirectory(dir, tryforgeVersion) {
    if (!await fs.pathExists(dir)) {
      logger.warn(`Plugin directory does not exist: ${dir}`);
      return [];
    }

    const plugins = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const pluginPath = path.join(dir, entry.name);

        try {
          const plugin = await this.load(pluginPath, tryforgeVersion);
          plugins.push(plugin);
        } catch (error) {
          logger.error(`Failed to load plugin ${entry.name}:`, error.message);
        }
      }
    }

    logger.info(`Loaded ${plugins.length} plugins from ${dir}`);
    return plugins;
  }

  /**
   * Validate plugin module exports
   * @param {*} pluginModule - Plugin module
   * @param {Object} metadata - Plugin metadata
   */
  validatePluginModule(pluginModule, metadata) {
    if (!pluginModule) {
      throw new Error('Plugin module is empty');
    }

    // Check for required exports
    if (typeof pluginModule !== 'object' && typeof pluginModule !== 'function') {
      throw new Error('Plugin must export an object or function');
    }

    // If it's an object, check for required methods
    if (typeof pluginModule === 'object') {
      if (!pluginModule.name) {
        logger.warn('Plugin does not export a name property');
      }

      if (!pluginModule.init && !pluginModule.setup) {
        logger.warn('Plugin does not export init() or setup() method');
      }
    }

    // Validate plugin type-specific requirements
    const pluginType = metadata.tryforge?.type;
    if (pluginType) {
      this.validatePluginType(pluginModule, pluginType);
    }
  }

  /**
   * Validate plugin type-specific requirements
   * @param {*} pluginModule - Plugin module
   * @param {string} type - Plugin type
   */
  validatePluginType(pluginModule, type) {
    switch (type) {
      case 'template':
        if (!pluginModule.templates && !pluginModule.getTemplates) {
          logger.warn('Template plugin should export templates or getTemplates()');
        }
        break;

      case 'generator':
        if (!pluginModule.generate) {
          logger.warn('Generator plugin should export generate() method');
        }
        break;

      case 'transformer':
        if (!pluginModule.transform) {
          logger.warn('Transformer plugin should export transform() method');
        }
        break;

      case 'cli':
        if (!pluginModule.commands && !pluginModule.getCommands) {
          logger.warn('CLI plugin should export commands or getCommands()');
        }
        break;

      case 'integration':
        if (!pluginModule.connect && !pluginModule.initialize) {
          logger.warn('Integration plugin should export connect() or initialize()');
        }
        break;
    }
  }

  /**
   * Setup hot reload for a plugin
   * @param {string} pluginPath - Plugin path
   * @param {string} mainPath - Main file path
   */
  setupHotReload(pluginPath, mainPath) {
    const chokidar = require('chokidar');

    const watcher = chokidar.watch(pluginPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      ignoreInitial: true,
      persistent: true
    });

    watcher.on('change', (changedPath) => {
      logger.info(`Plugin file changed: ${changedPath}`);
      this.emit('reload', pluginPath);
    });

    this.watchers.set(pluginPath, watcher);
    logger.debug(`Hot reload enabled for: ${pluginPath}`);
  }

  /**
   * Unload a plugin
   * @param {string} pluginPath - Plugin path
   */
  async unload(pluginPath) {
    // Remove from cache
    const mainPath = this.loadedModules.get(pluginPath);
    if (mainPath) {
      delete require.cache[require.resolve(mainPath)];
      this.loadedModules.delete(pluginPath);
    }

    // Stop watching
    const watcher = this.watchers.get(pluginPath);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(pluginPath);
    }

    logger.info(`Plugin unloaded: ${pluginPath}`);
  }

  /**
   * Reload a plugin
   * @param {string} pluginPath - Plugin path
   * @param {string} tryforgeVersion - Current TryForge version
   * @returns {Promise<Object>} Reloaded plugin
   */
  async reload(pluginPath, tryforgeVersion) {
    await this.unload(pluginPath);
    return await this.load(pluginPath, tryforgeVersion);
  }

  /**
   * Get loaded plugin paths
   * @returns {Array<string>}
   */
  getLoadedPaths() {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * Check if a plugin is loaded
   * @param {string} pluginPath - Plugin path
   * @returns {boolean}
   */
  isLoaded(pluginPath) {
    return this.loadedModules.has(pluginPath);
  }

  /**
   * Clean up all watchers
   */
  async cleanup() {
    for (const watcher of this.watchers.values()) {
      await watcher.close();
    }
    this.watchers.clear();
    logger.debug('Plugin loader cleanup completed');
  }
}

module.exports = PluginLoader;
