/**
 * TryForge Plugin System
 * Main entry point for the plugin system
 */

const { pluginManager, hookSystem, HOOK_POINTS } = require('./plugin-manager');
const PluginAPI = require('./plugin-api');
const PluginLoader = require('./plugin-loader');
const PluginValidator = require('./plugin-validator');
const PluginSandbox = require('./plugin-sandbox');
const registry = require('./plugin-registry');

/**
 * Initialize the plugin system
 * This should be called during TryForge initialization
 */
async function initPluginSystem() {
  await pluginManager.init();
  return pluginManager;
}

/**
 * Execute hooks for a specific event
 * @param {string} hookName - Hook name (e.g., 'before:create')
 * @param {*} context - Hook context/data
 * @returns {Promise<*>} Modified context
 */
async function executeHook(hookName, context = {}) {
  return await hookSystem.execute(hookName, context);
}

/**
 * Apply filters to a value
 * @param {string} filterName - Filter name
 * @param {*} value - Value to filter
 * @param {*} context - Additional context
 * @returns {Promise<*>} Filtered value
 */
async function applyFilters(filterName, value, context = {}) {
  return await hookSystem.applyFilters(filterName, value, context);
}

/**
 * Execute actions for an event
 * @param {string} actionName - Action name
 * @param {*} data - Action data
 * @returns {Promise<void>}
 */
async function doAction(actionName, data = {}) {
  return await hookSystem.doAction(actionName, data);
}

/**
 * Get all available hook points
 * @returns {Object} Map of hook names to descriptions
 */
function getHookPoints() {
  return HOOK_POINTS;
}

/**
 * Check if a hook exists
 * @param {string} hookName - Hook name
 * @returns {boolean}
 */
function hasHook(hookName) {
  return hookSystem.hasHook(hookName);
}

/**
 * Get plugin manager instance
 * @returns {PluginManager}
 */
function getPluginManager() {
  return pluginManager;
}

/**
 * Get hook system instance
 * @returns {HookSystem}
 */
function getHookSystem() {
  return hookSystem;
}

/**
 * Get plugin registry instance
 * @returns {PluginRegistry}
 */
function getRegistry() {
  return registry;
}

// Export all components
module.exports = {
  // Main functions
  initPluginSystem,
  executeHook,
  applyFilters,
  doAction,
  getHookPoints,
  hasHook,

  // Instances
  pluginManager,
  hookSystem,
  registry,
  getPluginManager,
  getHookSystem,
  getRegistry,

  // Classes
  PluginAPI,
  PluginLoader,
  PluginValidator,
  PluginSandbox,

  // Constants
  HOOK_POINTS
};
