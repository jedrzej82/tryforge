/**
 * TryForge CLI Examples
 * Real-world examples for each command
 */

const chalk = require('chalk');
const { formatHeader, formatExample, formatListItem, formatTip } = require('./formatter');

/**
 * Command examples database
 */
const examples = {
  create: [
    {
      title: '1. Create a React blog with authentication (beginner-friendly)',
      description: 'Interactive wizard guides you through setup',
      command: 'tryforge create "A personal blog with user authentication" --framework react --auth jwt --database postgresql',
      explanation: 'Creates a complete React blog with:\n     ✓ User authentication (JWT)\n     ✓ PostgreSQL database\n     ✓ Ready-to-use blog components\n     ✓ Admin dashboard'
    },
    {
      title: '2. Create an e-commerce store',
      description: 'Full-featured online store',
      command: 'tryforge create "E-commerce store for handmade crafts" --framework nextjs --database mongodb --auth oauth --features "cart,checkout,payments"',
      explanation: 'Generates:\n     ✓ Product catalog\n     ✓ Shopping cart\n     ✓ Checkout process\n     ✓ Payment integration\n     ✓ OAuth authentication'
    },
    {
      title: '3. Create a Vue.js dashboard',
      description: 'Analytics dashboard with charts',
      command: 'tryforge create "Analytics dashboard" --framework vue --styling tailwind --database postgresql',
      explanation: 'Creates:\n     ✓ Vue 3 with Composition API\n     ✓ Tailwind CSS styling\n     ✓ Chart components\n     ✓ Data visualization'
    },
    {
      title: '4. Create an Express API',
      description: 'REST API backend',
      command: 'tryforge create "REST API for mobile app" --template api --framework express --database mysql --auth jwt',
      explanation: 'Generates:\n     ✓ Express.js server\n     ✓ RESTful endpoints\n     ✓ JWT authentication\n     ✓ MySQL integration\n     ✓ API documentation'
    }
  ],

  generate: [
    {
      title: '1. Generate a React component',
      description: 'Create a new component with props and state',
      command: 'tryforge generate component "UserProfile with avatar, name, bio, and social links"',
      explanation: 'Generates:\n     ✓ Component file\n     ✓ PropTypes/TypeScript types\n     ✓ Styling (CSS/SCSS)\n     ✓ Test file'
    },
    {
      title: '2. Generate a complete feature',
      description: 'Full feature with components, routes, and state',
      command: 'tryforge generate feature "Shopping cart with add, remove, and checkout"',
      explanation: 'Creates:\n     ✓ Multiple components\n     ✓ State management\n     ✓ API integration\n     ✓ Routes\n     ✓ Tests'
    },
    {
      title: '3. Generate API routes',
      description: 'RESTful API endpoints',
      command: 'tryforge generate route "CRUD operations for products"',
      explanation: 'Generates:\n     ✓ GET, POST, PUT, DELETE routes\n     ✓ Controllers\n     ✓ Validation\n     ✓ Error handling'
    },
    {
      title: '4. Generate tests',
      description: 'Test files for existing code',
      command: 'tryforge generate test --file src/components/Button.jsx',
      explanation: 'Creates:\n     ✓ Unit tests\n     ✓ Integration tests\n     ✓ Test utilities\n     ✓ Mocks'
    }
  ],

  'models:generate': [
    {
      title: '1. Auto-generate models from description',
      description: 'Let AI create database models',
      command: 'tryforge models:generate -d "E-commerce platform with users, products, orders, and reviews"',
      explanation: 'Automatically creates:\n     ✓ User model with auth fields\n     ✓ Product model with variants\n     ✓ Order model with items\n     ✓ Review model with ratings\n     ✓ Relationships between models\n     ✓ Database migrations'
    },
    {
      title: '2. Generate models in interactive mode',
      description: 'Review and confirm each model',
      command: 'tryforge models:generate --interactive -d "Blog platform"',
      explanation: 'Interactive workflow:\n     1. AI suggests models\n     2. Review each model\n     3. Approve or modify\n     4. Generate migrations\n     5. Apply to database'
    },
    {
      title: '3. Detect missing models from code',
      description: 'Scan code for undefined models',
      command: 'tryforge models:detect --orm prisma',
      explanation: 'Scans your code for:\n     ✓ Database queries\n     ✓ Missing models\n     ✓ Undefined relationships\n     ✓ Generates missing models'
    },
    {
      title: '4. Watch and auto-generate models',
      description: 'Continuously monitor and generate',
      command: 'tryforge models:watch',
      explanation: 'Watches for:\n     ✓ New database queries\n     ✓ Missing models\n     ✓ Auto-generates on detection\n     ✓ Updates schema files'
    }
  ],

  'graphics:generate': [
    {
      title: '1. Generate complete graphics set',
      description: 'Logo, favicon, hero images, etc.',
      command: 'tryforge graphics:generate -n "TechStartup" --style modern --colors "blue and white"',
      explanation: 'Generates:\n     ✓ Logo (SVG, PNG)\n     ✓ Favicon (multiple sizes)\n     ✓ Hero images\n     ✓ Social media images (OG)\n     ✓ App icons\n     ✓ Optimized for web'
    },
    {
      title: '2. Generate specific graphic type',
      description: 'Create just a logo',
      command: 'tryforge graphics:type logo -n "MyBrand" --style minimalist',
      explanation: 'Creates:\n     ✓ SVG version\n     ✓ PNG (multiple sizes)\n     ✓ Transparent background\n     ✓ Color variations'
    },
    {
      title: '3. Detect and generate missing graphics',
      description: 'Scan code for missing images',
      command: 'tryforge graphics:detect -p ./my-app',
      explanation: 'Scans for:\n     ✓ Image references in code\n     ✓ Missing image files\n     ✓ Broken links\n     ✓ Generates missing images'
    },
    {
      title: '4. Watch and auto-generate graphics',
      description: 'Automatically create images as needed',
      command: 'tryforge graphics:watch',
      explanation: 'Monitors:\n     ✓ New image references\n     ✓ Missing files\n     ✓ Auto-generates images\n     ✓ Optimizes on creation'
    }
  ],

  refactor: [
    {
      title: '1. Refactor UI components',
      description: 'Improve component structure',
      command: 'tryforge refactor "Improve component organization" --scope ui',
      explanation: 'Improvements:\n     ✓ Component splitting\n     ✓ Props optimization\n     ✓ State management\n     ✓ Styling consistency'
    },
    {
      title: '2. Performance optimization',
      description: 'Optimize app performance',
      command: 'tryforge refactor --scope performance',
      explanation: 'Optimizes:\n     ✓ Code splitting\n     ✓ Lazy loading\n     ✓ Bundle size\n     ✓ Render performance'
    },
    {
      title: '3. Security improvements',
      description: 'Fix security vulnerabilities',
      command: 'tryforge refactor --scope security',
      explanation: 'Addresses:\n     ✓ XSS vulnerabilities\n     ✓ CSRF protection\n     ✓ Input validation\n     ✓ Authentication issues'
    }
  ],

  analyze: [
    {
      title: '1. Analyze entire codebase',
      description: 'Comprehensive code analysis',
      command: 'tryforge analyze codebase',
      explanation: 'Analyzes:\n     ✓ Code quality\n     ✓ Architecture\n     ✓ Dependencies\n     ✓ Best practices'
    },
    {
      title: '2. Performance analysis',
      description: 'Find performance bottlenecks',
      command: 'tryforge analyze performance --output json',
      explanation: 'Checks:\n     ✓ Bundle size\n     ✓ Load times\n     ✓ Render performance\n     ✓ Memory usage'
    },
    {
      title: '3. Security audit',
      description: 'Security vulnerability scan',
      command: 'tryforge analyze security',
      explanation: 'Scans for:\n     ✓ Vulnerabilities\n     ✓ Outdated dependencies\n     ✓ Security best practices\n     ✓ Common threats'
    }
  ],

  deploy: [
    {
      title: '1. Deploy to Vercel',
      description: 'One-click deployment',
      command: 'tryforge deploy vercel',
      explanation: 'Automatically:\n     ✓ Configures project\n     ✓ Sets environment variables\n     ✓ Deploys to production\n     ✓ Provides preview URL'
    },
    {
      title: '2. Deploy to Netlify',
      description: 'Deploy with continuous deployment',
      command: 'tryforge deploy netlify --path ./my-app',
      explanation: 'Sets up:\n     ✓ Build configuration\n     ✓ Environment variables\n     ✓ Custom domain\n     ✓ SSL certificate'
    },
    {
      title: '3. Check deployment status',
      description: 'Monitor deployment',
      command: 'tryforge deploy:status vercel',
      explanation: 'Shows:\n     ✓ Deployment status\n     ✓ Build logs\n     ✓ URLs\n     ✓ Errors (if any)'
    }
  ],

  test: [
    {
      title: '1. Run all tests',
      description: 'Complete test suite',
      command: 'tryforge test all',
      explanation: 'Runs:\n     ✓ Unit tests\n     ✓ Integration tests\n     ✓ E2E tests\n     ✓ Generates coverage report'
    },
    {
      title: '2. Run tests in watch mode',
      description: 'Continuous testing',
      command: 'tryforge test --watch',
      explanation: 'Watches:\n     ✓ File changes\n     ✓ Re-runs tests\n     ✓ Shows results\n     ✓ Fast feedback loop'
    }
  ],

  preview: [
    {
      title: '1. Start live preview',
      description: 'Preview with hot reload',
      command: 'tryforge preview',
      explanation: 'Features:\n     ✓ Hot module reload\n     ✓ Auto-refresh\n     ✓ Error overlay\n     ✓ DevTools integration'
    }
  ],

  admin: [
    {
      title: '1. Configure API keys',
      description: 'Set up API credentials',
      command: 'tryforge admin',
      explanation: 'Opens admin panel to:\n     ✓ Configure Claude API key\n     ✓ Set GitHub token\n     ✓ Configure Pollinations AI\n     ✓ Test connections'
    }
  ]
};

/**
 * Get examples for a specific command
 */
function getExamples(command) {
  return examples[command] || [];
}

/**
 * Display examples for a command
 */
function displayExamples(command) {
  const cmdExamples = getExamples(command);

  if (cmdExamples.length === 0) {
    console.log(chalk.yellow(`\nNo examples available for '${command}' yet.\n`));
    console.log(chalk.gray('Contribute examples at: https://github.com/jedrzej82/tryforge\n'));
    return;
  }

  console.log(formatHeader(`Examples for '${command}'`, '📚'));

  cmdExamples.forEach((example, index) => {
    console.log(formatListItem(index + 1, example.title));
    if (example.description) {
      console.log(chalk.gray(`   ${example.description}`));
    }
    console.log();
    console.log(chalk.gray('   $'), chalk.white(example.command));
    if (example.explanation) {
      console.log();
      console.log(chalk.gray(example.explanation.split('\n').map(line => `   ${line}`).join('\n')));
    }
    console.log();
  });

  console.log(formatTip('Use --verbose flag for detailed output'));
}

/**
 * Display all examples
 */
function displayAllExamples() {
  console.log(formatHeader('TryForge CLI Examples', '📚'));
  console.log(chalk.white('Real-world examples for all commands\n'));

  const commands = Object.keys(examples);

  commands.forEach((command, index) => {
    console.log(chalk.cyan.bold(`${index + 1}. ${command}`));
    console.log(chalk.gray(`   ${examples[command].length} examples available`));
    console.log(chalk.gray(`   View: tryforge examples ${command}\n`));
  });

  console.log(formatTip('Run "tryforge examples <command>" to see specific examples'));
}

/**
 * Get common workflows
 */
function getCommonWorkflows() {
  return [
    {
      name: 'Full-stack app from scratch',
      steps: [
        'tryforge create "Blog platform with auth" --framework react --database postgresql',
        'cd my-blog',
        'tryforge models:generate -d "Blog with posts, comments, users"',
        'tryforge graphics:generate -n "MyBlog" --style modern',
        'tryforge preview',
        'tryforge test all',
        'tryforge deploy vercel'
      ]
    },
    {
      name: 'Add new feature to existing app',
      steps: [
        'tryforge generate feature "User profile with avatar upload"',
        'tryforge models:detect',
        'tryforge graphics:detect',
        'tryforge test --watch',
        'tryforge analyze performance'
      ]
    },
    {
      name: 'Refactor and optimize',
      steps: [
        'tryforge analyze codebase',
        'tryforge refactor --scope performance',
        'tryforge test all',
        'tryforge analyze performance',
        'git commit -m "Optimized performance"'
      ]
    }
  ];
}

/**
 * Display common workflows
 */
function displayWorkflows() {
  console.log(formatHeader('Common Workflows', '🔄'));

  const workflows = getCommonWorkflows();

  workflows.forEach((workflow, index) => {
    console.log(formatListItem(index + 1, workflow.name));
    console.log();
    workflow.steps.forEach((step, stepIndex) => {
      console.log(chalk.gray(`   ${stepIndex + 1}.`), chalk.white(step));
    });
    console.log();
  });
}

/**
 * Search examples by keyword
 */
function searchExamples(keyword) {
  const results = [];
  const searchTerm = keyword.toLowerCase();

  Object.entries(examples).forEach(([command, cmdExamples]) => {
    cmdExamples.forEach(example => {
      const searchableText = `${example.title} ${example.description} ${example.command} ${example.explanation}`.toLowerCase();
      if (searchableText.includes(searchTerm)) {
        results.push({ command, ...example });
      }
    });
  });

  if (results.length === 0) {
    console.log(chalk.yellow(`\nNo examples found for '${keyword}'\n`));
    return;
  }

  console.log(formatHeader(`Examples matching '${keyword}'`, '🔍'));
  console.log(chalk.gray(`Found ${results.length} example(s)\n`));

  results.forEach((result, index) => {
    console.log(chalk.cyan.bold(`${index + 1}. ${result.command} - ${result.title}`));
    console.log(chalk.gray('   $'), chalk.white(result.command));
    console.log();
  });
}

module.exports = {
  examples,
  getExamples,
  displayExamples,
  displayAllExamples,
  displayWorkflows,
  searchExamples,
  getCommonWorkflows
};
