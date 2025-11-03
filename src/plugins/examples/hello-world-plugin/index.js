/**
 * Hello World Plugin
 * Simple example plugin demonstrating TryForge plugin capabilities
 */

module.exports = {
  name: 'hello-world',
  version: '1.0.0',
  description: 'Simple hello world plugin',

  /**
   * Initialize plugin
   * @param {PluginAPI} api - Plugin API
   */
  async init(api) {
    api.logger.info('Hello World plugin initialized! 👋');

    // Register before:create hook
    api.hooks.before('create', async (context) => {
      api.logger.info('🚀 About to create a new project!');
      api.logger.info(`Project name: ${context.projectName || 'unknown'}`);

      // You can modify the context
      if (!context.greeting) {
        context.greeting = 'Welcome to TryForge!';
      }

      return context;
    });

    // Register after:create hook
    api.hooks.after('create', async (context) => {
      api.logger.success('Project created successfully! 🎉');
      api.logger.info(`Location: ${context.projectPath || 'unknown'}`);
    });

    // Register a custom CLI command
    api.cli.addCommand('hello', {
      description: 'Say hello from the plugin',
      action: async (options) => {
        const name = options.name || 'World';
        console.log(`\n🔥 Hello, ${name}! This is a custom command from hello-world plugin.\n`);
      }
    });

    // Register an action for demonstration
    api.hooks.addAction('demo:action', async (data) => {
      api.logger.info('Demo action triggered!', data);
    });

    // Register a filter for demonstration
    api.hooks.addFilter('demo:filter', async (value, context) => {
      api.logger.debug('Demo filter applied');
      return value.toUpperCase();
    });

    // Save some config
    api.config.set('initialized', true);
    api.config.set('initTime', new Date().toISOString());
  },

  /**
   * Cleanup when plugin is unloaded
   */
  async destroy() {
    console.log('👋 Goodbye from hello-world plugin!');
  }
};
