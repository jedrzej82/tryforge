/**
 * Plugin Sandbox
 * Provides sandboxed execution environment for plugins
 */

const vm = require('vm');
const path = require('path');
const logger = require('../utils/logger');

class PluginSandbox {
  constructor(options = {}) {
    this.options = {
      timeout: 30000, // 30 seconds default timeout
      allowedModules: [
        'path',
        'util',
        'crypto',
        'stream',
        'events',
        'url',
        'querystring',
        'string_decoder'
      ],
      ...options
    };
  }

  /**
   * Create a sandboxed context for plugin
   * @param {Object} pluginApi - Plugin API instance
   * @param {Object} metadata - Plugin metadata
   * @returns {Object} Sandbox context
   */
  createContext(pluginApi, metadata) {
    const sandbox = {
      // Standard globals
      console: this.createSafeConsole(metadata.name),
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Buffer,
      process: this.createSafeProcess(),

      // Plugin API
      api: pluginApi,

      // Safe require
      require: this.createSafeRequire(metadata),

      // Module exports
      module: { exports: {} },
      exports: {}
    };

    // Create VM context
    const context = vm.createContext(sandbox);

    return context;
  }

  /**
   * Create safe console for plugin
   * @param {string} pluginName - Plugin name
   * @returns {Object}
   */
  createSafeConsole(pluginName) {
    return {
      log: (...args) => logger.info(`[${pluginName}]`, ...args),
      info: (...args) => logger.info(`[${pluginName}]`, ...args),
      warn: (...args) => logger.warn(`[${pluginName}]`, ...args),
      error: (...args) => logger.error(`[${pluginName}]`, ...args),
      debug: (...args) => logger.debug(`[${pluginName}]`, ...args)
    };
  }

  /**
   * Create safe process object
   * @returns {Object}
   */
  createSafeProcess() {
    return {
      env: { ...process.env }, // Copy of env vars
      cwd: () => process.cwd(),
      version: process.version,
      versions: { ...process.versions },
      platform: process.platform,
      arch: process.arch,
      uptime: () => process.uptime(),
      memoryUsage: () => process.memoryUsage()
    };
  }

  /**
   * Create safe require function
   * @param {Object} metadata - Plugin metadata
   * @returns {Function}
   */
  createSafeRequire(metadata) {
    const allowedModules = this.options.allowedModules;
    const pluginName = metadata.name;

    return (moduleName) => {
      // Check if module is allowed
      if (!allowedModules.includes(moduleName)) {
        const permissions = metadata.tryforge?.permissions || [];

        // Check for specific permissions
        if (moduleName === 'fs' || moduleName === 'fs-extra') {
          if (!permissions.includes('filesystem:read') && !permissions.includes('filesystem:write')) {
            throw new Error(`Plugin ${pluginName} does not have filesystem permission`);
          }
        }

        if (moduleName === 'child_process') {
          if (!permissions.includes('process:spawn')) {
            throw new Error(`Plugin ${pluginName} does not have process spawn permission`);
          }
        }

        if (moduleName === 'http' || moduleName === 'https' || moduleName === 'axios') {
          if (!permissions.includes('network:request')) {
            throw new Error(`Plugin ${pluginName} does not have network permission`);
          }
        }

        // If still not allowed, throw error
        if (!permissions.some(p => this.moduleMatchesPermission(moduleName, p))) {
          throw new Error(
            `Module "${moduleName}" is not allowed in plugin ${pluginName}. ` +
            `Declare required permissions in package.json`
          );
        }
      }

      // Load module
      return require(moduleName);
    };
  }

  /**
   * Check if module matches permission
   * @param {string} moduleName - Module name
   * @param {string} permission - Permission string
   * @returns {boolean}
   */
  moduleMatchesPermission(moduleName, permission) {
    const permissionMap = {
      'filesystem:read': ['fs', 'fs-extra', 'glob'],
      'filesystem:write': ['fs', 'fs-extra'],
      'network:request': ['http', 'https', 'axios', 'node-fetch'],
      'network:server': ['http', 'https', 'express', 'koa'],
      'process:spawn': ['child_process'],
      'database:read': ['pg', 'mysql', 'mongodb', 'sqlite3'],
      'database:write': ['pg', 'mysql', 'mongodb', 'sqlite3']
    };

    const allowedModules = permissionMap[permission] || [];
    return allowedModules.includes(moduleName);
  }

  /**
   * Execute plugin code in sandbox
   * @param {string} code - Plugin code
   * @param {Object} context - Sandbox context
   * @returns {*} Execution result
   */
  execute(code, context) {
    try {
      const script = new vm.Script(code);
      return script.runInContext(context, {
        timeout: this.options.timeout,
        displayErrors: true
      });
    } catch (error) {
      logger.error('Sandbox execution error:', error);
      throw new Error(`Plugin execution failed: ${error.message}`);
    }
  }

  /**
   * Execute plugin function in sandbox
   * @param {Function} fn - Function to execute
   * @param {Array} args - Function arguments
   * @param {Object} context - Sandbox context
   * @returns {Promise<*>} Execution result
   */
  async executeFunction(fn, args = [], context = {}) {
    try {
      // If function is async, await it
      if (fn.constructor.name === 'AsyncFunction') {
        return await Promise.race([
          fn.apply(context, args),
          this.createTimeout()
        ]);
      }

      // Regular function
      return fn.apply(context, args);
    } catch (error) {
      logger.error('Sandbox function execution error:', error);
      throw new Error(`Plugin function execution failed: ${error.message}`);
    }
  }

  /**
   * Create timeout promise
   * @returns {Promise}
   */
  createTimeout() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Plugin execution timeout (${this.options.timeout}ms)`));
      }, this.options.timeout);
    });
  }

  /**
   * Validate plugin permissions
   * @param {Object} metadata - Plugin metadata
   * @param {Array<string>} requiredPermissions - Required permissions
   * @returns {Object} Validation result
   */
  validatePermissions(metadata, requiredPermissions = []) {
    const pluginPermissions = metadata.tryforge?.permissions || [];
    const missing = [];

    for (const required of requiredPermissions) {
      if (!pluginPermissions.includes(required)) {
        missing.push(required);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      granted: pluginPermissions
    };
  }

  /**
   * Check if plugin has permission
   * @param {Object} metadata - Plugin metadata
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasPermission(metadata, permission) {
    const permissions = metadata.tryforge?.permissions || [];
    return permissions.includes(permission);
  }

  /**
   * Get security level for plugin
   * @param {Object} metadata - Plugin metadata
   * @returns {string} Security level (high|medium|low)
   */
  getSecurityLevel(metadata) {
    const permissions = metadata.tryforge?.permissions || [];

    // High risk permissions
    const highRisk = [
      'process:spawn',
      'filesystem:write',
      'database:write',
      'network:server'
    ];

    // Medium risk permissions
    const mediumRisk = [
      'filesystem:read',
      'network:request',
      'database:read'
    ];

    if (permissions.some(p => highRisk.includes(p))) {
      return 'high';
    }

    if (permissions.some(p => mediumRisk.includes(p))) {
      return 'medium';
    }

    return 'low';
  }
}

module.exports = PluginSandbox;
