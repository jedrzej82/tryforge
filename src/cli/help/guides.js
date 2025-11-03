/**
 * TryForge CLI Guides
 * Comprehensive guides for various topics
 */

const chalk = require('chalk');
const {
  formatHeader,
  formatSubheader,
  formatCommand,
  formatSteps,
  formatTip,
  formatBox,
  formatDivider,
  formatListItem
} = require('./formatter');

/**
 * Guides database
 */
const guides = {
  'getting-started': {
    title: 'Getting Started with TryForge',
    emoji: '🚀',
    content: () => {
      console.log(formatHeader('Getting Started with TryForge', '🚀'));
      console.log(chalk.white('TryForge is a Triple AI Application Framework that helps you'));
      console.log(chalk.white('generate production-ready applications using Claude, GitHub Spark,'));
      console.log(chalk.white('and Pollinations AI.\n'));

      console.log(formatSubheader('Prerequisites'));
      console.log(chalk.gray('  • Node.js 18.0.0 or higher'));
      console.log(chalk.gray('  • npm 9.0.0 or higher'));
      console.log(chalk.gray('  • Git (recommended)'));
      console.log(chalk.gray('  • Claude API key (get from https://console.anthropic.com)\n'));

      console.log(formatSubheader('Quick Start (5 minutes)\n'));
      const steps = [
        'Install TryForge globally:\n   npm install -g tryforge',
        'Configure your API keys:\n   tryforge admin',
        'Create your first app:\n   tryforge create "A personal blog" --framework react',
        'Navigate to your project:\n   cd my-blog',
        'Start development server:\n   tryforge preview',
        'Open http://localhost:3000 in your browser'
      ];
      console.log(formatSteps(steps));
      console.log();

      console.log(formatSubheader('What gets created?\n'));
      console.log(chalk.white('TryForge generates a complete, production-ready application:'));
      console.log(chalk.gray('  ✓ Frontend with your chosen framework'));
      console.log(chalk.gray('  ✓ Backend API with database integration'));
      console.log(chalk.gray('  ✓ Authentication system'));
      console.log(chalk.gray('  ✓ Professional graphics and UI'));
      console.log(chalk.gray('  ✓ Tests and documentation'));
      console.log(chalk.gray('  ✓ Deployment configuration\n'));

      console.log(formatSubheader('Next Steps\n'));
      console.log(chalk.cyan('  →'), chalk.white('Read the project setup guide:'), chalk.gray('tryforge guide project-setup'));
      console.log(chalk.cyan('  →'), chalk.white('Explore examples:'), chalk.gray('tryforge examples'));
      console.log(chalk.cyan('  →'), chalk.white('Learn about templates:'), chalk.gray('tryforge guide templates'));
      console.log(chalk.cyan('  →'), chalk.white('View all guides:'), chalk.gray('tryforge guide --list\n'));

      console.log(formatTip('Run "tryforge --help" to see all available commands'));
    }
  },

  'project-setup': {
    title: 'Project Setup Guide',
    emoji: '⚙️',
    content: () => {
      console.log(formatHeader('Project Setup Guide', '⚙️'));
      console.log(chalk.white('Learn how to set up a new TryForge project\n'));

      console.log(formatSubheader('1. Create a New Project\n'));
      console.log(chalk.white('You can create a project in several ways:\n'));

      console.log(chalk.cyan('Method A: Natural Language Description'));
      console.log(formatCommand('tryforge create "E-commerce store for handmade items"'));
      console.log(chalk.gray('   AI will interpret your description and create the appropriate app\n'));

      console.log(chalk.cyan('Method B: Explicit Options'));
      console.log(formatCommand('tryforge create --framework react --database postgresql --auth jwt'));
      console.log(chalk.gray('   Specify exactly what you want\n'));

      console.log(chalk.cyan('Method C: Interactive Mode (Recommended for Beginners)'));
      console.log(formatCommand('tryforge create --interactive'));
      console.log(chalk.gray('   Step-by-step wizard guides you through choices\n'));

      console.log(formatSubheader('2. Project Structure\n'));
      console.log(chalk.white('TryForge creates a well-organized project:\n'));
      console.log(chalk.gray('  my-app/'));
      console.log(chalk.gray('  ├── src/                  # Source code'));
      console.log(chalk.gray('  │   ├── components/       # React components'));
      console.log(chalk.gray('  │   ├── pages/           # Page components'));
      console.log(chalk.gray('  │   ├── api/             # API routes'));
      console.log(chalk.gray('  │   └── utils/           # Utilities'));
      console.log(chalk.gray('  ├── public/              # Static assets'));
      console.log(chalk.gray('  ├── tests/               # Test files'));
      console.log(chalk.gray('  ├── database/            # Database config'));
      console.log(chalk.gray('  └── package.json         # Dependencies\n'));

      console.log(formatSubheader('3. Configuration\n'));
      console.log(chalk.white('Configure your project settings:\n'));
      console.log(formatCommand('tryforge admin'));
      console.log(chalk.gray('   Opens admin panel for:\n'));
      console.log(chalk.gray('   • API keys configuration\n'));
      console.log(chalk.gray('   • Database settings\n'));
      console.log(chalk.gray('   • Environment variables\n'));
      console.log(chalk.gray('   • Deployment options\n'));

      console.log(formatSubheader('4. Development Workflow\n'));
      const workflow = [
        'Start development server:\n   tryforge preview',
        'Make changes to your code\n   (Changes auto-reload in browser)',
        'Generate new components:\n   tryforge generate component "Header"',
        'Run tests:\n   tryforge test --watch',
        'Analyze code quality:\n   tryforge analyze codebase'
      ];
      console.log(formatSteps(workflow));
      console.log();

      console.log(formatTip('Use "tryforge guide deployment" to learn about deploying your app'));
    }
  },

  'templates': {
    title: 'Template Guide',
    emoji: '📋',
    content: () => {
      console.log(formatHeader('Template Guide', '📋'));
      console.log(chalk.white('Understanding TryForge templates\n'));

      console.log(formatSubheader('Available Templates\n'));
      console.log(formatListItem(1, 'React + TypeScript', 'Modern React with hooks and TypeScript'));
      console.log(formatListItem(2, 'Next.js 14', 'Full-stack React with App Router'));
      console.log(formatListItem(3, 'Vue 3', 'Vue.js with Composition API'));
      console.log(formatListItem(4, 'Express API', 'Node.js REST API'));
      console.log(formatListItem(5, 'Svelte', 'Lightweight Svelte app'));
      console.log();

      console.log(formatSubheader('Template Features\n'));
      console.log(chalk.white('Each template includes:\n'));
      console.log(chalk.gray('  ✓ Modern framework setup'));
      console.log(chalk.gray('  ✓ TypeScript support'));
      console.log(chalk.gray('  ✓ ESLint + Prettier'));
      console.log(chalk.gray('  ✓ Testing framework'));
      console.log(chalk.gray('  ✓ CI/CD configuration'));
      console.log(chalk.gray('  ✓ Docker support\n'));

      console.log(formatSubheader('Customization Levels\n'));
      console.log(chalk.cyan('Minimal:'), chalk.gray('Basic setup, minimal dependencies'));
      console.log(chalk.cyan('Standard:'), chalk.gray('Recommended setup with common features'));
      console.log(chalk.cyan('Full:'), chalk.gray('Everything included, ready for production\n'));

      console.log(formatSubheader('Example Usage\n'));
      console.log(formatCommand('tryforge create --template nextjs-14 --name my-app'));
      console.log();

      console.log(formatTip('Templates are continuously updated with best practices'));
    }
  },

  'database': {
    title: 'Database Setup Guide',
    emoji: '🗄️',
    content: () => {
      console.log(formatHeader('Database Setup Guide', '🗄️'));
      console.log(chalk.white('Setting up and managing databases\n'));

      console.log(formatSubheader('Supported Databases\n'));
      console.log(formatListItem(1, 'PostgreSQL', 'Recommended for production apps'));
      console.log(formatListItem(2, 'MySQL', 'Popular relational database'));
      console.log(formatListItem(3, 'MongoDB', 'NoSQL document database'));
      console.log(formatListItem(4, 'SQLite', 'Lightweight, file-based database'));
      console.log();

      console.log(formatSubheader('Initial Setup\n'));
      const setupSteps = [
        'Choose database during project creation:\n   tryforge create --database postgresql',
        'Configure connection in .env file:\n   DATABASE_URL=postgresql://user:pass@localhost:5432/mydb',
        'Run migrations:\n   tryforge db:migrate',
        'Seed with sample data:\n   tryforge db:seed'
      ];
      console.log(formatSteps(setupSteps));
      console.log();

      console.log(formatSubheader('Auto-Generate Models\n'));
      console.log(chalk.white('TryForge can automatically create database models:\n'));
      console.log(formatCommand('tryforge models:generate -d "Blog with posts and comments"'));
      console.log(chalk.gray('   AI analyzes your description and creates:'));
      console.log(chalk.gray('   • Database models'));
      console.log(chalk.gray('   • Relationships'));
      console.log(chalk.gray('   • Migrations'));
      console.log(chalk.gray('   • Validation rules\n'));

      console.log(formatSubheader('Common Operations\n'));
      console.log(formatCommand('tryforge db:reset       # Drop, migrate, and seed'));
      console.log(formatCommand('tryforge db:migrate     # Run migrations'));
      console.log(formatCommand('tryforge db:seed        # Seed data'));
      console.log();

      console.log(formatTip('Use models:watch to auto-generate models as you code'));
    }
  },

  'deployment': {
    title: 'Deployment Guide',
    emoji: '🚀',
    content: () => {
      console.log(formatHeader('Deployment Guide', '🚀'));
      console.log(chalk.white('Deploy your app to production\n'));

      console.log(formatSubheader('Supported Platforms\n'));
      console.log(formatListItem(1, 'Vercel', 'Recommended for Next.js and React'));
      console.log(formatListItem(2, 'Netlify', 'Great for static sites'));
      console.log(formatListItem(3, 'Railway', 'Full-stack apps with databases'));
      console.log(formatListItem(4, 'Render', 'Easy deployment for any app'));
      console.log();

      console.log(formatSubheader('Deploy to Vercel\n'));
      const vercelSteps = [
        'Ensure code is committed to git',
        'Run deployment command:\n   tryforge deploy vercel',
        'Follow the prompts to configure',
        'Get your production URL'
      ];
      console.log(formatSteps(vercelSteps));
      console.log();

      console.log(formatSubheader('Pre-Deployment Checklist\n'));
      console.log(chalk.gray('  ☐ All tests passing'));
      console.log(chalk.gray('  ☐ Environment variables configured'));
      console.log(chalk.gray('  ☐ Database migrations ready'));
      console.log(chalk.gray('  ☐ Build succeeds locally'));
      console.log(chalk.gray('  ☐ Security audit passed\n'));

      console.log(formatSubheader('Deployment Commands\n'));
      console.log(formatCommand('tryforge deploy vercel          # Deploy to Vercel'));
      console.log(formatCommand('tryforge deploy:status vercel   # Check status'));
      console.log();

      console.log(formatBox(
        chalk.yellow('Remember to set environment variables in your platform\'s dashboard'),
        { type: 'warning' }
      ));
    }
  },

  'troubleshooting': {
    title: 'Troubleshooting Guide',
    emoji: '🔧',
    content: () => {
      console.log(formatHeader('Troubleshooting Guide', '🔧'));
      console.log(chalk.white('Common issues and solutions\n'));

      console.log(formatSubheader('1. Installation Issues\n'));
      console.log(chalk.red('✗'), chalk.white('Error: Module not found'));
      console.log(chalk.gray('   Solution:'));
      console.log(formatCommand('npm install'));
      console.log(chalk.gray('   or'));
      console.log(formatCommand('rm -rf node_modules && npm install'));
      console.log();

      console.log(chalk.red('✗'), chalk.white('Error: Permission denied'));
      console.log(chalk.gray('   Solution: Use sudo or fix npm permissions'));
      console.log(formatCommand('sudo npm install -g tryforge'));
      console.log();

      console.log(formatSubheader('2. API Key Issues\n'));
      console.log(chalk.red('✗'), chalk.white('Error: Invalid API key'));
      console.log(chalk.gray('   Solution:'));
      console.log(chalk.gray('   1. Get API key from https://console.anthropic.com'));
      console.log(chalk.gray('   2. Configure with: tryforge admin'));
      console.log(chalk.gray('   3. Ensure key is set in environment\n'));

      console.log(formatSubheader('3. Database Issues\n'));
      console.log(chalk.red('✗'), chalk.white('Error: Connection refused'));
      console.log(chalk.gray('   Solution:'));
      console.log(chalk.gray('   1. Ensure database is running'));
      console.log(chalk.gray('   2. Check connection string in .env'));
      console.log(chalk.gray('   3. Verify credentials\n'));

      console.log(formatSubheader('4. Build Issues\n'));
      console.log(chalk.red('✗'), chalk.white('Error: Build failed'));
      console.log(chalk.gray('   Solution:'));
      console.log(formatCommand('tryforge analyze codebase    # Identify issues'));
      console.log(formatCommand('npm run lint:fix            # Fix linting'));
      console.log(formatCommand('npm test                    # Run tests'));
      console.log();

      console.log(formatSubheader('5. Port Already in Use\n'));
      console.log(chalk.red('✗'), chalk.white('Error: Port 3000 already in use'));
      console.log(chalk.gray('   Solution:'));
      console.log(formatCommand('lsof -ti:3000 | xargs kill   # Kill process on port'));
      console.log(chalk.gray('   or configure different port in settings\n'));

      console.log(formatSubheader('Get More Help\n'));
      console.log(chalk.cyan('  →'), 'Run diagnostic:', chalk.gray('tryforge doctor'));
      console.log(chalk.cyan('  →'), 'View logs:', chalk.gray('Check .tryforge/logs/'));
      console.log(chalk.cyan('  →'), 'GitHub Issues:', chalk.gray('https://github.com/jedrzej82/tryforge/issues'));
      console.log(chalk.cyan('  →'), 'Discussions:', chalk.gray('https://github.com/jedrzej82/tryforge/discussions\n'));
    }
  },

  'best-practices': {
    title: 'Best Practices',
    emoji: '✨',
    content: () => {
      console.log(formatHeader('Best Practices', '✨'));
      console.log(chalk.white('Recommendations for using TryForge effectively\n'));

      console.log(formatSubheader('1. Project Organization\n'));
      console.log(chalk.gray('  ✓ Keep components small and focused'));
      console.log(chalk.gray('  ✓ Use meaningful file and folder names'));
      console.log(chalk.gray('  ✓ Separate concerns (UI, logic, data)'));
      console.log(chalk.gray('  ✓ Follow framework conventions\n'));

      console.log(formatSubheader('2. Code Generation\n'));
      console.log(chalk.gray('  ✓ Be specific in your descriptions'));
      console.log(chalk.gray('  ✓ Review generated code before committing'));
      console.log(chalk.gray('  ✓ Use examples as templates'));
      console.log(chalk.gray('  ✓ Customize generated code to fit your style\n'));

      console.log(formatSubheader('3. Testing\n'));
      console.log(chalk.gray('  ✓ Run tests frequently with --watch'));
      console.log(chalk.gray('  ✓ Generate tests alongside code'));
      console.log(chalk.gray('  ✓ Maintain high code coverage'));
      console.log(chalk.gray('  ✓ Test edge cases and error scenarios\n'));

      console.log(formatSubheader('4. Performance\n'));
      console.log(chalk.gray('  ✓ Analyze regularly: tryforge analyze performance'));
      console.log(chalk.gray('  ✓ Optimize images and assets'));
      console.log(chalk.gray('  ✓ Use code splitting and lazy loading'));
      console.log(chalk.gray('  ✓ Monitor bundle size\n'));

      console.log(formatSubheader('5. Security\n'));
      console.log(chalk.gray('  ✓ Never commit API keys or secrets'));
      console.log(chalk.gray('  ✓ Use environment variables'));
      console.log(chalk.gray('  ✓ Run security audits: tryforge analyze security'));
      console.log(chalk.gray('  ✓ Keep dependencies updated\n'));

      console.log(formatSubheader('6. Deployment\n'));
      console.log(chalk.gray('  ✓ Test builds locally before deploying'));
      console.log(chalk.gray('  ✓ Use staging environments'));
      console.log(chalk.gray('  ✓ Set up CI/CD pipelines'));
      console.log(chalk.gray('  ✓ Monitor production logs\n'));

      console.log(formatTip('Run "tryforge analyze codebase" regularly to maintain quality'));
    }
  },

  'ai-features': {
    title: 'AI Features Guide',
    emoji: '🤖',
    content: () => {
      console.log(formatHeader('AI Features Guide', '🤖'));
      console.log(chalk.white('Leverage AI to boost your productivity\n'));

      console.log(formatSubheader('1. Auto-Generate Models\n'));
      console.log(chalk.white('Let AI create database models from descriptions:\n'));
      console.log(formatCommand('tryforge models:generate -d "E-commerce platform"'));
      console.log(chalk.gray('   Creates complete data models with relationships\n'));

      console.log(formatSubheader('2. Auto-Generate Graphics\n'));
      console.log(chalk.white('AI creates professional graphics:\n'));
      console.log(formatCommand('tryforge graphics:generate -n "MyApp" --style modern'));
      console.log(chalk.gray('   Generates logos, favicons, hero images, etc.\n'));

      console.log(formatSubheader('3. Intelligent Code Generation\n'));
      console.log(chalk.white('Describe what you want in natural language:\n'));
      console.log(formatCommand('tryforge generate feature "User dashboard with charts"'));
      console.log(chalk.gray('   AI understands context and generates appropriate code\n'));

      console.log(formatSubheader('4. Smart Refactoring\n'));
      console.log(chalk.white('AI analyzes and improves your code:\n'));
      console.log(formatCommand('tryforge refactor --scope performance'));
      console.log(chalk.gray('   Optimizes code while maintaining functionality\n'));

      console.log(formatSubheader('5. Watch Mode\n'));
      console.log(chalk.white('AI monitors your code and auto-generates missing pieces:\n'));
      console.log(formatCommand('tryforge models:watch'));
      console.log(formatCommand('tryforge graphics:watch'));
      console.log(chalk.gray('   Automatically detects and generates missing assets\n'));

      console.log(formatTip('AI features improve with usage. Provide feedback to help!'));
    }
  }
};

/**
 * Get guide by name
 */
function getGuide(name) {
  return guides[name];
}

/**
 * Display a guide
 */
function displayGuide(name) {
  const guide = getGuide(name);

  if (!guide) {
    console.log(chalk.yellow(`\nGuide '${name}' not found.\n`));
    console.log(chalk.white('Available guides:'));
    listGuides();
    return;
  }

  guide.content();
}

/**
 * List all available guides
 */
function listGuides() {
  console.log(formatHeader('Available Guides', '📚'));
  console.log(chalk.white('Comprehensive guides to help you master TryForge\n'));

  Object.entries(guides).forEach(([name, guide], index) => {
    console.log(formatListItem(index + 1, guide.title, `tryforge guide ${name}`));
  });

  console.log();
  console.log(formatTip('Run "tryforge guide <name>" to view a specific guide'));
}

/**
 * Search guides
 */
function searchGuides(keyword) {
  const searchTerm = keyword.toLowerCase();
  const results = [];

  Object.entries(guides).forEach(([name, guide]) => {
    if (name.includes(searchTerm) || guide.title.toLowerCase().includes(searchTerm)) {
      results.push({ name, ...guide });
    }
  });

  if (results.length === 0) {
    console.log(chalk.yellow(`\nNo guides found for '${keyword}'\n`));
    return;
  }

  console.log(formatHeader(`Guides matching '${keyword}'`, '🔍'));

  results.forEach((result, index) => {
    console.log(formatListItem(index + 1, result.title, `tryforge guide ${result.name}`));
  });
  console.log();
}

module.exports = {
  guides,
  getGuide,
  displayGuide,
  listGuides,
  searchGuides
};
