/**
 * Configuration Writer
 *
 * This module handles writing configuration to files,
 * including formatting, updating specific keys, and creating backups.
 */

const fs = require('fs');
const path = require('path');
const ini = require('ini');
const { setNestedValue, removeNestedValue, cloneConfig } = require('./merge');
const { createBackup } = require('./migrator');

/**
 * Write configuration to file
 *
 * @param {string} filepath - Path to config file
 * @param {object} config - Configuration object
 * @param {object} options - Write options
 * @param {boolean} options.backup - Create backup before writing
 * @param {boolean} options.pretty - Pretty print JSON
 * @param {number} options.indent - Indentation spaces for JSON
 * @returns {Promise<void>}
 */
async function writeConfig(filepath, config, options = {}) {
  const {
    backup = true,
    pretty = true,
    indent = 2
  } = options;

  try {
    // Create backup if file exists and backup is requested
    if (backup && fs.existsSync(filepath)) {
      const existingContent = await fs.promises.readFile(filepath, 'utf8');
      const backupPath = `${filepath}.backup`;
      await fs.promises.writeFile(backupPath, existingContent, 'utf8');
    }

    // Determine file format from extension
    const ext = path.extname(filepath);
    let content;

    switch (ext) {
      case '.json':
        content = formatJson(config, pretty, indent);
        break;

      case '.js':
      case '.cjs':
        content = formatJavaScript(config, pretty, indent);
        break;

      case '.yaml':
      case '.yml':
        content = formatYaml(config);
        break;

      case '.ini':
        content = formatIni(config);
        break;

      default:
        // Default to JSON
        content = formatJson(config, pretty, indent);
    }

    // Write to file
    await fs.promises.writeFile(filepath, content, 'utf8');

  } catch (error) {
    throw new Error(`Failed to write config to ${filepath}: ${error.message}`);
  }
}

/**
 * Write configuration synchronously
 *
 * @param {string} filepath - Path to config file
 * @param {object} config - Configuration object
 * @param {object} options - Write options
 */
function writeConfigSync(filepath, config, options = {}) {
  const {
    backup = true,
    pretty = true,
    indent = 2
  } = options;

  try {
    // Create backup if file exists and backup is requested
    if (backup && fs.existsSync(filepath)) {
      const existingContent = fs.readFileSync(filepath, 'utf8');
      const backupPath = `${filepath}.backup`;
      fs.writeFileSync(backupPath, existingContent, 'utf8');
    }

    // Determine file format from extension
    const ext = path.extname(filepath);
    let content;

    switch (ext) {
      case '.json':
        content = formatJson(config, pretty, indent);
        break;

      case '.js':
      case '.cjs':
        content = formatJavaScript(config, pretty, indent);
        break;

      case '.yaml':
      case '.yml':
        content = formatYaml(config);
        break;

      case '.ini':
        content = formatIni(config);
        break;

      default:
        // Default to JSON
        content = formatJson(config, pretty, indent);
    }

    // Write to file
    fs.writeFileSync(filepath, content, 'utf8');

  } catch (error) {
    throw new Error(`Failed to write config to ${filepath}: ${error.message}`);
  }
}

/**
 * Update a specific configuration key
 *
 * @param {string} filepath - Path to config file
 * @param {string} key - Configuration key (dot notation)
 * @param {*} value - New value
 * @param {object} options - Update options
 * @returns {Promise<void>}
 */
async function updateKey(filepath, key, value, options = {}) {
  try {
    // Load existing config
    const { loadFromFile } = require('./loader');
    let config = await loadFromFile(filepath);

    // Update the key
    setNestedValue(config, key, value);

    // Write back to file
    await writeConfig(filepath, config, options);

  } catch (error) {
    throw new Error(`Failed to update key ${key}: ${error.message}`);
  }
}

/**
 * Update a specific configuration key synchronously
 *
 * @param {string} filepath - Path to config file
 * @param {string} key - Configuration key (dot notation)
 * @param {*} value - New value
 * @param {object} options - Update options
 */
function updateKeySync(filepath, key, value, options = {}) {
  try {
    // Load existing config
    const { loadFromFileSync } = require('./loader');
    let config = loadFromFileSync(filepath);

    // Update the key
    setNestedValue(config, key, value);

    // Write back to file
    writeConfigSync(filepath, config, options);

  } catch (error) {
    throw new Error(`Failed to update key ${key}: ${error.message}`);
  }
}

/**
 * Remove a configuration key
 *
 * @param {string} filepath - Path to config file
 * @param {string} key - Configuration key (dot notation)
 * @param {object} options - Remove options
 * @returns {Promise<void>}
 */
async function removeKey(filepath, key, options = {}) {
  try {
    // Load existing config
    const { loadFromFile } = require('./loader');
    let config = await loadFromFile(filepath);

    // Remove the key
    removeNestedValue(config, key);

    // Write back to file
    await writeConfig(filepath, config, options);

  } catch (error) {
    throw new Error(`Failed to remove key ${key}: ${error.message}`);
  }
}

/**
 * Remove a configuration key synchronously
 *
 * @param {string} filepath - Path to config file
 * @param {string} key - Configuration key (dot notation)
 * @param {object} options - Remove options
 */
function removeKeySync(filepath, key, options = {}) {
  try {
    // Load existing config
    const { loadFromFileSync } = require('./loader');
    let config = loadFromFileSync(filepath);

    // Remove the key
    removeNestedValue(config, key);

    // Write back to file
    writeConfigSync(filepath, config, options);

  } catch (error) {
    throw new Error(`Failed to remove key ${key}: ${error.message}`);
  }
}

/**
 * Format configuration as JSON
 *
 * @param {object} config - Configuration object
 * @param {boolean} pretty - Pretty print
 * @param {number} indent - Indentation spaces
 * @returns {string} Formatted JSON
 */
function formatJson(config, pretty = true, indent = 2) {
  if (pretty) {
    return JSON.stringify(config, null, indent) + '\n';
  }
  return JSON.stringify(config) + '\n';
}

/**
 * Format configuration as JavaScript module
 *
 * @param {object} config - Configuration object
 * @param {boolean} pretty - Pretty print
 * @param {number} indent - Indentation spaces
 * @returns {string} Formatted JavaScript
 */
function formatJavaScript(config, pretty = true, indent = 2) {
  const json = JSON.stringify(config, null, pretty ? indent : 0);

  return `/**
 * TryForge Configuration
 *
 * This file is auto-generated.
 * You can modify it manually or use 'tryforge config' commands.
 */

module.exports = ${json};
`;
}

/**
 * Format configuration as YAML
 *
 * @param {object} config - Configuration object
 * @returns {string} Formatted YAML
 */
function formatYaml(config) {
  try {
    const yaml = require('js-yaml');
    return yaml.dump(config, {
      indent: 2,
      lineWidth: 80,
      noRefs: true,
      sortKeys: false
    });
  } catch (error) {
    throw new Error(`Failed to format as YAML: ${error.message}`);
  }
}

/**
 * Format configuration as INI
 *
 * @param {object} config - Configuration object
 * @returns {string} Formatted INI
 */
function formatIni(config) {
  try {
    return ini.stringify(config);
  } catch (error) {
    throw new Error(`Failed to format as INI: ${error.message}`);
  }
}

/**
 * Initialize a new config file with defaults
 *
 * @param {string} filepath - Path to config file
 * @param {object} defaults - Default configuration
 * @param {object} options - Init options
 * @returns {Promise<void>}
 */
async function initConfigFile(filepath, defaults = {}, options = {}) {
  const {
    overwrite = false,
    pretty = true,
    indent = 2
  } = options;

  try {
    // Check if file already exists
    if (fs.existsSync(filepath) && !overwrite) {
      throw new Error(`Config file already exists at ${filepath}. Use overwrite option to replace.`);
    }

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    // Write defaults to file
    await writeConfig(filepath, defaults, { ...options, backup: false });

  } catch (error) {
    throw new Error(`Failed to initialize config file: ${error.message}`);
  }
}

/**
 * Initialize a new config file synchronously
 *
 * @param {string} filepath - Path to config file
 * @param {object} defaults - Default configuration
 * @param {object} options - Init options
 */
function initConfigFileSync(filepath, defaults = {}, options = {}) {
  const {
    overwrite = false
  } = options;

  try {
    // Check if file already exists
    if (fs.existsSync(filepath) && !overwrite) {
      throw new Error(`Config file already exists at ${filepath}. Use overwrite option to replace.`);
    }

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write defaults to file
    writeConfigSync(filepath, defaults, { ...options, backup: false });

  } catch (error) {
    throw new Error(`Failed to initialize config file: ${error.message}`);
  }
}

/**
 * Merge and write configuration updates
 *
 * @param {string} filepath - Path to config file
 * @param {object} updates - Configuration updates
 * @param {object} options - Write options
 * @returns {Promise<void>}
 */
async function mergeAndWrite(filepath, updates, options = {}) {
  try {
    // Load existing config
    const { loadFromFile } = require('./loader');
    const { deepMerge } = require('./merge');

    let config = {};
    if (fs.existsSync(filepath)) {
      config = await loadFromFile(filepath);
    }

    // Merge updates
    const mergedConfig = deepMerge(config, updates);

    // Write back to file
    await writeConfig(filepath, mergedConfig, options);

  } catch (error) {
    throw new Error(`Failed to merge and write config: ${error.message}`);
  }
}

/**
 * Format an existing config file
 *
 * @param {string} filepath - Path to config file
 * @param {object} options - Format options
 * @returns {Promise<void>}
 */
async function formatConfigFile(filepath, options = {}) {
  try {
    // Load existing config
    const { loadFromFile } = require('./loader');
    const config = await loadFromFile(filepath);

    // Write back with formatting
    await writeConfig(filepath, config, { ...options, backup: true });

  } catch (error) {
    throw new Error(`Failed to format config file: ${error.message}`);
  }
}

module.exports = {
  writeConfig,
  writeConfigSync,
  updateKey,
  updateKeySync,
  removeKey,
  removeKeySync,
  formatJson,
  formatJavaScript,
  formatYaml,
  formatIni,
  initConfigFile,
  initConfigFileSync,
  mergeAndWrite,
  formatConfigFile
};
