/**
 * Code Formatter Plugin
 * Automatically formats generated code using Prettier
 */

const path = require('path');
const prettier = require('prettier');

module.exports = {
  name: 'code-formatter',
  version: '1.0.0',
  description: 'Automatic code formatting plugin',

  /**
   * Default Prettier configuration
   */
  defaultConfig: {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 100,
    arrowParens: 'avoid'
  },

  /**
   * Initialize plugin
   */
  async init(api) {
    api.logger.info('Code Formatter plugin initialized');

    // Store configuration
    api.config.set('enabled', true);
    api.config.set('autoFormat', true);
    api.config.set('prettierConfig', this.defaultConfig);

    // Register after:generate hook to format generated code
    api.hooks.after('generate', async (context) => {
      if (!api.config.get('enabled')) return context;

      api.logger.info('Formatting generated code...');

      if (context.filePath) {
        await this.formatFile(context.filePath, api);
      } else if (context.files) {
        for (const file of context.files) {
          await this.formatFile(file, api);
        }
      }

      api.logger.success('Code formatted successfully');
      return context;
    });

    // Register after:create hook to format entire project
    api.hooks.after('create', async (context) => {
      if (!api.config.get('autoFormat')) return context;

      api.logger.info('Formatting project files...');

      const projectPath = context.projectPath || context.path;
      if (projectPath) {
        await this.formatProject(projectPath, api);
      }

      return context;
    });

    // Add format command
    api.cli.addCommand('format', {
      description: 'Format code files',
      action: async (options) => {
        const targetPath = options.path || process.cwd();
        const files = options.files ? options.files.split(',') : null;

        api.logger.info('Formatting code...');

        if (files) {
          // Format specific files
          for (const file of files) {
            const filePath = path.resolve(targetPath, file);
            await this.formatFile(filePath, api);
          }
        } else {
          // Format entire project
          await this.formatProject(targetPath, api);
        }

        api.logger.success('Formatting complete!');
      }
    });

    // Add format configuration command
    api.cli.addCommand('format:config', {
      description: 'Configure code formatter',
      action: async (options) => {
        if (options.show) {
          const config = api.config.get('prettierConfig');
          console.log('\n📝 Current Formatter Configuration:\n');
          console.log(JSON.stringify(config, null, 2));
          console.log('');
        } else if (options.reset) {
          api.config.set('prettierConfig', this.defaultConfig);
          api.logger.success('Configuration reset to defaults');
        } else if (options.set) {
          const [key, value] = options.set.split('=');
          const config = api.config.get('prettierConfig');
          config[key] = this.parseValue(value);
          api.config.set('prettierConfig', config);
          api.logger.success(`Set ${key} = ${value}`);
        }
      }
    });

    // Add toggle command
    api.cli.addCommand('format:toggle', {
      description: 'Enable/disable auto-formatting',
      action: async () => {
        const enabled = !api.config.get('enabled');
        api.config.set('enabled', enabled);
        api.logger.success(`Auto-formatting ${enabled ? 'enabled' : 'disabled'}`);
      }
    });
  },

  /**
   * Format a single file
   */
  async formatFile(filePath, api) {
    try {
      // Check if file should be formatted
      if (!this.shouldFormat(filePath)) {
        api.logger.debug(`Skipping: ${path.basename(filePath)}`);
        return;
      }

      // Read file
      const content = await api.fs.readFile(filePath, 'utf-8');

      // Get prettier config
      const config = api.config.get('prettierConfig');

      // Determine parser from file extension
      const parser = this.getParser(filePath);
      if (!parser) {
        api.logger.debug(`No parser for: ${path.basename(filePath)}`);
        return;
      }

      // Format code
      const formatted = await prettier.format(content, {
        ...config,
        parser,
        filepath: filePath
      });

      // Write back if changed
      if (formatted !== content) {
        await api.fs.writeFile(filePath, formatted);
        api.logger.debug(`Formatted: ${path.basename(filePath)}`);
      }
    } catch (error) {
      api.logger.warn(`Failed to format ${path.basename(filePath)}: ${error.message}`);
    }
  },

  /**
   * Format all files in a project
   */
  async formatProject(projectPath, api) {
    const glob = require('glob');

    // Find all formattable files
    const patterns = [
      '**/*.js',
      '**/*.jsx',
      '**/*.ts',
      '**/*.tsx',
      '**/*.json',
      '**/*.css',
      '**/*.scss',
      '**/*.md'
    ];

    const ignore = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**'
    ];

    let totalFormatted = 0;

    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore
      });

      for (const file of files) {
        await this.formatFile(file, api);
        totalFormatted++;
      }
    }

    api.logger.info(`Formatted ${totalFormatted} files`);
  },

  /**
   * Check if file should be formatted
   */
  shouldFormat(filePath) {
    const ext = path.extname(filePath);
    const formattableExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.json', '.css', '.scss', '.less',
      '.md', '.html', '.vue'
    ];

    return formattableExtensions.includes(ext);
  },

  /**
   * Get Prettier parser for file
   */
  getParser(filePath) {
    const ext = path.extname(filePath);

    const parserMap = {
      '.js': 'babel',
      '.jsx': 'babel',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.json': 'json',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less',
      '.md': 'markdown',
      '.html': 'html',
      '.vue': 'vue'
    };

    return parserMap[ext] || null;
  },

  /**
   * Parse configuration value
   */
  parseValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(value)) return Number(value);
    return value;
  },

  /**
   * Cleanup
   */
  async destroy() {
    console.log('Code Formatter plugin unloaded');
  }
};
