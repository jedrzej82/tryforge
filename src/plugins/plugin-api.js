/**
 * Plugin API
 * Provides API for plugin developers to interact with TryForge
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const hookSystem = require('./hook-system');

class PluginAPI {
  constructor(pluginContext = {}) {
    this.context = pluginContext;
    this.pluginName = pluginContext.name || 'unknown';
    this.pluginPath = pluginContext.path || '';
  }

  /**
   * Access to hook system
   */
  get hooks() {
    const pluginName = this.pluginName;

    return {
      /**
       * Register a before hook
       */
      before: (event, callback, priority) => {
        logger.debug(`[${pluginName}] Registering before hook: ${event}`);
        hookSystem.before(event, callback, priority);
      },

      /**
       * Register an after hook
       */
      after: (event, callback, priority) => {
        logger.debug(`[${pluginName}] Registering after hook: ${event}`);
        hookSystem.after(event, callback, priority);
      },

      /**
       * Register a filter
       */
      addFilter: (name, callback, priority) => {
        logger.debug(`[${pluginName}] Registering filter: ${name}`);
        hookSystem.addFilter(name, callback, priority);
      },

      /**
       * Register an action
       */
      addAction: (name, callback, priority) => {
        logger.debug(`[${pluginName}] Registering action: ${name}`);
        hookSystem.addAction(name, callback, priority);
      },

      /**
       * Unregister a hook
       */
      remove: (name, callback) => {
        hookSystem.unregister(name, callback);
      }
    };
  }

  /**
   * CLI helpers
   */
  get cli() {
    const pluginName = this.pluginName;
    const commands = new Map();

    return {
      /**
       * Add a custom CLI command
       */
      addCommand: (name, options) => {
        logger.debug(`[${pluginName}] Adding CLI command: ${name}`);
        commands.set(name, {
          ...options,
          plugin: pluginName
        });

        // Emit event for command registration
        hookSystem.emit('plugin:command:add', { name, options, plugin: pluginName });
      },

      /**
       * Remove a CLI command
       */
      removeCommand: (name) => {
        commands.delete(name);
        hookSystem.emit('plugin:command:remove', { name, plugin: pluginName });
      },

      /**
       * Get registered commands
       */
      getCommands: () => {
        return Array.from(commands.entries()).map(([name, cmd]) => ({
          name,
          ...cmd
        }));
      }
    };
  }

  /**
   * File system helpers
   */
  get fs() {
    const pluginPath = this.pluginPath;
    const pluginName = this.pluginName;

    return {
      /**
       * Read a file
       */
      readFile: async (filePath, encoding = 'utf-8') => {
        logger.debug(`[${pluginName}] Reading file: ${filePath}`);
        return await fs.readFile(filePath, encoding);
      },

      /**
       * Write a file
       */
      writeFile: async (filePath, content) => {
        logger.debug(`[${pluginName}] Writing file: ${filePath}`);
        await fs.ensureDir(path.dirname(filePath));
        return await fs.writeFile(filePath, content);
      },

      /**
       * Check if file exists
       */
      exists: async (filePath) => {
        return await fs.pathExists(filePath);
      },

      /**
       * Read directory
       */
      readDir: async (dirPath) => {
        return await fs.readdir(dirPath);
      },

      /**
       * Copy file or directory
       */
      copy: async (src, dest) => {
        logger.debug(`[${pluginName}] Copying: ${src} -> ${dest}`);
        return await fs.copy(src, dest);
      },

      /**
       * Remove file or directory
       */
      remove: async (filePath) => {
        logger.debug(`[${pluginName}] Removing: ${filePath}`);
        return await fs.remove(filePath);
      },

      /**
       * Resolve path relative to plugin directory
       */
      resolve: (...paths) => {
        return path.resolve(pluginPath, ...paths);
      },

      /**
       * Read JSON file
       */
      readJson: async (filePath) => {
        return await fs.readJson(filePath);
      },

      /**
       * Write JSON file
       */
      writeJson: async (filePath, data, options) => {
        await fs.ensureDir(path.dirname(filePath));
        return await fs.writeJson(filePath, data, { spaces: 2, ...options });
      }
    };
  }

  /**
   * Logger helpers
   */
  get logger() {
    const pluginName = this.pluginName;

    return {
      info: (...args) => logger.info(`[${pluginName}]`, ...args),
      warn: (...args) => logger.warn(`[${pluginName}]`, ...args),
      error: (...args) => logger.error(`[${pluginName}]`, ...args),
      debug: (...args) => logger.debug(`[${pluginName}]`, ...args),
      success: (...args) => logger.info(`[${pluginName}] ✓`, ...args)
    };
  }

  /**
   * Configuration helpers
   */
  get config() {
    const pluginName = this.pluginName;
    const configStore = new Map();

    return {
      /**
       * Get configuration value
       */
      get: (key, defaultValue) => {
        return configStore.get(key) ?? defaultValue;
      },

      /**
       * Set configuration value
       */
      set: (key, value) => {
        configStore.set(key, value);
        logger.debug(`[${pluginName}] Config set: ${key}`);
      },

      /**
       * Check if key exists
       */
      has: (key) => {
        return configStore.has(key);
      },

      /**
       * Delete configuration value
       */
      delete: (key) => {
        configStore.delete(key);
      },

      /**
       * Get all configuration
       */
      getAll: () => {
        return Object.fromEntries(configStore);
      },

      /**
       * Clear all configuration
       */
      clear: () => {
        configStore.clear();
      }
    };
  }

  /**
   * Template helpers
   */
  get templates() {
    const pluginPath = this.pluginPath;
    const pluginName = this.pluginName;

    return {
      /**
       * Register a template
       */
      register: (name, template) => {
        logger.debug(`[${pluginName}] Registering template: ${name}`);
        hookSystem.emit('plugin:template:register', { name, template, plugin: pluginName });
      },

      /**
       * Get template path
       */
      getPath: (templateName) => {
        return path.join(pluginPath, 'templates', templateName);
      },

      /**
       * Load template file
       */
      load: async (templateName) => {
        const templatePath = path.join(pluginPath, 'templates', templateName);
        return await fs.readFile(templatePath, 'utf-8');
      },

      /**
       * Render template with data
       */
      render: async (templateName, data) => {
        const content = await this.load(templateName);
        const Handlebars = require('handlebars');
        const template = Handlebars.compile(content);
        return template(data);
      }
    };
  }

  /**
   * Utility helpers
   */
  get utils() {
    const pluginName = this.pluginName;

    return {
      /**
       * Execute shell command
       */
      exec: async (command, options = {}) => {
        logger.debug(`[${pluginName}] Executing: ${command}`);
        const { execa } = require('execa');
        return await execa(command, { shell: true, ...options });
      },

      /**
       * Prompt user for input
       */
      prompt: async (questions) => {
        const inquirer = require('inquirer');
        return await inquirer.prompt(questions);
      },

      /**
       * Display spinner
       */
      spinner: (text) => {
        const ora = require('ora');
        return ora(text);
      },

      /**
       * Format path
       */
      formatPath: (filePath) => {
        return path.normalize(filePath);
      },

      /**
       * Resolve home directory
       */
      resolveHome: (filePath) => {
        if (filePath.startsWith('~')) {
          return path.join(require('os').homedir(), filePath.slice(1));
        }
        return filePath;
      },

      /**
       * Delay execution
       */
      delay: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
      },

      /**
       * Validate email
       */
      isEmail: (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },

      /**
       * Validate URL
       */
      isUrl: (url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      }
    };
  }

  /**
   * Event emitter helpers
   */
  get events() {
    const pluginName = this.pluginName;

    return {
      /**
       * Emit an event
       */
      emit: (event, data) => {
        logger.debug(`[${pluginName}] Emitting event: ${event}`);
        hookSystem.emit(event, data);
      },

      /**
       * Listen to an event
       */
      on: (event, callback) => {
        hookSystem.on(event, callback);
      },

      /**
       * Listen to an event once
       */
      once: (event, callback) => {
        hookSystem.once(event, callback);
      },

      /**
       * Remove event listener
       */
      off: (event, callback) => {
        hookSystem.off(event, callback);
      }
    };
  }

  /**
   * Get plugin context
   */
  getContext() {
    return this.context;
  }

  /**
   * Get plugin metadata
   */
  getMetadata() {
    return this.context.metadata || {};
  }

  /**
   * Get TryForge version
   */
  getTryForgeVersion() {
    const packageJson = require('../../package.json');
    return packageJson.version;
  }

  /**
   * Get Node.js version
   */
  getNodeVersion() {
    return process.version;
  }
}

module.exports = PluginAPI;
