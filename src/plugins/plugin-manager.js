/**
 * Plugin Manager
 * Central manager for all plugin operations
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');
const logger = require('../utils/logger');
const hookSystem = require('./hook-system');
const PluginLoader = require('./plugin-loader');
const PluginAPI = require('./plugin-api');
const PluginSandbox = require('./plugin-sandbox');
const registry = require('./plugin-registry');
const packageJson = require('../../package.json');

class PluginManager extends EventEmitter {
  constructor() {
    super();
    this.loader = new PluginLoader({ hotReload: false });
    this.sandbox = new PluginSandbox();
    this.plugins = new Map();
    this.loadedPlugins = new Map();
    this.pluginApis = new Map();
    this.initialized = false;

    // Default plugin directories
    this.pluginDirs = [
      path.join(os.homedir(), '.tryforge', 'plugins'),
      path.join(process.cwd(), '.tryforge', 'plugins'),
      path.join(__dirname, 'examples')
    ];
  }

  /**
   * Initialize plugin manager
   */
  async init() {
    if (this.initialized) return;

    logger.info('Initializing plugin manager...');

    // Initialize registry
    await registry.init();

    // Ensure plugin directories exist
    for (const dir of this.pluginDirs) {
      await fs.ensureDir(dir);
    }

    // Load enabled plugins
    await this.loadEnabledPlugins();

    this.initialized = true;
    logger.info('Plugin manager initialized');
  }

  /**
   * Load enabled plugins from all plugin directories
   */
  async loadEnabledPlugins() {
    const enabledPlugins = await registry.getEnabled();

    for (const pluginMeta of enabledPlugins) {
      try {
        const pluginPath = this.resolvePluginPath(pluginMeta.name);
        if (pluginPath) {
          await this.load(pluginPath);
        } else {
          logger.warn(`Plugin path not found: ${pluginMeta.name}`);
        }
      } catch (error) {
        logger.error(`Failed to load plugin ${pluginMeta.name}:`, error.message);
      }
    }
  }

  /**
   * Resolve plugin path by name
   * @param {string} name - Plugin name
   * @returns {string|null} Plugin path
   */
  resolvePluginPath(name) {
    for (const dir of this.pluginDirs) {
      const pluginPath = path.join(dir, name);
      if (fs.existsSync(pluginPath)) {
        return pluginPath;
      }
    }
    return null;
  }

  /**
   * Load a plugin
   * @param {string} pluginPath - Path to plugin directory
   * @returns {Promise<Object>} Loaded plugin
   */
  async load(pluginPath) {
    const absolutePath = path.resolve(pluginPath);
    logger.info(`Loading plugin: ${absolutePath}`);

    // Check if already loaded
    if (this.plugins.has(absolutePath)) {
      logger.warn(`Plugin already loaded: ${absolutePath}`);
      return this.plugins.get(absolutePath);
    }

    // Load plugin using loader
    const plugin = await this.loader.load(absolutePath, packageJson.version);

    // Create plugin API
    const api = new PluginAPI({
      name: plugin.metadata.name,
      version: plugin.metadata.version,
      path: absolutePath,
      metadata: plugin.metadata
    });

    this.pluginApis.set(plugin.metadata.name, api);

    // Initialize plugin
    await this.initializePlugin(plugin, api);

    // Store plugin
    this.plugins.set(absolutePath, plugin);
    this.loadedPlugins.set(plugin.metadata.name, {
      ...plugin,
      api,
      loadedAt: new Date().toISOString()
    });

    // Emit event
    this.emit('plugin:loaded', { name: plugin.metadata.name, path: absolutePath });

    logger.info(`Plugin loaded successfully: ${plugin.metadata.name}`);
    return plugin;
  }

  /**
   * Initialize a plugin
   * @param {Object} plugin - Plugin object
   * @param {PluginAPI} api - Plugin API
   */
  async initializePlugin(plugin, api) {
    const { module, metadata } = plugin;

    // Call init or setup method
    if (typeof module.init === 'function') {
      await module.init(api);
    } else if (typeof module.setup === 'function') {
      await module.setup(api);
    } else if (typeof module === 'function') {
      await module(api);
    }

    logger.debug(`Plugin initialized: ${metadata.name}`);
  }

  /**
   * Unload a plugin
   * @param {string} nameOrPath - Plugin name or path
   */
  async unload(nameOrPath) {
    const plugin = this.getPlugin(nameOrPath);
    if (!plugin) {
      throw new Error(`Plugin not found: ${nameOrPath}`);
    }

    logger.info(`Unloading plugin: ${plugin.metadata.name}`);

    // Call destroy method if exists
    if (typeof plugin.module.destroy === 'function') {
      await plugin.module.destroy();
    } else if (typeof plugin.module.cleanup === 'function') {
      await plugin.module.cleanup();
    }

    // Remove from maps
    this.plugins.delete(plugin.path);
    this.loadedPlugins.delete(plugin.metadata.name);
    this.pluginApis.delete(plugin.metadata.name);

    // Unload from loader
    await this.loader.unload(plugin.path);

    // Emit event
    this.emit('plugin:unloaded', { name: plugin.metadata.name });

    logger.info(`Plugin unloaded: ${plugin.metadata.name}`);
  }

  /**
   * Reload a plugin
   * @param {string} nameOrPath - Plugin name or path
   */
  async reload(nameOrPath) {
    const plugin = this.getPlugin(nameOrPath);
    if (!plugin) {
      throw new Error(`Plugin not found: ${nameOrPath}`);
    }

    logger.info(`Reloading plugin: ${plugin.metadata.name}`);

    await this.unload(nameOrPath);
    await this.load(plugin.path);

    logger.info(`Plugin reloaded: ${plugin.metadata.name}`);
  }

  /**
   * Install a plugin
   * @param {string} source - Plugin source (path, npm package, git url)
   * @param {Object} options - Installation options
   */
  async install(source, options = {}) {
    logger.info(`Installing plugin: ${source}`);

    let pluginPath;

    // Determine source type
    if (source.startsWith('http://') || source.startsWith('https://') || source.includes('.git')) {
      // Git repository
      pluginPath = await this.installFromGit(source, options);
    } else if (source.startsWith('.') || source.startsWith('/') || source.startsWith('~')) {
      // Local path
      pluginPath = await this.installFromLocal(source, options);
    } else {
      // NPM package
      pluginPath = await this.installFromNpm(source, options);
    }

    // Load plugin metadata
    const packagePath = path.join(pluginPath, 'package.json');
    const metadata = await fs.readJson(packagePath);

    // Register plugin
    await registry.register(metadata.name, {
      ...metadata,
      path: pluginPath,
      source,
      installedAt: new Date().toISOString()
    });

    // Load plugin if auto-load is enabled
    if (!options.noLoad) {
      await this.load(pluginPath);
    }

    logger.info(`Plugin installed: ${metadata.name}`);
    return { name: metadata.name, path: pluginPath };
  }

  /**
   * Install plugin from local path
   * @param {string} source - Local path
   * @param {Object} options - Options
   */
  async installFromLocal(source, options = {}) {
    const sourcePath = path.resolve(source);

    if (!await fs.pathExists(sourcePath)) {
      throw new Error(`Plugin path does not exist: ${sourcePath}`);
    }

    // Get plugin name from package.json
    const packagePath = path.join(sourcePath, 'package.json');
    const metadata = await fs.readJson(packagePath);

    // Copy to plugins directory
    const targetPath = path.join(this.pluginDirs[0], metadata.name);

    if (options.symlink) {
      // Create symlink for development
      await fs.ensureSymlink(sourcePath, targetPath);
      logger.info(`Created symlink: ${targetPath} -> ${sourcePath}`);
    } else {
      // Copy plugin
      await fs.copy(sourcePath, targetPath);
      logger.info(`Copied plugin to: ${targetPath}`);
    }

    return targetPath;
  }

  /**
   * Install plugin from NPM
   * @param {string} packageName - NPM package name
   * @param {Object} options - Options
   */
  async installFromNpm(packageName, options = {}) {
    const { execa } = require('execa');
    const targetDir = this.pluginDirs[0];

    logger.info(`Installing from NPM: ${packageName}`);

    // Run npm install in plugins directory
    await execa('npm', ['install', packageName, '--prefix', targetDir], {
      stdio: options.verbose ? 'inherit' : 'pipe'
    });

    // Find installed package
    const pluginPath = path.join(targetDir, 'node_modules', packageName);

    if (!await fs.pathExists(pluginPath)) {
      throw new Error(`Failed to install plugin: ${packageName}`);
    }

    return pluginPath;
  }

  /**
   * Install plugin from Git
   * @param {string} gitUrl - Git repository URL
   * @param {Object} options - Options
   */
  async installFromGit(gitUrl, options = {}) {
    const { execa } = require('execa');

    // Extract repo name from URL
    const repoName = gitUrl.split('/').pop().replace('.git', '');
    const targetPath = path.join(this.pluginDirs[0], repoName);

    logger.info(`Cloning from Git: ${gitUrl}`);

    // Clone repository
    await execa('git', ['clone', gitUrl, targetPath], {
      stdio: options.verbose ? 'inherit' : 'pipe'
    });

    // Install dependencies
    if (await fs.pathExists(path.join(targetPath, 'package.json'))) {
      logger.info('Installing plugin dependencies...');
      await execa('npm', ['install'], {
        cwd: targetPath,
        stdio: options.verbose ? 'inherit' : 'pipe'
      });
    }

    return targetPath;
  }

  /**
   * Uninstall a plugin
   * @param {string} name - Plugin name
   */
  async uninstall(name) {
    logger.info(`Uninstalling plugin: ${name}`);

    // Unload if loaded
    if (this.loadedPlugins.has(name)) {
      await this.unload(name);
    }

    // Get plugin info
    const pluginInfo = await registry.get(name);
    if (!pluginInfo) {
      throw new Error(`Plugin not found in registry: ${name}`);
    }

    // Remove plugin directory
    const pluginPath = pluginInfo.path || this.resolvePluginPath(name);
    if (pluginPath && await fs.pathExists(pluginPath)) {
      await fs.remove(pluginPath);
      logger.info(`Removed plugin directory: ${pluginPath}`);
    }

    // Unregister
    await registry.unregister(name);

    logger.info(`Plugin uninstalled: ${name}`);
  }

  /**
   * Enable a plugin
   * @param {string} name - Plugin name
   */
  async enable(name) {
    await registry.enable(name);

    // Load if not loaded
    if (!this.loadedPlugins.has(name)) {
      const pluginPath = this.resolvePluginPath(name);
      if (pluginPath) {
        await this.load(pluginPath);
      }
    }

    logger.info(`Plugin enabled: ${name}`);
  }

  /**
   * Disable a plugin
   * @param {string} name - Plugin name
   */
  async disable(name) {
    await registry.disable(name);

    // Unload if loaded
    if (this.loadedPlugins.has(name)) {
      await this.unload(name);
    }

    logger.info(`Plugin disabled: ${name}`);
  }

  /**
   * Get plugin by name or path
   * @param {string} nameOrPath - Plugin name or path
   * @returns {Object|null}
   */
  getPlugin(nameOrPath) {
    // Try by name
    if (this.loadedPlugins.has(nameOrPath)) {
      return this.loadedPlugins.get(nameOrPath);
    }

    // Try by path
    const absolutePath = path.resolve(nameOrPath);
    if (this.plugins.has(absolutePath)) {
      return this.plugins.get(absolutePath);
    }

    return null;
  }

  /**
   * Get all loaded plugins
   * @returns {Array<Object>}
   */
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get plugin API
   * @param {string} name - Plugin name
   * @returns {PluginAPI|null}
   */
  getPluginAPI(name) {
    return this.pluginApis.get(name) || null;
  }

  /**
   * List all plugins
   * @param {Object} options - List options
   * @returns {Promise<Array<Object>>}
   */
  async list(options = {}) {
    const allPlugins = await registry.getAll();

    return allPlugins.map(plugin => ({
      ...plugin,
      loaded: this.loadedPlugins.has(plugin.name),
      path: plugin.path || this.resolvePluginPath(plugin.name)
    }));
  }

  /**
   * Search for plugins
   * @param {string} query - Search query
   * @returns {Promise<Array<Object>>}
   */
  async search(query) {
    return await registry.search({ keyword: query });
  }

  /**
   * Get plugin info
   * @param {string} name - Plugin name
   * @returns {Promise<Object|null>}
   */
  async getInfo(name) {
    const registryInfo = await registry.get(name);
    const loaded = this.loadedPlugins.get(name);

    if (!registryInfo) return null;

    return {
      ...registryInfo,
      loaded: !!loaded,
      api: loaded ? loaded.api : null
    };
  }

  /**
   * Get manager statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    const registryStats = await registry.getStats();
    const loaded = this.loadedPlugins.size;

    return {
      ...registryStats,
      loaded,
      directories: this.pluginDirs.length
    };
  }

  /**
   * Cleanup - unload all plugins
   */
  async cleanup() {
    logger.info('Cleaning up plugin manager...');

    const plugins = Array.from(this.loadedPlugins.keys());
    for (const name of plugins) {
      try {
        await this.unload(name);
      } catch (error) {
        logger.error(`Error unloading plugin ${name}:`, error);
      }
    }

    await this.loader.cleanup();
    logger.info('Plugin manager cleanup completed');
  }
}

// Create singleton instance
const pluginManager = new PluginManager();

// Hook points for plugin system
const HOOK_POINTS = {
  // Project lifecycle
  'before:create': 'Before project creation',
  'after:create': 'After project creation',

  // Code generation
  'before:generate': 'Before code generation',
  'after:generate': 'After code generation',

  // Build
  'before:build': 'Before build',
  'after:build': 'After build',

  // Deploy
  'before:deploy': 'Before deployment',
  'after:deploy': 'After deployment',

  // Database
  'before:migrate': 'Before database migration',
  'after:migrate': 'After database migration',

  // Testing
  'before:test': 'Before running tests',
  'after:test': 'After running tests',

  // Templates
  'template:load': 'When loading templates',
  'template:render': 'When rendering templates',

  // CLI
  'cli:init': 'CLI initialization',
  'cli:command': 'Before CLI command execution'
};

module.exports = {
  pluginManager,
  hookSystem,
  HOOK_POINTS
};
