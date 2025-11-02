#!/usr/bin/env node

/**
 * TryForge CLI - Main Entry Point
 * Triple AI Application Framework (Claude + GitHub Spark + Pollinations AI)
 */

const { Command } = require('commander');
const chalk = require('chalk');
const packageJson = require('../../package.json');
const CreateCommand = require('./commands/create');
const RefactorCommand = require('./commands/refactor');
const AnalyzeCommand = require('./commands/analyze');
const StatusCommand = require('./commands/status');

const program = new Command();

// Configure CLI
program
  .name('tryforge')
  .description(chalk.cyan('🔥 TryForge - Triple AI Application Framework'))
  .version(packageJson.version, '-v, --version', 'Output the version number')
  .helpOption('-h, --help', 'Display help for command');

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

// Interactive mode (no args)
if (process.argv.length === 2) {
  console.log(chalk.cyan.bold('\n🔥 TryForge - Triple AI Application Framework\n'));
  console.log(chalk.gray('From idea to app in minutes!\n'));
  console.log(chalk.white('Usage examples:'));
  console.log(chalk.gray('  $ tryforge create "Blog platform with comments"'));
  console.log(chalk.gray('  $ tryforge refactor "improve UI and add dark mode"'));
  console.log(chalk.gray('  $ tryforge analyze performance'));
  console.log(chalk.gray('  $ tryforge status\n'));
  console.log(chalk.white('For help:'));
  console.log(chalk.gray('  $ tryforge --help\n'));
  process.exit(0);
}

// Parse and execute
program.parse(process.argv);
