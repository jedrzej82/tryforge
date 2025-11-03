/**
 * Hook System
 * Provides event-based hooks for extending TryForge functionality
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class HookSystem extends EventEmitter {
  constructor() {
    super();
    this.hooks = new Map();
    this.filters = new Map();
    this.actions = new Map();
    this.maxListeners = 100; // Allow many plugins
    this.setMaxListeners(this.maxListeners);
  }

  /**
   * Register a hook
   * @param {string} name - Hook name
   * @param {Function} callback - Hook callback
   * @param {number} priority - Hook priority (lower = earlier execution)
   */
  register(name, callback, priority = 10) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }

    const hooks = this.hooks.get(name);
    hooks.push({ callback, priority, name });

    // Sort by priority
    hooks.sort((a, b) => a.priority - b.priority);

    logger.debug(`Hook registered: ${name} (priority: ${priority})`);
  }

  /**
   * Register a before hook
   * @param {string} event - Event name
   * @param {Function} callback - Hook callback
   * @param {number} priority - Hook priority
   */
  before(event, callback, priority = 10) {
    this.register(`before:${event}`, callback, priority);
  }

  /**
   * Register an after hook
   * @param {string} event - Event name
   * @param {Function} callback - Hook callback
   * @param {number} priority - Hook priority
   */
  after(event, callback, priority = 10) {
    this.register(`after:${event}`, callback, priority);
  }

  /**
   * Register a filter hook for data transformation
   * @param {string} name - Filter name
   * @param {Function} callback - Filter callback
   * @param {number} priority - Filter priority
   */
  addFilter(name, callback, priority = 10) {
    if (!this.filters.has(name)) {
      this.filters.set(name, []);
    }

    const filters = this.filters.get(name);
    filters.push({ callback, priority, name });

    // Sort by priority
    filters.sort((a, b) => a.priority - b.priority);

    logger.debug(`Filter registered: ${name} (priority: ${priority})`);
  }

  /**
   * Register an action hook for side effects
   * @param {string} name - Action name
   * @param {Function} callback - Action callback
   * @param {number} priority - Action priority
   */
  addAction(name, callback, priority = 10) {
    if (!this.actions.has(name)) {
      this.actions.set(name, []);
    }

    const actions = this.actions.get(name);
    actions.push({ callback, priority, name });

    // Sort by priority
    actions.sort((a, b) => a.priority - b.priority);

    logger.debug(`Action registered: ${name} (priority: ${priority})`);
  }

  /**
   * Execute a hook
   * @param {string} name - Hook name
   * @param {*} context - Hook context/data
   * @returns {Promise<*>} Modified context
   */
  async execute(name, context = {}) {
    const hooks = this.hooks.get(name) || [];

    logger.debug(`Executing hook: ${name} (${hooks.length} callbacks)`);

    let modifiedContext = context;

    for (const hook of hooks) {
      try {
        const result = await Promise.resolve(hook.callback(modifiedContext));

        // Allow hooks to modify context
        if (result !== undefined) {
          modifiedContext = result;
        }
      } catch (error) {
        logger.error(`Error executing hook ${name}:`, error);
        // Continue executing other hooks
      }
    }

    return modifiedContext;
  }

  /**
   * Execute a filter and return transformed value
   * @param {string} name - Filter name
   * @param {*} value - Value to filter
   * @param {*} context - Additional context
   * @returns {Promise<*>} Filtered value
   */
  async applyFilters(name, value, context = {}) {
    const filters = this.filters.get(name) || [];

    logger.debug(`Applying filters: ${name} (${filters.length} filters)`);

    let filteredValue = value;

    for (const filter of filters) {
      try {
        filteredValue = await Promise.resolve(
          filter.callback(filteredValue, context)
        );
      } catch (error) {
        logger.error(`Error applying filter ${name}:`, error);
        // Continue with current value
      }
    }

    return filteredValue;
  }

  /**
   * Execute all actions for an event
   * @param {string} name - Action name
   * @param {*} data - Action data
   * @returns {Promise<void>}
   */
  async doAction(name, data = {}) {
    const actions = this.actions.get(name) || [];

    logger.debug(`Executing actions: ${name} (${actions.length} actions)`);

    for (const action of actions) {
      try {
        await Promise.resolve(action.callback(data));
      } catch (error) {
        logger.error(`Error executing action ${name}:`, error);
        // Continue executing other actions
      }
    }
  }

  /**
   * Unregister a hook
   * @param {string} name - Hook name
   * @param {Function} callback - Callback to remove
   */
  unregister(name, callback) {
    if (this.hooks.has(name)) {
      const hooks = this.hooks.get(name);
      const filtered = hooks.filter(h => h.callback !== callback);
      this.hooks.set(name, filtered);
      logger.debug(`Hook unregistered: ${name}`);
    }
  }

  /**
   * Remove a filter
   * @param {string} name - Filter name
   * @param {Function} callback - Callback to remove
   */
  removeFilter(name, callback) {
    if (this.filters.has(name)) {
      const filters = this.filters.get(name);
      const filtered = filters.filter(f => f.callback !== callback);
      this.filters.set(name, filtered);
      logger.debug(`Filter removed: ${name}`);
    }
  }

  /**
   * Remove an action
   * @param {string} name - Action name
   * @param {Function} callback - Callback to remove
   */
  removeAction(name, callback) {
    if (this.actions.has(name)) {
      const actions = this.actions.get(name);
      const filtered = actions.filter(a => a.callback !== callback);
      this.actions.set(name, filtered);
      logger.debug(`Action removed: ${name}`);
    }
  }

  /**
   * Check if a hook exists
   * @param {string} name - Hook name
   * @returns {boolean}
   */
  hasHook(name) {
    return this.hooks.has(name) && this.hooks.get(name).length > 0;
  }

  /**
   * Check if a filter exists
   * @param {string} name - Filter name
   * @returns {boolean}
   */
  hasFilter(name) {
    return this.filters.has(name) && this.filters.get(name).length > 0;
  }

  /**
   * Check if an action exists
   * @param {string} name - Action name
   * @returns {boolean}
   */
  hasAction(name) {
    return this.actions.has(name) && this.actions.get(name).length > 0;
  }

  /**
   * Get all registered hooks
   * @returns {Array<string>}
   */
  getAllHooks() {
    return Array.from(this.hooks.keys());
  }

  /**
   * Get all registered filters
   * @returns {Array<string>}
   */
  getAllFilters() {
    return Array.from(this.filters.keys());
  }

  /**
   * Get all registered actions
   * @returns {Array<string>}
   */
  getAllActions() {
    return Array.from(this.actions.keys());
  }

  /**
   * Clear all hooks
   */
  clear() {
    this.hooks.clear();
    this.filters.clear();
    this.actions.clear();
    logger.debug('All hooks cleared');
  }

  /**
   * Get hook statistics
   * @returns {Object}
   */
  getStats() {
    return {
      hooks: this.hooks.size,
      filters: this.filters.size,
      actions: this.actions.size,
      totalCallbacks: Array.from(this.hooks.values()).reduce((sum, arr) => sum + arr.length, 0) +
                      Array.from(this.filters.values()).reduce((sum, arr) => sum + arr.length, 0) +
                      Array.from(this.actions.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

// Create singleton instance
const hookSystem = new HookSystem();

module.exports = hookSystem;
