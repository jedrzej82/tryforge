#!/usr/bin/env node

/**
 * TryForge CLI - Main Entry Point
 * Triple AI Application Framework (Claude + GitHub Spark + Pollinations AI)
 */

const { Command } = require('commander');
const chalk = require('chalk');
const packageJson = require('../../package.json');
const logger = require('../utils/logger');
const { handleError } = require('../utils/error-handler');
const CreateCommand = require('./commands/create');
const RefactorCommand = require('./commands/refactor');
const AnalyzeCommand = require('./commands/analyze');
const StatusCommand = require('./commands/status');
const { createPromptOrchestrator, prompts } = require('./prompts');

const program = new Command();

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  handleError(reason instanceof Error ? reason : new Error(String(reason)), {
    context: 'Unhandled Promise Rejection',
    exitOnError: true
  });
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  handleError(error, {
    context: 'Uncaught Exception',
    exitOnError: true
  });
});

// Configure CLI
program
  .name('tryforge')
  .description(chalk.cyan('🔥 TryForge - Triple AI Application Framework'))
  .version(packageJson.version, '-v, --version', 'Output the version number')
  .helpOption('-h, --help', 'Display help for command')
  .option('--verbose', 'Enable debug mode with detailed logging')
  .hook('preAction', (thisCommand) => {
    // Enable debug mode if --verbose flag is set
    if (thisCommand.opts().verbose) {
      logger.enableDebug();
      logger.debug('Debug mode enabled via --verbose flag');
    }

    // Log command execution
    logger.info(`Executing command: ${thisCommand.name()}`, {
      args: thisCommand.args,
      options: thisCommand.opts()
    });
  });

// INIT Command - Interactive project initialization
program
  .command('init')
  .description('Initialize a new project with interactive wizard')
  .option('-q, --quick', 'Quick setup with defaults')
  .option('--non-interactive', 'Non-interactive mode')
  .action(async (options) => {
    try {
      const orchestrator = createPromptOrchestrator({
        interactive: !options.nonInteractive,
        quick: options.quick
      });

      orchestrator.banner(
        '🔥 TryForge Project Initialization',
        'Create your app in minutes'
      );

      const config = await orchestrator.projectInit();

      if (!config) {
        logger.info('Project initialization cancelled');
        return;
      }

      logger.info('Starting project creation with configuration:', config);

      // Call create command with the config
      await CreateCommand.execute(config.description || config.projectName, {
        framework: config.template,
        styling: config.styling,
        database: config.features?.includes('database') ? 'postgresql' : 'none',
        auth: config.features?.includes('auth') ? 'jwt' : 'none',
        graphics: config.graphicsStyle,
        colors: config.colorScheme,
        template: 'standard',
        path: config.path,
        ...config
      });

      orchestrator.success('Project created successfully!', [
        `Location: ${config.path}`,
        `Template: ${config.template}`,
        `Next steps: cd ${config.projectName} && npm start`
      ]);
    } catch (error) {
      handleError(error, { context: 'Init Command', exitOnError: true });
    }
  });

// CONFIGURE Command - Interactive configuration management
program
  .command('configure [type]')
  .description('Configure TryForge settings (api-keys|database|deployment)')
  .action(async (type) => {
    try {
      const orchestrator = createPromptOrchestrator({ interactive: true });

      if (!type) {
        type = await orchestrator.select(
          'What would you like to configure?',
          [
            { name: 'API Keys', value: 'api-keys' },
            { name: 'Database', value: 'database' },
            { name: 'Deployment', value: 'deployment' }
          ]
        );
      }

      let config;

      switch (type) {
        case 'api-keys':
          config = await orchestrator.apiKeyConfig();
          logger.info('API keys configured:', Object.keys(config));
          orchestrator.success('API keys configured successfully!');
          break;

        case 'database':
          config = await orchestrator.databaseConfig();
          logger.info('Database configured:', config);
          orchestrator.success('Database configured successfully!');
          break;

        case 'deployment':
          config = await orchestrator.deploymentConfig();
          logger.info('Deployment configured:', config);
          orchestrator.success('Deployment configured successfully!');
          break;

        default:
          logger.error(`Unknown configuration type: ${type}`);
      }
    } catch (error) {
      handleError(error, { context: 'Configure Command', exitOnError: true });
    }
  });

// CREATE Command
program
  .command('create [description]')
  .description('Create a new application from description')
  .option('-f, --framework <type>', 'Framework (react|vue|angular|svelte)', 'react')
  .option('-s, --styling <type>', 'Styling (css|scss|tailwind|styled-components)', 'css')
  .option('-d, --database <type>', 'Database (postgresql|mysql|mongodb|sqlite)', 'postgresql')
  .option('-a, --auth <type>', 'Authentication (jwt|oauth|session|none)', 'jwt')
  .option('-g, --graphics <style>', 'Graphics style (modern|minimalist|professional|playful)', 'modern')
  .option('-c, --colors <scheme>', 'Color scheme')
  .option('-t, --template <name>', 'Template (minimal|standard|full)', 'standard')
  .option('--features <list>', 'Comma-separated feature list')
  .option('-i, --interactive', 'Interactive mode with prompts')
  .action(async (description, options) => {
    try {
      if (options.interactive) {
        const orchestrator = createPromptOrchestrator({ interactive: true });
        const config = await orchestrator.projectInit();

        if (!config) {
          logger.info('Project creation cancelled');
          return;
        }

        // Merge config with options
        options = { ...options, ...config };
        description = description || config.description || config.projectName;
      }

      await CreateCommand.execute(description, options);
    } catch (error) {
      handleError(error, { context: 'Create Command', exitOnError: true });
    }
  });

// REFACTOR Command
program
  .command('refactor [description]')
  .description('Refactor and improve existing application')
  .option('-s, --scope <area>', 'Scope (ui|performance|security|quality|all)', 'all')
  .option('-f, --files <pattern>', 'File pattern to refactor')
  .action(async (description, options) => {
    await RefactorCommand.execute(description, options);
  });

// ANALYZE Command
program
  .command('analyze [type]')
  .description('Analyze codebase (codebase|performance|security|ui|database|bundle)')
  .option('-o, --output <format>', 'Output format (console|json|markdown)', 'console')
  .action(async (type, options) => {
    await AnalyzeCommand.execute(type || 'codebase', options);
  });

// STATUS Command
program
  .command('status')
  .description('Show system and project status')
  .action(async () => {
    await StatusCommand.execute();
  });

// TEST Command
program
  .command('test [type]')
  .description('Run tests (all|backend|frontend|integration|e2e)')
  .option('-w, --watch', 'Watch mode')
  .action(async (type, options) => {
    const TestCommand = require('./commands/test');
    await TestCommand.execute(type || 'all', options);
  });

// BUILD Command
program
  .command('build')
  .description('Build application for production')
  .option('-e, --env <environment>', 'Environment (development|staging|production)', 'production')
  .action(async (options) => {
    const BuildCommand = require('./commands/build');
    await BuildCommand.execute(options);
  });

// START Command
program
  .command('start')
  .description('Start development servers')
  .action(async () => {
    const StartCommand = require('./commands/start');
    await StartCommand.execute();
  });

// STOP Command
program
  .command('stop')
  .description('Stop all servers')
  .action(async () => {
    const StopCommand = require('./commands/stop');
    await StopCommand.execute();
  });

// DB Commands
program
  .command('db:reset')
  .description('Reset database (drop, migrate, seed)')
  .action(async () => {
    const DbCommand = require('./commands/db');
    await DbCommand.reset();
  });

program
  .command('db:migrate')
  .description('Run database migrations')
  .action(async () => {
    const DbCommand = require('./commands/db');
    await DbCommand.migrate();
  });

program
  .command('db:seed')
  .description('Seed database with sample data')
  .action(async () => {
    const DbCommand = require('./commands/db');
    await DbCommand.seed();
  });

// ADMIN Command
program
  .command('admin')
  .description('Open admin panel for API configuration')
  .option('-p, --port <port>', 'Port for admin panel', '3333')
  .action(async (options) => {
    const AdminCommand = require('./commands/admin');
    await AdminCommand.execute(options);
  });

// PREVIEW Command
program
  .command('preview [path]')
  .description('Start live preview with hot reload')
  .action(async (path) => {
    const PreviewCommand = require('./commands/preview');
    await PreviewCommand.execute(path);
  });

// DEPLOY Command
program
  .command('deploy [platform]')
  .description('Deploy to cloud (vercel|netlify|railway|render)')
  .option('-p, --path <path>', 'Project path')
  .option('-i, --interactive', 'Interactive mode with prompts')
  .action(async (platform, options) => {
    try {
      if (options.interactive && !platform) {
        const orchestrator = createPromptOrchestrator({ interactive: true });
        const config = await orchestrator.deploymentConfig();

        if (!config) {
          logger.info('Deployment cancelled');
          return;
        }

        platform = config.platform;
        options = { ...options, ...config };
      }

      const DeployCommand = require('./commands/deploy');
      await DeployCommand.execute(platform, options);
    } catch (error) {
      handleError(error, { context: 'Deploy Command', exitOnError: true });
    }
  });

program
  .command('deploy:status <platform>')
  .description('Check deployment status')
  .option('-p, --path <path>', 'Project path')
  .action(async (platform, options) => {
    const DeployCommand = require('./commands/deploy');
    await DeployCommand.status(platform, options);
  });

// GENERATE Command
program
  .command('generate [type] [description]')
  .description('AI-powered code generation (component|route|feature|test)')
  .option('-p, --path <path>', 'Project path')
  .option('-f, --file <file>', 'File path (for test generation)')
  .action(async (type, description, options) => {
    const GenerateCommand = require('./commands/generate');
    await GenerateCommand.execute(type, description, options);
  });

// MODELS Commands - Autonomous Model Generation
program
  .command('models:generate')
  .description('Automatically generate missing database models')
  .option('-d, --description <desc>', 'Application description')
  .option('-r, --requirements <file>', 'Requirements JSON file')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--orm <type>', 'ORM type (prisma|sequelize|typeorm|mongoose)', 'prisma')
  .option('--language <lang>', 'Language (typescript|javascript)', 'typescript')
  .option('--no-enrich', 'Skip AI enrichment')
  .option('--no-migrations', 'Skip migration generation')
  .option('-i, --interactive', 'Interactive mode with confirmations')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const ModelsCommand = require('./commands/models');
    await ModelsCommand.generate(options);
  });

program
  .command('models:detect')
  .description('Detect and generate missing models from code')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--orm <type>', 'ORM type', 'prisma')
  .option('--language <lang>', 'Language', 'typescript')
  .option('--no-migrations', 'Skip migration generation')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const ModelsCommand = require('./commands/models');
    await ModelsCommand.detect(options);
  });

program
  .command('models:watch')
  .description('Watch and auto-generate missing models')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--orm <type>', 'ORM type', 'prisma')
  .option('--language <lang>', 'Language', 'typescript')
  .action(async (options) => {
    const ModelsCommand = require('./commands/models');
    await ModelsCommand.watch(options);
  });

program
  .command('models:list')
  .description('List existing models in project')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    const ModelsCommand = require('./commands/models');
    await ModelsCommand.list(options);
  });

program
  .command('models:analyze')
  .description('Analyze models and suggest improvements')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--orm <type>', 'ORM type', 'prisma')
  .action(async (options) => {
    const ModelsCommand = require('./commands/models');
    await ModelsCommand.analyze(options);
  });

// GRAPHICS Commands - Autonomous Graphics Generation
program
  .command('graphics:generate')
  .description('Automatically generate professional graphics')
  .option('-d, --description <desc>', 'Application description')
  .option('-r, --requirements <file>', 'Requirements JSON file')
  .option('-t, --type <type>', 'Application type (e-commerce|blog|dashboard|saas)')
  .option('-n, --name <name>', 'Application name')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-o, --output <dir>', 'Output directory', 'public/images')
  .option('--style <style>', 'Graphics style (modern|minimalist|professional)', 'modern')
  .option('--colors <scheme>', 'Color scheme', 'blue and white')
  .option('--quality <percent>', 'Image quality (1-100)', '90')
  .option('--no-enrich', 'Skip AI enrichment')
  .option('--no-variations', 'Skip generating variations')
  .option('--no-optimize', 'Skip image optimization')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const GraphicsCommand = require('./commands/graphics');
    await GraphicsCommand.generate(options);
  });

program
  .command('graphics:detect')
  .description('Detect and generate missing graphics from code')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-o, --output <dir>', 'Output directory', 'public/images')
  .option('--quality <percent>', 'Image quality (1-100)', '90')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const GraphicsCommand = require('./commands/graphics');
    await GraphicsCommand.detect(options);
  });

program
  .command('graphics:watch')
  .description('Watch and auto-generate missing graphics')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-o, --output <dir>', 'Output directory', 'public/images')
  .option('--quality <percent>', 'Image quality (1-100)', '90')
  .action(async (options) => {
    const GraphicsCommand = require('./commands/graphics');
    await GraphicsCommand.watch(options);
  });

program
  .command('graphics:list')
  .description('List all graphics in project')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    const GraphicsCommand = require('./commands/graphics');
    await GraphicsCommand.list(options);
  });

program
  .command('graphics:analyze')
  .description('Analyze graphics and provide optimization insights')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    const GraphicsCommand = require('./commands/graphics');
    await GraphicsCommand.analyze(options);
  });

program
  .command('graphics:type <type>')
  .description('Generate specific graphic type (logo|favicon|hero|og-image)')
  .option('-n, --name <name>', 'Application name')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-o, --output <dir>', 'Output directory', 'public/images')
  .option('--style <style>', 'Graphics style')
  .action(async (type, options) => {
    const GraphicsCommand = require('./commands/graphics');
    await GraphicsCommand.generateType(type, options);
  });

// COMPLETION Commands
program
  .command('completion [action] [shell]')
  .description('Manage shell auto-completion (install|uninstall|generate|verify|status)')
  .option('-o, --output <file>', 'Output file for generated script')
  .action(async (action, shell, options) => {
    const CompletionCommand = require('./commands/completion');
    await CompletionCommand.execute(action, shell, options);
  });

program
  .command('completion:install [shell]')
  .description('Install auto-completion for your shell')
  .action(async (shell) => {
    const CompletionCommand = require('./commands/completion');
    await CompletionCommand.install({ shell });
  });

program
  .command('completion:uninstall [shell]')
  .description('Uninstall auto-completion')
  .action(async (shell) => {
    const CompletionCommand = require('./commands/completion');
    await CompletionCommand.uninstall({ shell });
  });

// CONFIG Commands
program
  .command('config [action] [key] [value]')
  .description('Manage configuration (show|get|set|unset|list|edit|validate|reset|migrate|info)')
  .option('-g, --global', 'Use global user config instead of project config')
  .option('-f, --force', 'Skip confirmation prompts')
  .action(async (action, key, value, options) => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.execute(action || 'show', key, value, options);
  });

program
  .command('config:get <key>')
  .description('Get a configuration value')
  .action(async (key) => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.get(key);
  });

program
  .command('config:set <key> <value>')
  .description('Set a configuration value')
  .option('-g, --global', 'Use global user config')
  .action(async (key, value, options) => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.set(key, value, options);
  });

program
  .command('config:unset <key>')
  .description('Unset a configuration value (reset to default)')
  .option('-g, --global', 'Use global user config')
  .action(async (key, options) => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.unset(key, options);
  });

program
  .command('config:list')
  .description('List all configuration keys')
  .action(async () => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.list();
  });

program
  .command('config:edit')
  .description('Edit configuration in default editor')
  .option('-g, --global', 'Edit global user config')
  .action(async (options) => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.edit(options);
  });

program
  .command('config:validate')
  .description('Validate configuration')
  .action(async () => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.validate();
  });

program
  .command('config:reset')
  .description('Reset configuration to defaults')
  .option('-g, --global', 'Reset global user config')
  .option('-f, --force', 'Skip confirmation')
  .action(async (options) => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.reset(options);
  });

program
  .command('config:migrate')
  .description('Migrate configuration to latest version')
  .action(async () => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.migrate();
  });

program
  .command('config:info')
  .description('Show configuration information')
  .action(async () => {
    const ConfigCommand = require('./commands/config');
    await ConfigCommand.info();
  });

// HELP Commands - Enhanced Help System
program
  .command('help [command]')
  .description('Display help for a specific command')
  .option('--search <keyword>', 'Search help content')
  .option('--examples', 'Show all examples')
  .action(async (command, options) => {
    const HelpSystem = require('./help');

    if (options.search) {
      HelpSystem.search(options.search);
    } else if (options.examples) {
      HelpSystem.displayAllExamples();
    } else if (command) {
      HelpSystem.displayCommandHelp(command);
    } else {
      HelpSystem.displayMainHelp();
    }
  });

program
  .command('examples [command]')
  .description('Show examples for a command')
  .action(async (command) => {
    const HelpSystem = require('./help');

    if (command) {
      HelpSystem.displayExamples(command);
    } else {
      HelpSystem.displayAllExamples();
    }
  });

program
  .command('guide [topic]')
  .description('Show guide on specific topic')
  .option('--list', 'List all available guides')
  .action(async (topic, options) => {
    const HelpSystem = require('./help');

    if (options.list) {
      HelpSystem.listGuides();
    } else if (topic) {
      HelpSystem.displayGuide(topic);
    } else {
      HelpSystem.listGuides();
    }
  });

program
  .command('doctor')
  .description('Diagnose common issues')
  .action(async () => {
    const HelpSystem = require('./help');
    await HelpSystem.displayDoctor();
  });

program
  .command('workflows')
  .description('Show common workflows')
  .action(async () => {
    const HelpSystem = require('./help');
    HelpSystem.displayWorkflows();
  });

// Interactive mode (no args)
if (process.argv.length === 2) {
  console.log(chalk.cyan.bold('\n🔥 TryForge - Triple AI Application Framework\n'));
  console.log(chalk.gray('The most powerful AI-powered development tool!\n'));
  console.log(chalk.white('✨ Features:'));
  console.log(chalk.gray('  • Real Claude API integration for intelligent code generation'));
  console.log(chalk.gray('  • Live preview with hot reload (like Replit)'));
  console.log(chalk.gray('  • One-click deployment to Vercel/Netlify/Railway'));
  console.log(chalk.gray('  • AI-powered auto-fix and code improvements\n'));
  console.log(chalk.white('🚀 Quick Start:'));
  console.log(chalk.gray('  $ tryforge init                        # Interactive project setup'));
  console.log(chalk.gray('  $ tryforge init --quick                # Quick setup with defaults'));
  console.log(chalk.gray('  $ tryforge configure                   # Configure settings'));
  console.log(chalk.gray('  $ tryforge admin                       # Configure API keys'));
  console.log(chalk.gray('  $ tryforge create "Blog platform" -i   # Create with prompts'));
  console.log(chalk.gray('  $ tryforge models:generate -d "..."    # Auto-generate models'));
  console.log(chalk.gray('  $ tryforge graphics:generate -t blog   # Auto-generate graphics'));
  console.log(chalk.gray('  $ tryforge preview                     # Live preview'));
  console.log(chalk.gray('  $ tryforge deploy -i                   # Deploy with prompts'));
  console.log(chalk.gray('  $ tryforge completion install          # Install auto-completion\n'));
  console.log(chalk.white('📚 Help & Documentation:'));
  console.log(chalk.gray('  $ tryforge help                        # Main help'));
  console.log(chalk.gray('  $ tryforge help <command>              # Command help'));
  console.log(chalk.gray('  $ tryforge examples                    # View examples'));
  console.log(chalk.gray('  $ tryforge guide getting-started       # Getting started'));
  console.log(chalk.gray('  $ tryforge doctor                      # Diagnose issues'));
  console.log(chalk.gray('  $ tryforge --help                      # All commands\n'));
  process.exit(0);
}

// Parse and execute with error handling
try {
  program.parse(process.argv);
} catch (error) {
  handleError(error, {
    context: 'CLI Execution',
    exitOnError: true
  });
}
