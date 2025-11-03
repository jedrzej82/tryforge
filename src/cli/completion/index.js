/**
 * TryForge CLI Auto-Completion System
 * Main entry point for shell auto-completion
 */

const omelette = require('omelette');
const path = require('path');
const { getSuggestions } = require('./suggestions');
const { getCommands, getFlags, getValues } = require('./data');

/**
 * Initialize auto-completion system
 */
function initializeCompletion() {
  const completion = omelette('tryforge');

  // Set up completion tree
  completion.tree({
    create: {
      '--framework': ['react', 'vue', 'angular', 'svelte'],
      '--styling': ['css', 'scss', 'tailwind', 'styled-components'],
      '--database': ['postgresql', 'mysql', 'mongodb', 'sqlite'],
      '--auth': ['jwt', 'oauth', 'session', 'none'],
      '--graphics': ['modern', 'minimalist', 'professional', 'playful'],
      '--template': ['minimal', 'standard', 'full'],
    },
    refactor: {
      '--scope': ['ui', 'performance', 'security', 'quality', 'all'],
    },
    analyze: ['codebase', 'performance', 'security', 'ui', 'database', 'bundle', {
      '--output': ['console', 'json', 'markdown'],
    }],
    status: {},
    test: ['all', 'backend', 'frontend', 'integration', 'e2e', {
      '--watch': [],
    }],
    build: {
      '--env': ['development', 'staging', 'production'],
    },
    start: {},
    stop: {},
    'db:reset': {},
    'db:migrate': {},
    'db:seed': {},
    admin: {
      '--port': [],
    },
    preview: {},
    deploy: ['vercel', 'netlify', 'railway', 'render'],
    'deploy:status': ['vercel', 'netlify', 'railway', 'render'],
    generate: ['component', 'route', 'feature', 'test', {
      '--path': [],
      '--file': [],
    }],
    'models:generate': {
      '--description': [],
      '--requirements': [],
      '--path': [],
      '--orm': ['prisma', 'sequelize', 'typeorm', 'mongoose'],
      '--language': ['typescript', 'javascript'],
      '--no-enrich': [],
      '--no-migrations': [],
      '--interactive': [],
      '--verbose': [],
    },
    'models:detect': {
      '--path': [],
      '--orm': ['prisma', 'sequelize', 'typeorm', 'mongoose'],
      '--language': ['typescript', 'javascript'],
      '--no-migrations': [],
      '--verbose': [],
    },
    'models:watch': {
      '--path': [],
      '--orm': ['prisma', 'sequelize', 'typeorm', 'mongoose'],
      '--language': ['typescript', 'javascript'],
    },
    'models:list': {
      '--path': [],
    },
    'models:analyze': {
      '--path': [],
      '--orm': ['prisma', 'sequelize', 'typeorm', 'mongoose'],
    },
    'graphics:generate': {
      '--description': [],
      '--requirements': [],
      '--type': ['e-commerce', 'blog', 'dashboard', 'saas'],
      '--name': [],
      '--path': [],
      '--output': [],
      '--style': ['modern', 'minimalist', 'professional'],
      '--colors': [],
      '--quality': [],
      '--no-enrich': [],
      '--no-variations': [],
      '--no-optimize': [],
      '--verbose': [],
    },
    'graphics:detect': {
      '--path': [],
      '--output': [],
      '--quality': [],
      '--verbose': [],
    },
    'graphics:watch': {
      '--path': [],
      '--output': [],
      '--quality': [],
    },
    'graphics:list': {
      '--path': [],
    },
    'graphics:analyze': {
      '--path': [],
    },
    'graphics:type': ['logo', 'favicon', 'hero', 'og-image', {
      '--name': [],
      '--path': [],
      '--output': [],
      '--style': ['modern', 'minimalist', 'professional'],
    }],
    completion: ['install', 'uninstall', {
      generate: ['bash', 'zsh', 'fish', 'powershell'],
    }],
  });

  // Advanced completion handler for dynamic suggestions
  completion.on('complete', async function(fragment, data) {
    const { line, before, after, words, w } = data;

    try {
      // Get dynamic suggestions based on context
      const suggestions = await getSuggestions({
        fragment,
        line,
        before,
        words,
        position: w,
      });

      // Reply with suggestions
      if (suggestions && suggestions.length > 0) {
        this.reply(suggestions);
      } else {
        // Fallback to default tree-based completion
        this.reply([]);
      }
    } catch (error) {
      // Silent fail - don't break completion
      this.reply([]);
    }
  });

  return completion;
}

/**
 * Setup completion for shell
 */
function setupCompletion() {
  const completion = initializeCompletion();
  completion.setupShellInitFile();
  return completion;
}

/**
 * Initialize completion (called by shell)
 */
function init() {
  const completion = initializeCompletion();
  completion.init();
  return completion;
}

/**
 * Install completion to shell
 * @param {string} shell - Shell type (bash|zsh|fish|powershell)
 */
async function installCompletion(shell) {
  const tabtab = require('tabtab');
  const { generators } = require('./generators');

  try {
    if (shell) {
      // Install for specific shell
      const script = generators[shell]();
      await tabtab.install({
        name: 'tryforge',
        completer: 'tryforge',
        shell,
      });
      console.log(`✅ Completion installed for ${shell}`);
    } else {
      // Auto-detect shell
      await tabtab.install({
        name: 'tryforge',
        completer: 'tryforge',
      });
      console.log('✅ Completion installed for your shell');
    }
    console.log('📝 Reload your shell or run: source ~/.bashrc (or ~/.zshrc)');
  } catch (error) {
    throw new Error(`Failed to install completion: ${error.message}`);
  }
}

/**
 * Uninstall completion from shell
 */
async function uninstallCompletion(shell) {
  const tabtab = require('tabtab');

  try {
    await tabtab.uninstall({
      name: 'tryforge',
      shell,
    });
    console.log('✅ Completion uninstalled');
  } catch (error) {
    throw new Error(`Failed to uninstall completion: ${error.message}`);
  }
}

module.exports = {
  initializeCompletion,
  setupCompletion,
  init,
  installCompletion,
  uninstallCompletion,
};
