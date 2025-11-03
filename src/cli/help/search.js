/**
 * TryForge Help Search
 * Search help content, examples, and guides
 */

const chalk = require('chalk');
const { formatHeader, formatListItem, formatBox } = require('./formatter');
const { examples } = require('./examples');
const { guides } = require('./guides');

/**
 * Command descriptions for search
 */
const commandDescriptions = {
  create: {
    description: 'Create a new application from description using AI',
    keywords: ['generate', 'new', 'project', 'app', 'application', 'init', 'scaffold'],
    category: 'Project Creation'
  },
  generate: {
    description: 'AI-powered code generation for components, features, and tests',
    keywords: ['component', 'feature', 'route', 'test', 'code', 'scaffold'],
    category: 'Code Generation'
  },
  'models:generate': {
    description: 'Automatically generate database models from description',
    keywords: ['database', 'schema', 'models', 'orm', 'prisma', 'sequelize', 'auto'],
    category: 'Database'
  },
  'models:detect': {
    description: 'Detect and generate missing models from code',
    keywords: ['scan', 'find', 'missing', 'models', 'database'],
    category: 'Database'
  },
  'models:watch': {
    description: 'Watch and auto-generate missing models',
    keywords: ['monitor', 'watch', 'auto', 'models', 'continuous'],
    category: 'Database'
  },
  'models:list': {
    description: 'List existing models in project',
    keywords: ['show', 'list', 'display', 'models'],
    category: 'Database'
  },
  'models:analyze': {
    description: 'Analyze models and suggest improvements',
    keywords: ['audit', 'review', 'analyze', 'models', 'optimize'],
    category: 'Database'
  },
  'graphics:generate': {
    description: 'Automatically generate professional graphics',
    keywords: ['images', 'logo', 'favicon', 'graphics', 'design', 'visual', 'auto'],
    category: 'Graphics'
  },
  'graphics:detect': {
    description: 'Detect and generate missing graphics from code',
    keywords: ['scan', 'find', 'missing', 'images', 'graphics'],
    category: 'Graphics'
  },
  'graphics:watch': {
    description: 'Watch and auto-generate missing graphics',
    keywords: ['monitor', 'watch', 'auto', 'images', 'continuous'],
    category: 'Graphics'
  },
  'graphics:type': {
    description: 'Generate specific graphic type',
    keywords: ['logo', 'favicon', 'hero', 'og-image', 'specific'],
    category: 'Graphics'
  },
  refactor: {
    description: 'Refactor and improve existing application',
    keywords: ['improve', 'optimize', 'cleanup', 'performance', 'security', 'quality'],
    category: 'Code Quality'
  },
  analyze: {
    description: 'Analyze codebase, performance, security, or UI',
    keywords: ['audit', 'check', 'scan', 'review', 'performance', 'security'],
    category: 'Analysis'
  },
  test: {
    description: 'Run tests (unit, integration, e2e)',
    keywords: ['testing', 'jest', 'playwright', 'unit', 'integration', 'e2e'],
    category: 'Testing'
  },
  build: {
    description: 'Build application for production',
    keywords: ['compile', 'bundle', 'production', 'webpack', 'vite'],
    category: 'Build'
  },
  start: {
    description: 'Start development servers',
    keywords: ['dev', 'serve', 'run', 'development'],
    category: 'Development'
  },
  stop: {
    description: 'Stop all servers',
    keywords: ['kill', 'terminate', 'shutdown'],
    category: 'Development'
  },
  preview: {
    description: 'Start live preview with hot reload',
    keywords: ['preview', 'watch', 'hot reload', 'live', 'development'],
    category: 'Development'
  },
  deploy: {
    description: 'Deploy to cloud platforms',
    keywords: ['deploy', 'publish', 'vercel', 'netlify', 'railway', 'production'],
    category: 'Deployment'
  },
  'deploy:status': {
    description: 'Check deployment status',
    keywords: ['status', 'check', 'deployment', 'verify'],
    category: 'Deployment'
  },
  admin: {
    description: 'Open admin panel for API configuration',
    keywords: ['config', 'settings', 'api key', 'configure', 'setup'],
    category: 'Configuration'
  },
  'db:reset': {
    description: 'Reset database (drop, migrate, seed)',
    keywords: ['database', 'reset', 'drop', 'fresh', 'clean'],
    category: 'Database'
  },
  'db:migrate': {
    description: 'Run database migrations',
    keywords: ['database', 'migration', 'schema', 'update'],
    category: 'Database'
  },
  'db:seed': {
    description: 'Seed database with sample data',
    keywords: ['database', 'seed', 'data', 'sample', 'fixtures'],
    category: 'Database'
  },
  status: {
    description: 'Show system and project status',
    keywords: ['info', 'status', 'health', 'check'],
    category: 'Information'
  }
};

/**
 * Troubleshooting solutions database
 */
const troubleshootingSolutions = {
  'module not found': {
    problem: 'Module or package not found',
    solutions: [
      'Run npm install to install dependencies',
      'Check if package is listed in package.json',
      'Clear node_modules and reinstall: rm -rf node_modules && npm install',
      'Verify the import path is correct'
    ],
    commands: ['npm install', 'rm -rf node_modules && npm install']
  },
  'permission denied': {
    problem: 'Permission denied when installing or running',
    solutions: [
      'Use sudo for global installations',
      'Fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally',
      'Use npx instead of global install'
    ],
    commands: ['sudo npm install -g tryforge', 'npx tryforge']
  },
  'api key': {
    problem: 'API key invalid or missing',
    solutions: [
      'Get API key from https://console.anthropic.com',
      'Configure with: tryforge admin',
      'Set ANTHROPIC_API_KEY in .env file',
      'Verify key is correct and has no extra spaces'
    ],
    commands: ['tryforge admin']
  },
  'port in use': {
    problem: 'Port already in use',
    solutions: [
      'Kill process using the port',
      'Change port in configuration',
      'Stop other development servers'
    ],
    commands: ['lsof -ti:3000 | xargs kill', 'lsof -ti:3001 | xargs kill']
  },
  'database connection': {
    problem: 'Cannot connect to database',
    solutions: [
      'Ensure database server is running',
      'Check connection string in .env',
      'Verify database credentials',
      'Check firewall settings'
    ],
    commands: ['tryforge db:migrate', 'tryforge admin']
  },
  'build failed': {
    problem: 'Build or compilation failed',
    solutions: [
      'Check for syntax errors',
      'Run linter: npm run lint',
      'Clear cache and rebuild',
      'Check for missing dependencies'
    ],
    commands: ['npm run lint:fix', 'rm -rf .next && npm run build', 'npm install']
  },
  'test failed': {
    problem: 'Tests failing',
    solutions: [
      'Read test error messages carefully',
      'Update snapshots if needed',
      'Check test environment configuration',
      'Ensure test database is set up'
    ],
    commands: ['npm test -- -u', 'tryforge test --verbose']
  },
  'deployment failed': {
    problem: 'Deployment to platform failed',
    solutions: [
      'Check deployment logs',
      'Verify environment variables are set',
      'Ensure build succeeds locally first',
      'Check platform-specific requirements'
    ],
    commands: ['tryforge build', 'tryforge deploy:status vercel']
  }
};

/**
 * Calculate relevance score for search results
 */
function calculateRelevance(searchTerm, text, keywords = []) {
  const term = searchTerm.toLowerCase();
  const content = text.toLowerCase();

  let score = 0;

  // Exact match in text
  if (content === term) score += 100;

  // Starts with search term
  if (content.startsWith(term)) score += 50;

  // Contains search term
  if (content.includes(term)) score += 25;

  // Keyword matches
  keywords.forEach(keyword => {
    if (keyword.toLowerCase().includes(term)) score += 10;
    if (term.includes(keyword.toLowerCase())) score += 5;
  });

  return score;
}

/**
 * Search commands
 */
function searchCommands(searchTerm) {
  const results = [];

  Object.entries(commandDescriptions).forEach(([command, info]) => {
    const score = calculateRelevance(
      searchTerm,
      `${command} ${info.description}`,
      info.keywords
    );

    if (score > 0) {
      results.push({ command, ...info, score });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Search examples
 */
function searchExamples(searchTerm) {
  const results = [];

  Object.entries(examples).forEach(([command, cmdExamples]) => {
    cmdExamples.forEach(example => {
      const searchableText = `${example.title} ${example.description} ${example.command} ${example.explanation}`;
      const score = calculateRelevance(searchTerm, searchableText);

      if (score > 0) {
        results.push({ command, ...example, score });
      }
    });
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Search guides
 */
function searchGuides(searchTerm) {
  const results = [];

  Object.entries(guides).forEach(([name, guide]) => {
    const score = calculateRelevance(searchTerm, `${name} ${guide.title}`);

    if (score > 0) {
      results.push({ name, ...guide, score });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Search troubleshooting solutions
 */
function searchTroubleshooting(searchTerm) {
  const results = [];

  Object.entries(troubleshootingSolutions).forEach(([keyword, solution]) => {
    const searchableText = `${keyword} ${solution.problem} ${solution.solutions.join(' ')}`;
    const score = calculateRelevance(searchTerm, searchableText);

    if (score > 0) {
      results.push({ keyword, ...solution, score });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Fuzzy search for commands (typo tolerance)
 */
function fuzzySearchCommands(searchTerm) {
  const commands = Object.keys(commandDescriptions);
  const results = [];

  commands.forEach(command => {
    const distance = levenshteinDistance(searchTerm.toLowerCase(), command.toLowerCase());
    const maxLength = Math.max(searchTerm.length, command.length);
    const similarity = 1 - (distance / maxLength);

    if (similarity > 0.5) {
      results.push({ command, similarity, ...commandDescriptions[command] });
    }
  });

  return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Main search function
 */
function search(searchTerm, options = {}) {
  const { limit = 10, includeExamples = true, includeGuides = true, includeTroubleshooting = true } = options;

  console.log(formatHeader(`Search Results for "${searchTerm}"`, '🔍'));

  // Search commands
  const commandResults = searchCommands(searchTerm);
  if (commandResults.length > 0) {
    console.log(chalk.white.bold('\nCommands:\n'));
    commandResults.slice(0, limit).forEach((result, index) => {
      console.log(formatListItem(
        index + 1,
        chalk.cyan(result.command),
        result.description
      ));
      console.log(chalk.gray(`   Category: ${result.category}`));
      console.log(chalk.gray(`   Usage: tryforge ${result.command} --help\n`));
    });
  }

  // Search examples
  if (includeExamples) {
    const exampleResults = searchExamples(searchTerm);
    if (exampleResults.length > 0) {
      console.log(chalk.white.bold('\nExamples:\n'));
      exampleResults.slice(0, limit).forEach((result, index) => {
        console.log(formatListItem(
          index + 1,
          result.title
        ));
        console.log(chalk.gray(`   Command: ${result.command}`));
        console.log(chalk.gray(`   View: tryforge examples ${result.command}\n`));
      });
    }
  }

  // Search guides
  if (includeGuides) {
    const guideResults = searchGuides(searchTerm);
    if (guideResults.length > 0) {
      console.log(chalk.white.bold('\nGuides:\n'));
      guideResults.slice(0, limit).forEach((result, index) => {
        console.log(formatListItem(
          index + 1,
          result.title
        ));
        console.log(chalk.gray(`   Read: tryforge guide ${result.name}\n`));
      });
    }
  }

  // Search troubleshooting
  if (includeTroubleshooting) {
    const troubleshootingResults = searchTroubleshooting(searchTerm);
    if (troubleshootingResults.length > 0) {
      console.log(chalk.white.bold('\nTroubleshooting:\n'));
      troubleshootingResults.slice(0, 3).forEach((result, index) => {
        console.log(formatListItem(
          index + 1,
          result.problem
        ));
        console.log(chalk.white('   Solutions:'));
        result.solutions.forEach(solution => {
          console.log(chalk.gray(`   • ${solution}`));
        });
        if (result.commands.length > 0) {
          console.log(chalk.white('   Commands:'));
          result.commands.forEach(cmd => {
            console.log(chalk.gray(`   $ ${cmd}`));
          });
        }
        console.log();
      });
    }
  }

  // No results
  const totalResults = commandResults.length +
    (includeExamples ? searchExamples(searchTerm).length : 0) +
    (includeGuides ? searchGuides(searchTerm).length : 0) +
    (includeTroubleshooting ? searchTroubleshooting(searchTerm).length : 0);

  if (totalResults === 0) {
    console.log(chalk.yellow('\nNo results found.\n'));

    // Try fuzzy search
    const fuzzyResults = fuzzySearchCommands(searchTerm);
    if (fuzzyResults.length > 0) {
      console.log(chalk.white('Did you mean:\n'));
      fuzzyResults.slice(0, 3).forEach((result, index) => {
        console.log(formatListItem(index + 1, result.command, result.description));
      });
      console.log();
    }

    console.log(chalk.gray('Try:'));
    console.log(chalk.gray('  • Different keywords'));
    console.log(chalk.gray('  • Broader search terms'));
    console.log(chalk.gray('  • tryforge --help for all commands'));
    console.log(chalk.gray('  • tryforge guide --list for all guides\n'));
  }
}

/**
 * Get troubleshooting solution
 */
function getTroubleshootingSolution(keyword) {
  return troubleshootingSolutions[keyword];
}

module.exports = {
  search,
  searchCommands,
  searchExamples,
  searchGuides,
  searchTroubleshooting,
  fuzzySearchCommands,
  getTroubleshootingSolution,
  commandDescriptions,
  troubleshootingSolutions
};
