/**
 * TryForge Enhanced Help System
 * Main help system with examples, guides, and interactive tutorials
 */

const chalk = require('chalk');
const {
  formatHeader,
  formatSubheader,
  formatCommand,
  formatOption,
  formatBox,
  formatTip,
  formatLink,
  formatDivider
} = require('./formatter');
const { displayExamples, displayAllExamples, displayWorkflows } = require('./examples');
const { displayGuide, listGuides } = require('./guides');
const { search, commandDescriptions } = require('./search');

/**
 * Display enhanced help for a specific command
 */
function displayCommandHelp(commandName) {
  const commandInfo = commandDescriptions[commandName];

  if (!commandInfo) {
    console.log(chalk.yellow(`\nCommand '${commandName}' not found.\n`));
    console.log(chalk.white('Available commands:'));
    displayAllCommands();
    return;
  }

  console.log(formatHeader(`${commandName} - ${commandInfo.description}`, '📝'));

  // Usage section
  console.log(formatSubheader('USAGE\n'));
  console.log(formatCommand(`tryforge ${commandName} [options]`));
  console.log();

  // Description
  console.log(formatSubheader('DESCRIPTION\n'));
  console.log(chalk.gray(`  ${commandInfo.description}`));
  console.log();

  // Category
  console.log(formatSubheader('CATEGORY\n'));
  console.log(chalk.gray(`  ${commandInfo.category}`));
  console.log();

  // Command-specific details
  displayCommandDetails(commandName);

  // Examples link
  console.log(formatSubheader('EXAMPLES\n'));
  console.log(chalk.gray(`  View examples: ${chalk.cyan(`tryforge examples ${commandName}`)}`));
  console.log();

  // Related commands
  const related = getRelatedCommands(commandName);
  if (related.length > 0) {
    console.log(formatSubheader('RELATED COMMANDS\n'));
    related.forEach(cmd => {
      console.log(chalk.gray(`  • ${chalk.cyan(cmd)} - ${commandDescriptions[cmd].description}`));
    });
    console.log();
  }

  // Learn more
  console.log(formatSubheader('LEARN MORE\n'));
  console.log(chalk.gray('  📚 Full documentation:'), formatLink('https://docs.tryforge.dev', 'https://docs.tryforge.dev'));
  console.log(chalk.gray('  💬 Get help:'), formatLink('GitHub Discussions', 'https://github.com/jedrzej82/tryforge/discussions'));
  console.log(chalk.gray('  🐛 Report bug:'), formatLink('GitHub Issues', 'https://github.com/jedrzej82/tryforge/issues'));
  console.log();
}

/**
 * Display command-specific details
 */
function displayCommandDetails(commandName) {
  const details = {
    create: () => {
      console.log(formatSubheader('OPTIONS\n'));
      console.log(formatOption('-f, --framework <type>', 'Framework (react|vue|angular|svelte)', 'react'));
      console.log(formatOption('-s, --styling <type>', 'Styling (css|scss|tailwind|styled)', 'css'));
      console.log(formatOption('-d, --database <type>', 'Database (postgresql|mysql|mongodb|sqlite)', 'postgresql'));
      console.log(formatOption('-a, --auth <type>', 'Authentication (jwt|oauth|session|none)', 'jwt'));
      console.log(formatOption('-t, --template <name>', 'Template (minimal|standard|full)', 'standard'));
      console.log(formatOption('--features <list>', 'Comma-separated feature list'));
      console.log(formatOption('--verbose', 'Enable debug mode'));
      console.log();
    },
    generate: () => {
      console.log(formatSubheader('OPTIONS\n'));
      console.log(formatOption('-p, --path <path>', 'Project path'));
      console.log(formatOption('-f, --file <file>', 'File path (for test generation)'));
      console.log(formatOption('--verbose', 'Enable debug mode'));
      console.log();
      console.log(formatSubheader('TYPES\n'));
      console.log(chalk.gray('  • component - Generate React/Vue component'));
      console.log(chalk.gray('  • feature - Generate complete feature'));
      console.log(chalk.gray('  • route - Generate API route'));
      console.log(chalk.gray('  • test - Generate test file'));
      console.log();
    },
    'models:generate': () => {
      console.log(formatSubheader('OPTIONS\n'));
      console.log(formatOption('-d, --description <desc>', 'Application description'));
      console.log(formatOption('-r, --requirements <file>', 'Requirements JSON file'));
      console.log(formatOption('--orm <type>', 'ORM type (prisma|sequelize|typeorm|mongoose)', 'prisma'));
      console.log(formatOption('--language <lang>', 'Language (typescript|javascript)', 'typescript'));
      console.log(formatOption('--no-enrich', 'Skip AI enrichment'));
      console.log(formatOption('--no-migrations', 'Skip migration generation'));
      console.log(formatOption('-i, --interactive', 'Interactive mode'));
      console.log(formatOption('-v, --verbose', 'Verbose output'));
      console.log();
    },
    'graphics:generate': () => {
      console.log(formatSubheader('OPTIONS\n'));
      console.log(formatOption('-n, --name <name>', 'Application name'));
      console.log(formatOption('-t, --type <type>', 'Application type (e-commerce|blog|dashboard|saas)'));
      console.log(formatOption('--style <style>', 'Graphics style (modern|minimalist|professional)', 'modern'));
      console.log(formatOption('--colors <scheme>', 'Color scheme', 'blue and white'));
      console.log(formatOption('--quality <percent>', 'Image quality (1-100)', '90'));
      console.log(formatOption('--no-optimize', 'Skip image optimization'));
      console.log(formatOption('-v, --verbose', 'Verbose output'));
      console.log();
    },
    deploy: () => {
      console.log(formatSubheader('PLATFORMS\n'));
      console.log(chalk.gray('  • vercel - Deploy to Vercel'));
      console.log(chalk.gray('  • netlify - Deploy to Netlify'));
      console.log(chalk.gray('  • railway - Deploy to Railway'));
      console.log(chalk.gray('  • render - Deploy to Render'));
      console.log();
      console.log(formatSubheader('OPTIONS\n'));
      console.log(formatOption('-p, --path <path>', 'Project path'));
      console.log(formatOption('--verbose', 'Enable debug mode'));
      console.log();
    }
  };

  if (details[commandName]) {
    details[commandName]();
  }
}

/**
 * Get related commands
 */
function getRelatedCommands(commandName) {
  const relationships = {
    create: ['generate', 'models:generate', 'graphics:generate', 'preview'],
    generate: ['create', 'test', 'refactor'],
    'models:generate': ['models:detect', 'models:watch', 'models:list', 'db:migrate'],
    'models:detect': ['models:generate', 'models:watch'],
    'models:watch': ['models:generate', 'models:detect'],
    'graphics:generate': ['graphics:detect', 'graphics:watch', 'graphics:type'],
    'graphics:detect': ['graphics:generate', 'graphics:watch'],
    'graphics:watch': ['graphics:generate', 'graphics:detect'],
    deploy: ['build', 'test', 'deploy:status'],
    test: ['build', 'generate'],
    refactor: ['analyze', 'test'],
    analyze: ['refactor', 'test']
  };

  return relationships[commandName] || [];
}

/**
 * Display all commands
 */
function displayAllCommands() {
  console.log(formatHeader('TryForge CLI Commands', '📚'));

  // Group commands by category
  const categories = {};
  Object.entries(commandDescriptions).forEach(([command, info]) => {
    if (!categories[info.category]) {
      categories[info.category] = [];
    }
    categories[info.category].push({ command, ...info });
  });

  // Display by category
  Object.entries(categories).forEach(([category, commands]) => {
    console.log(chalk.white.bold(`\n${category}:\n`));
    commands.forEach(cmd => {
      console.log(chalk.gray('  $'), chalk.cyan(cmd.command.padEnd(20)), chalk.gray(cmd.description));
    });
  });

  console.log();
  console.log(formatTip('Use "tryforge help <command>" for detailed help on a specific command'));
}

/**
 * Display main help
 */
function displayMainHelp() {
  console.log(formatHeader('TryForge - Triple AI Application Framework', '🔥'));
  console.log(chalk.white('Create production-ready applications using Claude + GitHub Spark + Pollinations AI\n'));

  console.log(formatSubheader('QUICK START\n'));
  console.log(formatCommand('tryforge admin                    # Configure API keys'));
  console.log(formatCommand('tryforge create "Blog platform"   # Create app'));
  console.log(formatCommand('tryforge preview                  # Live preview'));
  console.log();

  console.log(formatSubheader('POPULAR COMMANDS\n'));
  console.log(chalk.gray('  $'), chalk.cyan('create [description]'.padEnd(25)), chalk.gray('Create new application'));
  console.log(chalk.gray('  $'), chalk.cyan('generate <type>'.padEnd(25)), chalk.gray('Generate code'));
  console.log(chalk.gray('  $'), chalk.cyan('models:generate'.padEnd(25)), chalk.gray('Auto-generate database models'));
  console.log(chalk.gray('  $'), chalk.cyan('graphics:generate'.padEnd(25)), chalk.gray('Auto-generate graphics'));
  console.log(chalk.gray('  $'), chalk.cyan('preview'.padEnd(25)), chalk.gray('Live preview with hot reload'));
  console.log(chalk.gray('  $'), chalk.cyan('deploy <platform>'.padEnd(25)), chalk.gray('Deploy to production'));
  console.log();

  console.log(formatSubheader('HELP RESOURCES\n'));
  console.log(chalk.gray('  $'), chalk.cyan('tryforge help <command>'.padEnd(25)), chalk.gray('Detailed command help'));
  console.log(chalk.gray('  $'), chalk.cyan('tryforge examples [command]'.padEnd(25)), chalk.gray('View examples'));
  console.log(chalk.gray('  $'), chalk.cyan('tryforge guide <topic>'.padEnd(25)), chalk.gray('Read guides'));
  console.log(chalk.gray('  $'), chalk.cyan('tryforge help --search <term>'.padEnd(25)), chalk.gray('Search help'));
  console.log(chalk.gray('  $'), chalk.cyan('tryforge doctor'.padEnd(25)), chalk.gray('Diagnose issues'));
  console.log();

  console.log(formatSubheader('DOCUMENTATION\n'));
  console.log(chalk.gray('  📚'), formatLink('Full Documentation', 'https://docs.tryforge.dev'));
  console.log(chalk.gray('  💬'), formatLink('GitHub Discussions', 'https://github.com/jedrzej82/tryforge/discussions'));
  console.log(chalk.gray('  🐛'), formatLink('Report Issues', 'https://github.com/jedrzej82/tryforge/issues'));
  console.log();

  console.log(formatBox(
    chalk.cyan('🌟 New to TryForge? Run: tryforge guide getting-started'),
    { type: 'info' }
  ));
}

/**
 * Display doctor/health check
 */
async function displayDoctor() {
  const { execSync } = require('child_process');
  const fs = require('fs');
  const path = require('path');

  console.log(formatHeader('TryForge Health Check', '🔍'));
  console.log(chalk.white('Checking your TryForge installation...\n'));

  const checks = [];

  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
    const versionMatch = nodeVersion.match(/v(\d+)\./);
    const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;

    if (majorVersion >= 18) {
      checks.push({ name: 'Node.js', status: 'pass', value: nodeVersion });
    } else {
      checks.push({ name: 'Node.js', status: 'fail', value: nodeVersion, message: 'Requires v18+' });
    }
  } catch (error) {
    checks.push({ name: 'Node.js', status: 'fail', message: 'Not installed' });
  }

  // Check npm version
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    checks.push({ name: 'npm', status: 'pass', value: npmVersion });
  } catch (error) {
    checks.push({ name: 'npm', status: 'fail', message: 'Not installed' });
  }

  // Check Git
  try {
    const gitVersion = execSync('git --version', { encoding: 'utf-8' }).trim();
    checks.push({ name: 'Git', status: 'pass', value: gitVersion });
  } catch (error) {
    checks.push({ name: 'Git', status: 'warning', message: 'Not installed (optional)' });
  }

  // Check TryForge installation
  try {
    const packageJson = require('../../../package.json');
    checks.push({ name: 'TryForge CLI', status: 'pass', value: `v${packageJson.version}` });
  } catch (error) {
    checks.push({ name: 'TryForge CLI', status: 'fail', message: 'Cannot read version' });
  }

  // Check configuration
  const homeDir = require('os').homedir();
  const configPath = path.join(homeDir, '.tryforge', 'config.json');
  if (fs.existsSync(configPath)) {
    checks.push({ name: 'Configuration', status: 'pass', value: 'Found' });

    // Check API key
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.anthropicApiKey && config.anthropicApiKey.length > 0) {
        checks.push({ name: 'Anthropic API Key', status: 'pass', value: 'Configured' });
      } else {
        checks.push({ name: 'Anthropic API Key', status: 'warning', value: 'Not configured' });
      }
    } catch (error) {
      checks.push({ name: 'Configuration', status: 'warning', message: 'Cannot read config' });
    }
  } else {
    checks.push({ name: 'Configuration', status: 'warning', message: 'Not found' });
  }

  // Display results
  console.log(formatSubheader('System Check:\n'));
  checks.forEach(check => {
    const icon = check.status === 'pass' ? chalk.green('✓') :
                 check.status === 'warning' ? chalk.yellow('⚠') :
                 chalk.red('✗');
    const name = check.name.padEnd(25);
    const value = check.value || check.message || '';
    console.log(`  ${icon} ${chalk.white(name)} ${chalk.gray(value)}`);
  });

  console.log();

  // Summary
  const passed = checks.filter(c => c.status === 'pass').length;
  const total = checks.length;

  if (passed === total) {
    console.log(formatBox(
      chalk.green('✨ All checks passed! TryForge is ready to use.'),
      { type: 'success' }
    ));
  } else {
    console.log(formatBox(
      chalk.yellow(`⚠️  ${passed}/${total} checks passed. Review warnings above.`),
      { type: 'warning' }
    ));
    console.log(chalk.gray('\nRun "tryforge admin" to configure missing settings.'));
  }

  console.log();
}

module.exports = {
  displayMainHelp,
  displayCommandHelp,
  displayAllCommands,
  displayExamples,
  displayAllExamples,
  displayWorkflows,
  displayGuide,
  listGuides,
  displayDoctor,
  search
};
