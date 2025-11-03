/**
 * Plugin Registry
 * Manages plugin registration and metadata
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const logger = require('../utils/logger');

class PluginRegistry {
  constructor() {
    this.registryPath = path.join(os.homedir(), '.tryforge', 'plugins', 'registry.json');
    this.plugins = new Map();
    this.initialized = false;
  }

  /**
   * Initialize registry
   */
  async init() {
    if (this.initialized) return;

    await fs.ensureDir(path.dirname(this.registryPath));

    if (await fs.pathExists(this.registryPath)) {
      const data = await fs.readJson(this.registryPath);
      this.plugins = new Map(Object.entries(data.plugins || {}));
    }

    this.initialized = true;
    logger.debug('Plugin registry initialized');
  }

  /**
   * Register a plugin
   * @param {string} name - Plugin name
   * @param {Object} metadata - Plugin metadata
   */
  async register(name, metadata) {
    await this.init();

    this.plugins.set(name, {
      ...metadata,
      registeredAt: new Date().toISOString(),
      enabled: true,
      installedVersion: metadata.version
    });

    await this.save();
    logger.info(`Plugin registered: ${name}`);
  }

  /**
   * Unregister a plugin
   * @param {string} name - Plugin name
   */
  async unregister(name) {
    await this.init();

    if (!this.plugins.has(name)) {
      throw new Error(`Plugin not found: ${name}`);
    }

    this.plugins.delete(name);
    await this.save();
    logger.info(`Plugin unregistered: ${name}`);
  }

  /**
   * Update plugin metadata
   * @param {string} name - Plugin name
   * @param {Object} updates - Metadata updates
   */
  async update(name, updates) {
    await this.init();

    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    this.plugins.set(name, {
      ...plugin,
      ...updates,
      updatedAt: new Date().toISOString()
    });

    await this.save();
    logger.info(`Plugin updated: ${name}`);
  }

  /**
   * Enable a plugin
   * @param {string} name - Plugin name
   */
  async enable(name) {
    await this.update(name, { enabled: true });
    logger.info(`Plugin enabled: ${name}`);
  }

  /**
   * Disable a plugin
   * @param {string} name - Plugin name
   */
  async disable(name) {
    await this.update(name, { enabled: false });
    logger.info(`Plugin disabled: ${name}`);
  }

  /**
   * Get plugin info
   * @param {string} name - Plugin name
   * @returns {Object|null}
   */
  async get(name) {
    await this.init();
    return this.plugins.get(name) || null;
  }

  /**
   * Check if plugin is registered
   * @param {string} name - Plugin name
   * @returns {boolean}
   */
  async has(name) {
    await this.init();
    return this.plugins.has(name);
  }

  /**
   * Check if plugin is enabled
   * @param {string} name - Plugin name
   * @returns {boolean}
   */
  async isEnabled(name) {
    await this.init();
    const plugin = this.plugins.get(name);
    return plugin ? plugin.enabled : false;
  }

  /**
   * Get all registered plugins
   * @returns {Array<Object>}
   */
  async getAll() {
    await this.init();
    return Array.from(this.plugins.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  /**
   * Get enabled plugins
   * @returns {Array<Object>}
   */
  async getEnabled() {
    await this.init();
    return Array.from(this.plugins.entries())
      .filter(([_, data]) => data.enabled)
      .map(([name, data]) => ({ name, ...data }));
  }

  /**
   * Get disabled plugins
   * @returns {Array<Object>}
   */
  async getDisabled() {
    await this.init();
    return Array.from(this.plugins.entries())
      .filter(([_, data]) => !data.enabled)
      .map(([name, data]) => ({ name, ...data }));
  }

  /**
   * Search plugins by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array<Object>}
   */
  async search(criteria = {}) {
    await this.init();
    let results = Array.from(this.plugins.entries()).map(([name, data]) => ({
      name,
      ...data
    }));

    if (criteria.type) {
      results = results.filter(p => p.tryforge?.type === criteria.type);
    }

    if (criteria.enabled !== undefined) {
      results = results.filter(p => p.enabled === criteria.enabled);
    }

    if (criteria.keyword) {
      const keyword = criteria.keyword.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword) ||
        p.tryforge?.keywords?.some(k => k.toLowerCase().includes(keyword))
      );
    }

    return results;
  }

  /**
   * Get plugins by type
   * @param {string} type - Plugin type
   * @returns {Array<Object>}
   */
  async getByType(type) {
    return await this.search({ type });
  }

  /**
   * Get plugin statistics
   * @returns {Object}
   */
  async getStats() {
    await this.init();

    const all = await this.getAll();
    const enabled = all.filter(p => p.enabled).length;
    const disabled = all.filter(p => !p.enabled).length;

    const byType = {};
    for (const plugin of all) {
      const type = plugin.tryforge?.type || 'other';
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      total: all.length,
      enabled,
      disabled,
      byType
    };
  }

  /**
   * Clear registry
   */
  async clear() {
    await this.init();
    this.plugins.clear();
    await this.save();
    logger.info('Plugin registry cleared');
  }

  /**
   * Save registry to disk
   */
  async save() {
    const data = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      plugins: Object.fromEntries(this.plugins)
    };

    await fs.writeJson(this.registryPath, data, { spaces: 2 });
    logger.debug('Plugin registry saved');
  }

  /**
   * Import plugins from another registry
   * @param {string} registryPath - Path to registry file
   */
  async import(registryPath) {
    await this.init();

    const data = await fs.readJson(registryPath);
    const imported = data.plugins || {};

    for (const [name, metadata] of Object.entries(imported)) {
      if (!this.plugins.has(name)) {
        this.plugins.set(name, metadata);
      }
    }

    await this.save();
    logger.info(`Imported ${Object.keys(imported).length} plugins`);
  }

  /**
   * Export registry to file
   * @param {string} outputPath - Output file path
   */
  async export(outputPath) {
    await this.init();

    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      plugins: Object.fromEntries(this.plugins)
    };

    await fs.writeJson(outputPath, data, { spaces: 2 });
    logger.info(`Registry exported to ${outputPath}`);
  }

  /**
   * Backup registry
   */
  async backup() {
    await this.init();

    const backupPath = path.join(
      path.dirname(this.registryPath),
      `registry.backup.${Date.now()}.json`
    );

    await fs.copy(this.registryPath, backupPath);
    logger.info(`Registry backed up to ${backupPath}`);
    return backupPath;
  }

  /**
   * Restore registry from backup
   * @param {string} backupPath - Backup file path
   */
  async restore(backupPath) {
    await this.init();

    const data = await fs.readJson(backupPath);
    this.plugins = new Map(Object.entries(data.plugins || {}));

    await this.save();
    logger.info('Registry restored from backup');
  }
}

// Create singleton instance
const registry = new PluginRegistry();

module.exports = registry;
