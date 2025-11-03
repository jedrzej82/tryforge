/**
 * Plugin Command
 * Manages TryForge plugins
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const logger = require('../../utils/logger');
const { handleError } = require('../../utils/error-handler');
const { pluginManager, hookSystem } = require('../../plugins/plugin-manager');
const registry = require('../../plugins/plugin-registry');

class PluginCommand {
  /**
   * Main execute function
   */
  static async execute(action, name, options = {}) {
    try {
      await pluginManager.init();

      switch (action) {
        case 'list':
          await this.list(options);
          break;
        case 'install':
          await this.install(name, options);
          break;
        case 'uninstall':
          await this.uninstall(name, options);
          break;
        case 'enable':
          await this.enable(name);
          break;
        case 'disable':
          await this.disable(name);
          break;
        case 'info':
          await this.info(name);
          break;
        case 'create':
          await this.create(name, options);
          break;
        case 'search':
          await this.search(name);
          break;
        case 'update':
          await this.update(name);
          break;
        case 'reload':
          await this.reload(name);
          break;
        default:
          await this.list(options);
      }
    } catch (error) {
      handleError(error, { context: 'Plugin Command', exitOnError: true });
    }
  }

  /**
   * List plugins
   */
  static async list(options = {}) {
    console.log(chalk.cyan.bold('\n📦 TryForge Plugins\n'));

    const plugins = await pluginManager.list();

    if (plugins.length === 0) {
      console.log(chalk.gray('  No plugins installed\n'));
      console.log(chalk.white('  Install plugins with:'));
      console.log(chalk.gray('    tryforge plugin install <source>\n'));
      return;
    }

    // Filter by status
    let filteredPlugins = plugins;
    if (options.enabled) {
      filteredPlugins = plugins.filter(p => p.enabled);
    } else if (options.disabled) {
      filteredPlugins = plugins.filter(p => !p.enabled);
    }

    // Group by type
    const byType = {};
    for (const plugin of filteredPlugins) {
      const type = plugin.tryforge?.type || 'other';
      if (!byType[type]) byType[type] = [];
      byType[type].push(plugin);
    }

    // Display plugins
    for (const [type, typePlugins] of Object.entries(byType)) {
      console.log(chalk.white.bold(`  ${type.toUpperCase()} Plugins:`));

      for (const plugin of typePlugins) {
        const status = plugin.enabled ? chalk.green('✓ enabled') : chalk.gray('○ disabled');
        const loaded = plugin.loaded ? chalk.blue('[loaded]') : '';

        console.log(`    ${status} ${chalk.white(plugin.name)} ${loaded}`);
        console.log(`      ${chalk.gray(plugin.description || 'No description')}`);
        console.log(`      ${chalk.gray(`v${plugin.version}`)}`);
        console.log('');
      }
    }

    // Show statistics
    const stats = await pluginManager.getStats();
    console.log(chalk.white('  Statistics:'));
    console.log(chalk.gray(`    Total: ${stats.total}`));
    console.log(chalk.gray(`    Enabled: ${stats.enabled}`));
    console.log(chalk.gray(`    Disabled: ${stats.disabled}`));
    console.log(chalk.gray(`    Loaded: ${stats.loaded}`));
    console.log('');
  }

  /**
   * Install a plugin
   */
  static async install(source, options = {}) {
    if (!source) {
      logger.error('Please specify a plugin source');
      console.log(chalk.gray('\nExamples:'));
      console.log(chalk.gray('  tryforge plugin install ./path/to/plugin'));
      console.log(chalk.gray('  tryforge plugin install tryforge-plugin-name'));
      console.log(chalk.gray('  tryforge plugin install https://github.com/user/plugin.git\n'));
      return;
    }

    const spinner = ora(`Installing plugin: ${source}`).start();

    try {
      const result = await pluginManager.install(source, options);

      spinner.succeed(`Plugin installed: ${result.name}`);
      console.log(chalk.gray(`  Path: ${result.path}\n`));

      // Show plugin info
      await this.info(result.name);
    } catch (error) {
      spinner.fail('Installation failed');
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  static async uninstall(name, options = {}) {
    if (!name) {
      logger.error('Please specify a plugin name');
      return;
    }

    // Confirm
    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to uninstall ${name}?`,
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.gray('  Cancelled\n'));
        return;
      }
    }

    const spinner = ora(`Uninstalling plugin: ${name}`).start();

    try {
      await pluginManager.uninstall(name);
      spinner.succeed(`Plugin uninstalled: ${name}`);
    } catch (error) {
      spinner.fail('Uninstallation failed');
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  static async enable(name) {
    if (!name) {
      logger.error('Please specify a plugin name');
      return;
    }

    const spinner = ora(`Enabling plugin: ${name}`).start();

    try {
      await pluginManager.enable(name);
      spinner.succeed(`Plugin enabled: ${name}`);
    } catch (error) {
      spinner.fail('Enable failed');
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  static async disable(name) {
    if (!name) {
      logger.error('Please specify a plugin name');
      return;
    }

    const spinner = ora(`Disabling plugin: ${name}`).start();

    try {
      await pluginManager.disable(name);
      spinner.succeed(`Plugin disabled: ${name}`);
    } catch (error) {
      spinner.fail('Disable failed');
      throw error;
    }
  }

  /**
   * Show plugin information
   */
  static async info(name) {
    if (!name) {
      logger.error('Please specify a plugin name');
      return;
    }

    const info = await pluginManager.getInfo(name);

    if (!info) {
      logger.error(`Plugin not found: ${name}`);
      return;
    }

    console.log(chalk.cyan.bold(`\n📦 ${info.name}\n`));

    console.log(chalk.white('  Basic Information:'));
    console.log(`    Name: ${info.name}`);
    console.log(`    Version: ${info.version}`);
    console.log(`    Description: ${info.description || 'N/A'}`);
    console.log(`    Author: ${info.author || 'N/A'}`);
    console.log(`    License: ${info.license || 'N/A'}`);
    console.log('');

    if (info.tryforge) {
      console.log(chalk.white('  TryForge Configuration:'));
      console.log(`    Type: ${info.tryforge.type || 'N/A'}`);
      console.log(`    Hooks: ${info.tryforge.hooks?.join(', ') || 'None'}`);
      console.log(`    Permissions: ${info.tryforge.permissions?.join(', ') || 'None'}`);
      console.log('');
    }

    console.log(chalk.white('  Status:'));
    console.log(`    Enabled: ${info.enabled ? chalk.green('Yes') : chalk.gray('No')}`);
    console.log(`    Loaded: ${info.loaded ? chalk.green('Yes') : chalk.gray('No')}`);
    console.log(`    Installed: ${info.installedAt || 'N/A'}`);
    console.log('');

    if (info.path) {
      console.log(chalk.white('  Location:'));
      console.log(chalk.gray(`    ${info.path}\n`));
    }

    if (info.keywords && info.keywords.length > 0) {
      console.log(chalk.white('  Keywords:'));
      console.log(chalk.gray(`    ${info.keywords.join(', ')}\n`));
    }
  }

  /**
   * Create a new plugin
   */
  static async create(name, options = {}) {
    if (!name) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Plugin name:',
          validate: input => input.length > 0 || 'Name is required'
        }
      ]);
      name = answers.name;
    }

    // Ensure name starts with tryforge-plugin-
    if (!name.startsWith('tryforge-plugin-')) {
      name = `tryforge-plugin-${name}`;
    }

    console.log(chalk.cyan.bold(`\n🔌 Creating plugin: ${name}\n`));

    // Prompt for details
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: 'A TryForge plugin'
      },
      {
        type: 'list',
        name: 'type',
        message: 'Plugin type:',
        choices: [
          { name: 'CLI - Add custom commands', value: 'cli' },
          { name: 'Template - Add project templates', value: 'template' },
          { name: 'Generator - Generate code', value: 'generator' },
          { name: 'Transformer - Transform code', value: 'transformer' },
          { name: 'Integration - Integrate with services', value: 'integration' }
        ]
      },
      {
        type: 'checkbox',
        name: 'hooks',
        message: 'Select hooks to use:',
        choices: [
          'before:create',
          'after:create',
          'before:generate',
          'after:generate',
          'before:build',
          'after:build',
          'before:deploy',
          'after:deploy'
        ]
      },
      {
        type: 'checkbox',
        name: 'permissions',
        message: 'Select required permissions:',
        choices: [
          'filesystem:read',
          'filesystem:write',
          'network:request',
          'process:spawn',
          'database:read',
          'database:write'
        ]
      }
    ]);

    // Create plugin directory
    const pluginPath = options.path || process.cwd();
    const fullPath = require('path').join(pluginPath, name);

    await require('fs-extra').ensureDir(fullPath);

    // Generate package.json
    const packageJson = {
      name,
      version: '1.0.0',
      description: answers.description,
      main: 'index.js',
      keywords: ['tryforge', 'plugin', answers.type],
      author: '',
      license: 'MIT',
      tryforge: {
        type: answers.type,
        version: '1.0.0',
        hooks: answers.hooks,
        permissions: answers.permissions,
        compatibility: {
          node: '>=18.0.0',
          tryforge: '>=1.0.0'
        }
      },
      peerDependencies: {
        tryforge: '>=1.0.0'
      }
    };

    await require('fs-extra').writeJson(
      require('path').join(fullPath, 'package.json'),
      packageJson,
      { spaces: 2 }
    );

    // Generate index.js
    const indexJs = this.generatePluginTemplate(name, answers);
    await require('fs-extra').writeFile(
      require('path').join(fullPath, 'index.js'),
      indexJs
    );

    // Generate README.md
    const readme = this.generateReadme(name, answers);
    await require('fs-extra').writeFile(
      require('path').join(fullPath, 'README.md'),
      readme
    );

    console.log(chalk.green('\n✓ Plugin created successfully!\n'));
    console.log(chalk.white('  Location:'));
    console.log(chalk.gray(`    ${fullPath}\n`));
    console.log(chalk.white('  Next steps:'));
    console.log(chalk.gray(`    cd ${name}`));
    console.log(chalk.gray(`    # Edit index.js to implement your plugin`));
    console.log(chalk.gray(`    tryforge plugin install . --symlink\n`));
  }

  /**
   * Search for plugins
   */
  static async search(query) {
    if (!query) {
      logger.error('Please specify a search query');
      return;
    }

    console.log(chalk.cyan.bold(`\n🔍 Searching for: ${query}\n`));

    const results = await pluginManager.search(query);

    if (results.length === 0) {
      console.log(chalk.gray('  No plugins found\n'));
      return;
    }

    for (const plugin of results) {
      const status = plugin.enabled ? chalk.green('✓') : chalk.gray('○');
      console.log(`  ${status} ${chalk.white(plugin.name)}`);
      console.log(`    ${chalk.gray(plugin.description || 'No description')}`);
      console.log('');
    }
  }

  /**
   * Update a plugin
   */
  static async update(name) {
    if (!name) {
      logger.error('Please specify a plugin name');
      return;
    }

    const spinner = ora(`Updating plugin: ${name}`).start();

    try {
      // Get plugin info
      const info = await pluginManager.getInfo(name);

      if (!info) {
        throw new Error(`Plugin not found: ${name}`);
      }

      // Uninstall current version
      await pluginManager.uninstall(name);

      // Reinstall from source
      await pluginManager.install(info.source || name);

      spinner.succeed(`Plugin updated: ${name}`);
    } catch (error) {
      spinner.fail('Update failed');
      throw error;
    }
  }

  /**
   * Reload a plugin
   */
  static async reload(name) {
    if (!name) {
      logger.error('Please specify a plugin name');
      return;
    }

    const spinner = ora(`Reloading plugin: ${name}`).start();

    try {
      await pluginManager.reload(name);
      spinner.succeed(`Plugin reloaded: ${name}`);
    } catch (error) {
      spinner.fail('Reload failed');
      throw error;
    }
  }

  /**
   * Generate plugin template
   */
  static generatePluginTemplate(name, config) {
    return `/**
 * ${name}
 * ${config.description}
 */

module.exports = {
  name: '${name}',
  version: '1.0.0',
  description: '${config.description}',

  /**
   * Initialize plugin
   * @param {PluginAPI} api - Plugin API
   */
  async init(api) {
    api.logger.info('${name} initialized');

    ${config.hooks.map(hook => `
    // ${hook} hook
    api.hooks.${hook.startsWith('before:') ? 'before' : 'after'}('${hook.split(':')[1]}', async (context) => {
      api.logger.info('Hook: ${hook}');
      // Your code here
      return context;
    });`).join('\n')}

    // Add custom CLI command (optional)
    api.cli.addCommand('${name.replace('tryforge-plugin-', '')}', {
      description: '${config.description}',
      action: async (options) => {
        api.logger.info('Running ${name}');
        // Your code here
      }
    });
  },

  /**
   * Cleanup when plugin is unloaded
   */
  async destroy() {
    console.log('${name} unloaded');
  }
};
`;
  }

  /**
   * Generate README
   */
  static generateReadme(name, config) {
    return `# ${name}

${config.description}

## Installation

\`\`\`bash
tryforge plugin install ${name}
\`\`\`

## Usage

TODO: Add usage instructions

## Hooks

${config.hooks.map(hook => `- \`${hook}\``).join('\n')}

## Permissions

${config.permissions.map(perm => `- \`${perm}\``).join('\n')}

## Development

\`\`\`bash
# Install as symlink for development
tryforge plugin install . --symlink

# Make changes to index.js

# Reload plugin
tryforge plugin reload ${name}
\`\`\`

## License

MIT
`;
  }
}

module.exports = PluginCommand;
