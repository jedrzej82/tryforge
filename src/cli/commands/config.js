/**
 * Config Command
 *
 * Manage TryForge configuration
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const {
  getConfig,
  getValue,
  setValue,
  setValueAndSave,
  validateCurrentConfig,
  getInstance
} = require('../../config');
const {
  flattenObject,
  getAllPaths
} = require('../../config/merge');
const {
  formatValidationResult
} = require('../../config/validator');
const {
  needsMigration,
  migrateConfig
} = require('../../config/migrator');
const {
  findConfigFile,
  findUserConfigFile,
  USER_CONFIG_FILE,
  initUserConfigDirSync
} = require('../../config/loader');
const {
  initConfigFileSync,
  writeConfigSync
} = require('../../config/writer');
const { getDefaults } = require('../../config/defaults');

/**
 * Show current configuration
 */
async function show() {
  try {
    const config = getConfig();
    const info = getInstance().getInfo();

    console.log(chalk.cyan.bold('\n📝 TryForge Configuration\n'));

    // Show config sources
    console.log(chalk.gray('Configuration Sources:'));
    if (info.userFile) {
      console.log(chalk.gray(`  User:    ${info.userFile}`));
    }
    if (info.projectFile) {
      console.log(chalk.gray(`  Project: ${info.projectFile}`));
    }
    console.log(chalk.gray(`  Env:     ${info.environment}\n`));

    // Show config as pretty JSON
    console.log(chalk.white(JSON.stringify(config, null, 2)));
    console.log();

  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to load configuration: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Get a specific configuration value
 */
async function get(key) {
  try {
    if (!key) {
      console.error(chalk.red('\n✗ Please specify a configuration key\n'));
      console.log(chalk.gray('Example: tryforge config get ai.model\n'));
      process.exit(1);
    }

    const value = getValue(key);

    if (value === undefined) {
      console.error(chalk.red(`\n✗ Configuration key '${key}' not found\n`));
      process.exit(1);
    }

    // Format output based on value type
    if (typeof value === 'object') {
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(value);
    }

  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to get configuration: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Set a configuration value
 */
async function set(key, value, options = {}) {
  try {
    if (!key || value === undefined) {
      console.error(chalk.red('\n✗ Please specify both key and value\n'));
      console.log(chalk.gray('Example: tryforge config set ai.model claude-3-opus-20240229\n'));
      process.exit(1);
    }

    const { global } = options;
    const target = global ? 'user' : 'project';

    // Parse value (handle booleans, numbers, etc.)
    const parsedValue = parseValue(value);

    // Ensure config directory exists
    if (target === 'user') {
      initUserConfigDirSync();
      if (!fs.existsSync(USER_CONFIG_FILE)) {
        initConfigFileSync(USER_CONFIG_FILE, getDefaults());
      }
    }

    // Set and save value
    await setValueAndSave(key, parsedValue, target);

    console.log(chalk.green(`\n✓ Updated ${key} to ${JSON.stringify(parsedValue)}\n`));

  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to set configuration: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Unset a configuration value (reset to default)
 */
async function unset(key, options = {}) {
  try {
    if (!key) {
      console.error(chalk.red('\n✗ Please specify a configuration key\n'));
      console.log(chalk.gray('Example: tryforge config unset ai.temperature\n'));
      process.exit(1);
    }

    const { global } = options;
    const defaultValue = getValue(key, getDefaults()[key]);

    // Remove from file by setting to default
    const target = global ? 'user' : 'project';
    await setValueAndSave(key, defaultValue, target);

    console.log(chalk.green(`\n✓ Reset ${key} to default (${JSON.stringify(defaultValue)})\n`));

  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to unset configuration: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * List all configuration keys
 */
async function list() {
  try {
    const config = getConfig();
    const keys = getAllPaths(config);

    console.log(chalk.cyan.bold('\n📝 Configuration Keys\n'));

    keys.forEach(key => {
      const value = getValue(key);
      const valueStr = typeof value === 'object'
        ? chalk.gray('[object]')
        : chalk.gray(`= ${JSON.stringify(value)}`);

      console.log(chalk.white(key) + ' ' + valueStr);
    });

    console.log(chalk.gray(`\nTotal: ${keys.length} keys\n`));

  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to list configuration: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Edit configuration in editor
 */
async function edit(options = {}) {
  try {
    const { global } = options;
    let filepath;

    if (global) {
      filepath = findUserConfigFile();
      if (!filepath) {
        // Create user config file
        initUserConfigDirSync();
        initConfigFileSync(USER_CONFIG_FILE, getDefaults());
        filepath = USER_CONFIG_FILE;
      }
    } else {
      filepath = findConfigFile();
      if (!filepath) {
        // Create project config file
        const projectConfig = path.join(process.cwd(), 'tryforge.config.json');
        initConfigFileSync(projectConfig, {});
        filepath = projectConfig;
      }
    }

    // Get editor from config or environment
    const editor = getValue('cli.editor', process.env.EDITOR || 'vim');

    console.log(chalk.cyan(`\n📝 Opening ${filepath} in ${editor}...\n`));

    // Open in editor (synchronous to wait for user to finish)
    try {
      execSync(`${editor} "${filepath}"`, { stdio: 'inherit' });
      console.log(chalk.green('\n✓ Configuration file updated\n'));
    } catch (error) {
      console.error(chalk.red(`\n✗ Failed to open editor: ${error.message}\n`));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to edit configuration: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Validate configuration
 */
async function validate() {
  try {
    console.log(chalk.cyan('\n🔍 Validating configuration...\n'));

    const result = validateCurrentConfig();
    const output = formatValidationResult(result);

    console.log(output);

    if (!result.valid) {
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red(`\n✗ Validation error: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Reset configuration to defaults
 */
async function reset(options = {}) {
  try {
    const { global, force } = options;

    if (!force) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Are you sure you want to reset all configuration to defaults?',
          default: false
        }
      ]);

      if (!confirmed) {
        console.log(chalk.gray('\nOperation cancelled\n'));
        return;
      }
    }

    const filepath = global ? USER_CONFIG_FILE : findConfigFile();

    if (!filepath) {
      console.error(chalk.red('\n✗ No configuration file found\n'));
      process.exit(1);
    }

    // Write defaults to file
    const defaults = getDefaults();
    writeConfigSync(filepath, defaults);

    console.log(chalk.green('\n✓ Configuration reset to defaults\n'));

  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to reset configuration: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Migrate configuration
 */
async function migrate() {
  try {
    console.log(chalk.cyan('\n🔄 Checking for configuration migrations...\n'));

    const config = getConfig();
    const check = needsMigration(config);

    if (!check.needed) {
      console.log(chalk.green(`✓ ${check.message}\n`));
      return;
    }

    console.log(chalk.yellow(`Found config version ${check.from}`));
    console.log(chalk.yellow(`Migrating to version ${check.to}...\n`));

    const result = await migrateConfig(config, {
      backup: true,
      backupDir: process.cwd()
    });

    if (result.success) {
      if (result.backupPath) {
        console.log(chalk.gray(`✓ Backup created: ${result.backupPath}`));
      }
      console.log(chalk.green(`✓ ${result.message}\n`));

      // Save migrated config
      const filepath = findConfigFile() || USER_CONFIG_FILE;
      writeConfigSync(filepath, result.config);

    } else {
      console.error(chalk.red(`✗ ${result.message}\n`));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red(`\n✗ Migration failed: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Show configuration info
 */
async function info() {
  try {
    const configInfo = getInstance().getInfo();
    const config = getConfig();

    console.log(chalk.cyan.bold('\n📋 Configuration Info\n'));

    console.log(chalk.white('Status:'));
    console.log(chalk.gray(`  Loaded:      ${configInfo.loaded ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`  Watching:    ${configInfo.watching ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`  Environment: ${configInfo.environment}`));
    console.log(chalk.gray(`  Version:     ${configInfo.version}\n`));

    console.log(chalk.white('Files:'));
    if (configInfo.userFile) {
      console.log(chalk.gray(`  User:    ${configInfo.userFile}`));
    } else {
      console.log(chalk.gray(`  User:    (none)`));
    }
    if (configInfo.projectFile) {
      console.log(chalk.gray(`  Project: ${configInfo.projectFile}`));
    } else {
      console.log(chalk.gray(`  Project: (none)`));
    }
    console.log();

    // Check for migrations
    const migrationCheck = needsMigration(config);
    if (migrationCheck.needed) {
      console.log(chalk.yellow('⚠ Migration Available:'));
      console.log(chalk.gray(`  ${migrationCheck.message}\n`));
    }

  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to get info: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Parse string value to appropriate type
 */
function parseValue(value) {
  // Try to parse as JSON first
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // If parsing fails, return as string
    }
  }

  // Boolean values
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Null
  if (value === 'null') return null;

  // Numbers
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

  // Default: string
  return value;
}

/**
 * Main execute function for routing subcommands
 */
async function execute(action, key, value, options = {}) {
  switch (action) {
    case 'show':
      await show();
      break;
    case 'get':
      await get(key);
      break;
    case 'set':
      await set(key, value, options);
      break;
    case 'unset':
      await unset(key, options);
      break;
    case 'list':
      await list();
      break;
    case 'edit':
      await edit(options);
      break;
    case 'validate':
      await validate();
      break;
    case 'reset':
      await reset(options);
      break;
    case 'migrate':
      await migrate();
      break;
    case 'info':
      await info();
      break;
    default:
      // Default to show if no action specified
      await show();
  }
}

module.exports = {
  execute,
  show,
  get,
  set,
  unset,
  list,
  edit,
  validate,
  reset,
  migrate,
  info
};
