/**
 * Completion Data
 * Command, flag, and value definitions for auto-completion
 */

/**
 * Get all available commands with descriptions
 */
function getCommands() {
  return [
    { name: 'create', description: 'Initialize a new project from description' },
    { name: 'refactor', description: 'Refactor and improve existing application' },
    { name: 'analyze', description: 'Analyze codebase (codebase|performance|security|ui|database|bundle)' },
    { name: 'status', description: 'Show system and project status' },
    { name: 'test', description: 'Run tests (all|backend|frontend|integration|e2e)' },
    { name: 'build', description: 'Build application for production' },
    { name: 'start', description: 'Start development servers' },
    { name: 'stop', description: 'Stop all servers' },
    { name: 'db:reset', description: 'Reset database (drop, migrate, seed)' },
    { name: 'db:migrate', description: 'Run database migrations' },
    { name: 'db:seed', description: 'Seed database with sample data' },
    { name: 'admin', description: 'Open admin panel for API configuration' },
    { name: 'preview', description: 'Start live preview with hot reload' },
    { name: 'deploy', description: 'Deploy to cloud (vercel|netlify|railway|render)' },
    { name: 'deploy:status', description: 'Check deployment status' },
    { name: 'generate', description: 'AI-powered code generation (component|route|feature|test)' },
    { name: 'models:generate', description: 'Automatically generate missing database models' },
    { name: 'models:detect', description: 'Detect and generate missing models from code' },
    { name: 'models:watch', description: 'Watch and auto-generate missing models' },
    { name: 'models:list', description: 'List existing models in project' },
    { name: 'models:analyze', description: 'Analyze models and suggest improvements' },
    { name: 'graphics:generate', description: 'Automatically generate professional graphics' },
    { name: 'graphics:detect', description: 'Detect and generate missing graphics from code' },
    { name: 'graphics:watch', description: 'Watch and auto-generate missing graphics' },
    { name: 'graphics:list', description: 'List all graphics in project' },
    { name: 'graphics:analyze', description: 'Analyze graphics and provide optimization insights' },
    { name: 'graphics:type', description: 'Generate specific graphic type (logo|favicon|hero|og-image)' },
    { name: 'completion', description: 'Manage shell auto-completion' },
  ];
}

/**
 * Get flags for a specific command
 */
function getFlags(command) {
  const flagMap = {
    create: [
      { flag: '--framework', alias: '-f', description: 'Framework (react|vue|angular|svelte)', values: ['react', 'vue', 'angular', 'svelte'] },
      { flag: '--styling', alias: '-s', description: 'Styling (css|scss|tailwind|styled-components)', values: ['css', 'scss', 'tailwind', 'styled-components'] },
      { flag: '--database', alias: '-d', description: 'Database (postgresql|mysql|mongodb|sqlite)', values: ['postgresql', 'mysql', 'mongodb', 'sqlite'] },
      { flag: '--auth', alias: '-a', description: 'Authentication (jwt|oauth|session|none)', values: ['jwt', 'oauth', 'session', 'none'] },
      { flag: '--graphics', alias: '-g', description: 'Graphics style (modern|minimalist|professional|playful)', values: ['modern', 'minimalist', 'professional', 'playful'] },
      { flag: '--colors', alias: '-c', description: 'Color scheme' },
      { flag: '--template', alias: '-t', description: 'Template (minimal|standard|full)', values: ['minimal', 'standard', 'full'] },
      { flag: '--features', description: 'Comma-separated feature list' },
    ],
    refactor: [
      { flag: '--scope', alias: '-s', description: 'Scope (ui|performance|security|quality|all)', values: ['ui', 'performance', 'security', 'quality', 'all'] },
      { flag: '--files', alias: '-f', description: 'File pattern to refactor' },
    ],
    analyze: [
      { flag: '--output', alias: '-o', description: 'Output format (console|json|markdown)', values: ['console', 'json', 'markdown'] },
    ],
    test: [
      { flag: '--watch', alias: '-w', description: 'Watch mode' },
    ],
    build: [
      { flag: '--env', alias: '-e', description: 'Environment (development|staging|production)', values: ['development', 'staging', 'production'] },
    ],
    admin: [
      { flag: '--port', alias: '-p', description: 'Port for admin panel' },
    ],
    deploy: [
      { flag: '--path', alias: '-p', description: 'Project path' },
    ],
    'deploy:status': [
      { flag: '--path', alias: '-p', description: 'Project path' },
    ],
    generate: [
      { flag: '--path', alias: '-p', description: 'Project path' },
      { flag: '--file', alias: '-f', description: 'File path (for test generation)' },
    ],
    'models:generate': [
      { flag: '--description', alias: '-d', description: 'Application description' },
      { flag: '--requirements', alias: '-r', description: 'Requirements JSON file' },
      { flag: '--path', alias: '-p', description: 'Project path' },
      { flag: '--orm', description: 'ORM type (prisma|sequelize|typeorm|mongoose)', values: ['prisma', 'sequelize', 'typeorm', 'mongoose'] },
      { flag: '--language', description: 'Language (typescript|javascript)', values: ['typescript', 'javascript'] },
      { flag: '--no-enrich', description: 'Skip AI enrichment' },
      { flag: '--no-migrations', description: 'Skip migration generation' },
      { flag: '--interactive', alias: '-i', description: 'Interactive mode with confirmations' },
      { flag: '--verbose', alias: '-v', description: 'Verbose output' },
    ],
    'models:detect': [
      { flag: '--path', alias: '-p', description: 'Project path' },
      { flag: '--orm', description: 'ORM type', values: ['prisma', 'sequelize', 'typeorm', 'mongoose'] },
      { flag: '--language', description: 'Language', values: ['typescript', 'javascript'] },
      { flag: '--no-migrations', description: 'Skip migration generation' },
      { flag: '--verbose', alias: '-v', description: 'Verbose output' },
    ],
    'models:watch': [
      { flag: '--path', alias: '-p', description: 'Project path' },
      { flag: '--orm', description: 'ORM type', values: ['prisma', 'sequelize', 'typeorm', 'mongoose'] },
      { flag: '--language', description: 'Language', values: ['typescript', 'javascript'] },
    ],
    'models:list': [
      { flag: '--path', alias: '-p', description: 'Project path' },
    ],
    'models:analyze': [
      { flag: '--path', alias: '-p', description: 'Project path' },
      { flag: '--orm', description: 'ORM type', values: ['prisma', 'sequelize', 'typeorm', 'mongoose'] },
    ],
    'graphics:generate': [
      { flag: '--description', alias: '-d', description: 'Application description' },
      { flag: '--requirements', alias: '-r', description: 'Requirements JSON file' },
      { flag: '--type', alias: '-t', description: 'Application type (e-commerce|blog|dashboard|saas)', values: ['e-commerce', 'blog', 'dashboard', 'saas'] },
      { flag: '--name', alias: '-n', description: 'Application name' },
      { flag: '--path', alias: '-p', description: 'Project path' },
      { flag: '--output', alias: '-o', description: 'Output directory' },
      { flag: '--style', description: 'Graphics style (modern|minimalist|professional)', values: ['modern', 'minimalist', 'professional'] },
      { flag: '--colors', description: 'Color scheme' },
      { flag: '--quality', description: 'Image quality (1-100)' },
      { flag: '--no-enrich', description: 'Skip AI enrichment' },
      { flag: '--no-variations', description: 'Skip generating variations' },
      { flag: '--no-optimize', description: 'Skip image optimization' },
      { flag: '--verbose', alias: '-v', description: 'Verbose output' },
    ],
    'graphics:detect': [
      { flag: '--path', alias: '-p', description: 'Project path' },
      { flag: '--output', alias: '-o', description: 'Output directory' },
      { flag: '--quality', description: 'Image quality (1-100)' },
      { flag: '--verbose', alias: '-v', description: 'Verbose output' },
    ],
    'graphics:watch': [
      { flag: '--path', alias: '-p', description: 'Project path' },
      { flag: '--output', alias: '-o', description: 'Output directory' },
      { flag: '--quality', description: 'Image quality (1-100)' },
    ],
    'graphics:list': [
      { flag: '--path', alias: '-p', description: 'Project path' },
    ],
    'graphics:analyze': [
      { flag: '--path', alias: '-p', description: 'Project path' },
    ],
    'graphics:type': [
      { flag: '--name', alias: '-n', description: 'Application name' },
      { flag: '--path', alias: '-p', description: 'Project path' },
      { flag: '--output', alias: '-o', description: 'Output directory' },
      { flag: '--style', description: 'Graphics style', values: ['modern', 'minimalist', 'professional'] },
    ],
  };

  return flagMap[command] || [];
}

/**
 * Get possible values for a flag
 */
function getValues(command, flag) {
  const flags = getFlags(command);
  const flagDef = flags.find(f => f.flag === flag || f.alias === flag);
  return flagDef?.values || [];
}

/**
 * Get command by name
 */
function getCommand(name) {
  return getCommands().find(cmd => cmd.name === name);
}

/**
 * Check if command exists
 */
function hasCommand(name) {
  return getCommands().some(cmd => cmd.name === name);
}

/**
 * Get all command names
 */
function getCommandNames() {
  return getCommands().map(cmd => cmd.name);
}

module.exports = {
  getCommands,
  getFlags,
  getValues,
  getCommand,
  hasCommand,
  getCommandNames,
};
