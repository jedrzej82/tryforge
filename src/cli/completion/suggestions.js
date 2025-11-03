/**
 * Dynamic Suggestions System
 * Provides context-aware completion suggestions
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

/**
 * Get template suggestions
 */
async function getTemplateSuggestions() {
  const templatesDir = path.join(__dirname, '../../templates');

  try {
    if (await fs.pathExists(templatesDir)) {
      const templates = await fs.readdir(templatesDir);
      return templates.filter(t => !t.startsWith('.'));
    }
  } catch (error) {
    // Silent fail
  }

  return ['minimal', 'standard', 'full'];
}

/**
 * Get framework suggestions
 */
function getFrameworkSuggestions() {
  return [
    { name: 'react', description: 'React 18 + TypeScript + Vite' },
    { name: 'vue', description: 'Vue 3 + TypeScript + Vite' },
    { name: 'angular', description: 'Angular 17 + TypeScript' },
    { name: 'svelte', description: 'SvelteKit + TypeScript' },
  ];
}

/**
 * Get database suggestions
 */
function getDatabaseSuggestions() {
  return [
    { name: 'postgresql', description: 'PostgreSQL with Prisma ORM' },
    { name: 'mysql', description: 'MySQL with Sequelize' },
    { name: 'mongodb', description: 'MongoDB with Mongoose' },
    { name: 'sqlite', description: 'SQLite (development only)' },
  ];
}

/**
 * Get styling suggestions
 */
function getStylingSuggestions() {
  return [
    { name: 'css', description: 'Plain CSS with modules' },
    { name: 'scss', description: 'SCSS/SASS preprocessor' },
    { name: 'tailwind', description: 'Tailwind CSS utility-first' },
    { name: 'styled-components', description: 'CSS-in-JS styled-components' },
  ];
}

/**
 * Get auth method suggestions
 */
function getAuthSuggestions() {
  return [
    { name: 'jwt', description: 'JWT token-based auth' },
    { name: 'oauth', description: 'OAuth 2.0 (Google, GitHub)' },
    { name: 'session', description: 'Session-based auth' },
    { name: 'none', description: 'No authentication' },
  ];
}

/**
 * Get graphics style suggestions
 */
function getGraphicsStyleSuggestions() {
  return [
    { name: 'modern', description: 'Modern, vibrant design' },
    { name: 'minimalist', description: 'Clean, minimal aesthetic' },
    { name: 'professional', description: 'Corporate, professional look' },
    { name: 'playful', description: 'Fun, colorful design' },
  ];
}

/**
 * Get ORM suggestions
 */
function getORMSuggestions() {
  return [
    { name: 'prisma', description: 'Prisma ORM (recommended)' },
    { name: 'sequelize', description: 'Sequelize ORM' },
    { name: 'typeorm', description: 'TypeORM' },
    { name: 'mongoose', description: 'Mongoose (MongoDB)' },
  ];
}

/**
 * Get language suggestions
 */
function getLanguageSuggestions() {
  return [
    { name: 'typescript', description: 'TypeScript (recommended)' },
    { name: 'javascript', description: 'JavaScript' },
  ];
}

/**
 * Get deployment platform suggestions
 */
function getDeploymentSuggestions() {
  return [
    { name: 'vercel', description: 'Vercel (Next.js optimized)' },
    { name: 'netlify', description: 'Netlify (Static + Functions)' },
    { name: 'railway', description: 'Railway (Full-stack apps)' },
    { name: 'render', description: 'Render (Full-stack + DB)' },
  ];
}

/**
 * Get file path suggestions
 * @param {string} fragment - Current path fragment
 * @param {string} cwd - Current working directory
 */
async function getFilePathSuggestions(fragment, cwd = process.cwd()) {
  try {
    const dir = fragment ? path.dirname(fragment) : '.';
    const base = fragment ? path.basename(fragment) : '';
    const searchDir = path.resolve(cwd, dir);

    if (await fs.pathExists(searchDir)) {
      const entries = await fs.readdir(searchDir, { withFileTypes: true });

      return entries
        .filter(entry => entry.name.startsWith(base))
        .map(entry => {
          const fullPath = path.join(dir, entry.name);
          return entry.isDirectory() ? `${fullPath}/` : fullPath;
        });
    }
  } catch (error) {
    // Silent fail
  }

  return [];
}

/**
 * Get component path suggestions
 */
async function getComponentPathSuggestions(cwd = process.cwd()) {
  const suggestions = [];
  const dirs = [
    'src/components/',
    'src/pages/',
    'src/layouts/',
    'src/features/',
    'components/',
    'pages/',
  ];

  for (const dir of dirs) {
    const fullPath = path.join(cwd, dir);
    if (await fs.pathExists(fullPath)) {
      suggestions.push(dir);
    }
  }

  return suggestions;
}

/**
 * Get graphics type suggestions
 */
function getGraphicsTypeSuggestions() {
  return [
    { name: 'logo', description: 'Application logo (SVG + PNG)' },
    { name: 'favicon', description: 'Favicon set (ICO + PNG)' },
    { name: 'hero', description: 'Hero/banner images' },
    { name: 'og-image', description: 'Open Graph social images' },
  ];
}

/**
 * Get generate type suggestions
 */
function getGenerateTypeSuggestions() {
  return [
    { name: 'component', description: 'React/Vue component with tests' },
    { name: 'route', description: 'API route with validation' },
    { name: 'feature', description: 'Complete feature module' },
    { name: 'test', description: 'Test file for existing code' },
  ];
}

/**
 * Get application type suggestions
 */
function getApplicationTypeSuggestions() {
  return [
    { name: 'e-commerce', description: 'E-commerce platform' },
    { name: 'blog', description: 'Blog or content site' },
    { name: 'dashboard', description: 'Admin dashboard' },
    { name: 'saas', description: 'SaaS application' },
  ];
}

/**
 * Get analyze type suggestions
 */
function getAnalyzeTypeSuggestions() {
  return [
    { name: 'codebase', description: 'Full codebase analysis' },
    { name: 'performance', description: 'Performance bottlenecks' },
    { name: 'security', description: 'Security vulnerabilities' },
    { name: 'ui', description: 'UI/UX analysis' },
    { name: 'database', description: 'Database optimization' },
    { name: 'bundle', description: 'Bundle size analysis' },
  ];
}

/**
 * Get test type suggestions
 */
function getTestTypeSuggestions() {
  return [
    { name: 'all', description: 'Run all tests' },
    { name: 'backend', description: 'Backend/API tests' },
    { name: 'frontend', description: 'Frontend component tests' },
    { name: 'integration', description: 'Integration tests' },
    { name: 'e2e', description: 'End-to-end tests' },
  ];
}

/**
 * Main suggestion resolver
 * @param {Object} context - Completion context
 */
async function getSuggestions(context) {
  const { fragment, words, position } = context;
  const command = words[1]; // First word after 'tryforge'
  const flag = words[position - 1]; // Previous word

  // Command suggestions
  if (position === 1) {
    return [
      'create', 'refactor', 'analyze', 'status', 'test', 'build', 'start', 'stop',
      'db:reset', 'db:migrate', 'db:seed', 'admin', 'preview', 'deploy',
      'deploy:status', 'generate', 'models:generate', 'models:detect',
      'models:watch', 'models:list', 'models:analyze', 'graphics:generate',
      'graphics:detect', 'graphics:watch', 'graphics:list', 'graphics:analyze',
      'graphics:type', 'completion',
    ];
  }

  // Flag value suggestions based on previous flag
  switch (flag) {
    case '--framework':
    case '-f':
      return getFrameworkSuggestions().map(s => s.name);

    case '--database':
    case '-d':
      return getDatabaseSuggestions().map(s => s.name);

    case '--styling':
    case '-s':
      return getStylingSuggestions().map(s => s.name);

    case '--auth':
    case '-a':
      return getAuthSuggestions().map(s => s.name);

    case '--graphics':
    case '-g':
      return getGraphicsStyleSuggestions().map(s => s.name);

    case '--style':
      return getGraphicsStyleSuggestions().map(s => s.name);

    case '--template':
    case '-t':
      return await getTemplateSuggestions();

    case '--orm':
      return getORMSuggestions().map(s => s.name);

    case '--language':
      return getLanguageSuggestions().map(s => s.name);

    case '--output':
      if (command === 'analyze') {
        return ['console', 'json', 'markdown'];
      }
      return await getFilePathSuggestions(fragment);

    case '--path':
    case '-p':
      return await getFilePathSuggestions(fragment);

    case '--file':
      return await getFilePathSuggestions(fragment);

    case '--env':
    case '-e':
      return ['development', 'staging', 'production'];

    case '--scope':
      return ['ui', 'performance', 'security', 'quality', 'all'];

    case '--type':
      return getApplicationTypeSuggestions().map(s => s.name);
  }

  // Command-specific suggestions
  switch (command) {
    case 'deploy':
    case 'deploy:status':
      if (position === 2) {
        return getDeploymentSuggestions().map(s => s.name);
      }
      break;

    case 'analyze':
      if (position === 2) {
        return getAnalyzeTypeSuggestions().map(s => s.name);
      }
      break;

    case 'test':
      if (position === 2) {
        return getTestTypeSuggestions().map(s => s.name);
      }
      break;

    case 'generate':
      if (position === 2) {
        return getGenerateTypeSuggestions().map(s => s.name);
      }
      if (words[2] === 'component' && flag === '--path') {
        return await getComponentPathSuggestions();
      }
      break;

    case 'graphics:type':
      if (position === 2) {
        return getGraphicsTypeSuggestions().map(s => s.name);
      }
      break;

    case 'completion':
      if (position === 2) {
        return ['install', 'uninstall', 'generate'];
      }
      if (words[2] === 'generate' && position === 3) {
        return ['bash', 'zsh', 'fish', 'powershell'];
      }
      break;
  }

  return [];
}

module.exports = {
  getSuggestions,
  getTemplateSuggestions,
  getFrameworkSuggestions,
  getDatabaseSuggestions,
  getStylingSuggestions,
  getAuthSuggestions,
  getGraphicsStyleSuggestions,
  getORMSuggestions,
  getLanguageSuggestions,
  getDeploymentSuggestions,
  getFilePathSuggestions,
  getComponentPathSuggestions,
  getGraphicsTypeSuggestions,
  getGenerateTypeSuggestions,
  getApplicationTypeSuggestions,
  getAnalyzeTypeSuggestions,
  getTestTypeSuggestions,
};
