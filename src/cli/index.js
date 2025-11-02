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
  .action(async (description, options) => {
    await CreateCommand.execute(description, options);
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
  .action(async (platform, options) => {
    const DeployCommand = require('./commands/deploy');
    await DeployCommand.execute(platform, options);
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
  console.log(chalk.gray('  $ tryforge admin                       # Configure API keys'));
  console.log(chalk.gray('  $ tryforge create "Blog platform"      # Create complete app'));
  console.log(chalk.gray('  $ tryforge models:generate -d "..."    # Auto-generate models'));
  console.log(chalk.gray('  $ tryforge graphics:generate -t blog   # Auto-generate graphics'));
  console.log(chalk.gray('  $ tryforge preview                     # Live preview'));
  console.log(chalk.gray('  $ tryforge generate component "..."    # AI code gen'));
  console.log(chalk.gray('  $ tryforge deploy vercel               # Deploy\n'));
  console.log(chalk.white('📚 More commands:'));
  console.log(chalk.gray('  $ tryforge --help\n'));
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
