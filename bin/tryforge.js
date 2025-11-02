#!/usr/bin/env node

/**
 * TryForge CLI Entry Point
 * Triple AI Application Framework
 */

const { program } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');
const { createProject } = require('../src/commands/create');
const { refactorProject } = require('../src/commands/refactor');
const { analyzeProject } = require('../src/commands/analyze');
const { deployProject } = require('../src/commands/deploy');

program
  .name('tryforge')
  .description('TryForge - Triple AI Application Framework')
  .version(packageJson.version);

// CREATE command
program
  .command('create <name>')
  .description('Create a new application from scratch using Triple AI')
  .option('-t, --type <type>', 'Application type (blog, ecommerce, social, saas)', 'webapp')
  .option('--template <template>', 'Use specific template')
  .option('--no-graphics', 'Skip AI-generated graphics')
  .option('--no-frontend', 'Backend only')
  .option('--no-backend', 'Frontend only')
  .action(createProject);

// REFACTOR command
program
  .command('refactor [path]')
  .description('Analyze and improve existing application')
  .option('-f, --focus <area>', 'Focus area (ui, performance, security, all)', 'all')
  .option('--auto', 'Auto-apply suggested changes')
  .option('--report', 'Generate report only')
  .action(refactorProject);

// ANALYZE command
program
  .command('analyze [path]')
  .description('Deep analysis of application codebase')
  .option('--complexity', 'Analyze code complexity')
  .option('--security', 'Security audit')
  .option('--performance', 'Performance analysis')
  .action(analyzeProject);

// DEPLOY command
program
  .command('deploy [path]')
  .description('Deploy application to production')
  .option('-e, --env <environment>', 'Target environment', 'production')
  .option('--docker', 'Build Docker containers')
  .option('--verify', 'Verify deployment')
  .action(deployProject);

// INIT command
program
  .command('init')
  .description('Initialize TryForge in current directory')
  .action(() => {
    console.log(chalk.blue('🔥 Initializing TryForge...'));
    require('../src/commands/init')();
  });

// CONFIG command
program
  .command('config')
  .description('Configure TryForge settings')
  .option('--claude-key <key>', 'Set Claude API key')
  .option('--github-token <token>', 'Set GitHub token')
  .option('--show', 'Show current configuration')
  .action((options) => {
    require('../src/commands/config')(options);
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.bold.blue('\n🔥 TryForge - Triple AI Application Framework\n'));
  console.log(chalk.gray('Build production-ready apps in minutes using Claude + GitHub Spark + Pollinations AI\n'));
  program.outputHelp();
  console.log(chalk.yellow('\nExamples:'));
  console.log('  $ tryforge create my-blog --type blog');
  console.log('  $ tryforge refactor ./my-app --focus ui');
  console.log('  $ tryforge analyze ./my-app --security');
  console.log(chalk.gray('\nFor more information, visit: https://tryforge.dev\n'));
}
