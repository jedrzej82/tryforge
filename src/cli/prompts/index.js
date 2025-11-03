/**
 * TryForge CLI - Main Prompt Orchestrator
 * Central hub for all interactive prompts
 */

const inquirer = require('inquirer');
const autocompletePrompt = require('inquirer-autocomplete-prompt');
const chalk = require('chalk');
const ora = require('ora');

// Register autocomplete prompt
inquirer.registerPrompt('autocomplete', autocompletePrompt);

// Import wizards
const { ProjectInitWizard, quickInit } = require('./wizards/project-init');
const { DatabaseWizard, quickDatabaseSetup } = require('./wizards/database');
const { DeploymentWizard, quickDeploymentSetup } = require('./wizards/deployment');

// Import utilities
const validators = require('./validators');
const transformers = require('./transformers');
const choices = require('./choices');
const templates = require('./templates');

/**
 * Main prompt orchestrator class
 */
class PromptOrchestrator {
  constructor(options = {}) {
    this.options = options;
    this.interactive = options.interactive !== false;
    this.quick = options.quick || false;
  }

  /**
   * Run full project initialization wizard
   */
  async projectInit() {
    if (!this.interactive) {
      throw new Error('Interactive mode is required for project initialization');
    }

    if (this.quick) {
      return await quickInit();
    }

    const wizard = new ProjectInitWizard();
    return await wizard.run();
  }

  /**
   * Run database configuration wizard
   */
  async databaseConfig() {
    if (!this.interactive) {
      throw new Error('Interactive mode is required for database configuration');
    }

    if (this.quick) {
      return await quickDatabaseSetup();
    }

    const wizard = new DatabaseWizard();
    return await wizard.run();
  }

  /**
   * Run deployment configuration wizard
   */
  async deploymentConfig() {
    if (!this.interactive) {
      throw new Error('Interactive mode is required for deployment configuration');
    }

    if (this.quick) {
      return await quickDeploymentSetup();
    }

    const wizard = new DeploymentWizard();
    return await wizard.run();
  }

  /**
   * Prompt for API key configuration
   */
  async apiKeyConfig() {
    console.log(templates.createBanner(
      '🔑 API Key Configuration',
      'Configure your API keys'
    ));

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureAnthropic',
        message: 'Configure Anthropic Claude API key?',
        default: true
      },
      {
        type: 'password',
        name: 'anthropicApiKey',
        message: 'Anthropic API key:',
        mask: '*',
        validate: validators.validateApiKey,
        when: (answers) => answers.configureAnthropic
      },
      {
        type: 'confirm',
        name: 'configureOpenAI',
        message: 'Configure OpenAI API key?',
        default: false
      },
      {
        type: 'password',
        name: 'openaiApiKey',
        message: 'OpenAI API key:',
        mask: '*',
        validate: validators.validateApiKey,
        when: (answers) => answers.configureOpenAI
      },
      {
        type: 'confirm',
        name: 'configureGithub',
        message: 'Configure GitHub token?',
        default: false
      },
      {
        type: 'password',
        name: 'githubToken',
        message: 'GitHub token:',
        mask: '*',
        validate: validators.validateApiKey,
        when: (answers) => answers.configureGithub
      }
    ]);

    return answers;
  }

  /**
   * Prompt for missing required options
   * Fills in missing CLI options interactively
   */
  async promptMissing(required, provided) {
    const missing = required.filter(key => !provided[key]);

    if (missing.length === 0) {
      return provided;
    }

    console.log(chalk.yellow(`\n⚠ Missing required options: ${missing.join(', ')}\n`));

    const prompts = [];

    for (const key of missing) {
      const prompt = this.createPromptForOption(key, provided);
      if (prompt) {
        prompts.push(prompt);
      }
    }

    const answers = await inquirer.prompt(prompts);

    return { ...provided, ...answers };
  }

  /**
   * Create a prompt for a specific option
   */
  createPromptForOption(option, context = {}) {
    const promptMap = {
      projectName: {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        validate: validators.validateProjectName,
        filter: transformers.sanitizeProjectName
      },
      template: {
        type: 'list',
        name: 'template',
        message: 'Template:',
        choices: choices.TEMPLATE_CHOICES
      },
      database: {
        type: 'list',
        name: 'database',
        message: 'Database:',
        choices: choices.DATABASE_CHOICES
      },
      auth: {
        type: 'list',
        name: 'auth',
        message: 'Authentication:',
        choices: choices.AUTH_CHOICES
      },
      styling: {
        type: 'list',
        name: 'styling',
        message: 'Styling:',
        choices: choices.STYLING_CHOICES
      },
      deployment: {
        type: 'list',
        name: 'deployment',
        message: 'Deployment platform:',
        choices: choices.DEPLOYMENT_CHOICES
      },
      description: {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: context.projectName ? `A TryForge application: ${context.projectName}` : ''
      }
    };

    return promptMap[option] || null;
  }

  /**
   * Confirm action
   */
  async confirm(message, defaultValue = true) {
    if (!this.interactive) {
      return defaultValue;
    }

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue
      }
    ]);

    return confirmed;
  }

  /**
   * Select from list
   */
  async select(message, choices, defaultValue = null) {
    if (!this.interactive) {
      return defaultValue || choices[0]?.value;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices,
        default: defaultValue
      }
    ]);

    return selected;
  }

  /**
   * Multi-select from list
   */
  async multiSelect(message, choices, defaults = []) {
    if (!this.interactive) {
      return defaults;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message,
        choices,
        default: defaults
      }
    ]);

    return selected;
  }

  /**
   * Input text
   */
  async input(message, options = {}) {
    if (!this.interactive) {
      return options.default || '';
    }

    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message,
        default: options.default,
        validate: options.validate,
        filter: options.filter
      }
    ]);

    return value;
  }

  /**
   * Password input
   */
  async password(message, options = {}) {
    if (!this.interactive) {
      return options.default || '';
    }

    const { value } = await inquirer.prompt([
      {
        type: 'password',
        name: 'value',
        message,
        mask: '*',
        validate: options.validate
      }
    ]);

    return value;
  }

  /**
   * Show loading spinner
   */
  spinner(text) {
    return ora({
      text,
      spinner: 'dots',
      color: 'cyan'
    });
  }

  /**
   * Show success message
   */
  success(message, details = null) {
    console.log(templates.createSuccessMessage(message, details));
  }

  /**
   * Show error message
   */
  error(message, error = null) {
    console.log(templates.createErrorMessage(message, error));
  }

  /**
   * Show warning message
   */
  warning(message, details = null) {
    console.log(templates.createWarningMessage(message, details));
  }

  /**
   * Show info message
   */
  info(message, details = null) {
    console.log(templates.createInfoMessage(message, details));
  }

  /**
   * Show summary
   */
  summary(title, items) {
    console.log(templates.createSummary(title, items));
  }

  /**
   * Show banner
   */
  banner(title, subtitle = null) {
    console.log(templates.createBanner(title, subtitle));
  }
}

/**
 * Create a new prompt orchestrator instance
 */
function createPromptOrchestrator(options = {}) {
  return new PromptOrchestrator(options);
}

/**
 * Quick helpers for common prompts
 */
const prompts = {
  /**
   * Confirm action
   */
  confirm: async (message, defaultValue = true) => {
    const orchestrator = createPromptOrchestrator();
    return await orchestrator.confirm(message, defaultValue);
  },

  /**
   * Select from list
   */
  select: async (message, choices, defaultValue = null) => {
    const orchestrator = createPromptOrchestrator();
    return await orchestrator.select(message, choices, defaultValue);
  },

  /**
   * Multi-select from list
   */
  multiSelect: async (message, choices, defaults = []) => {
    const orchestrator = createPromptOrchestrator();
    return await orchestrator.multiSelect(message, choices, defaults);
  },

  /**
   * Input text
   */
  input: async (message, options = {}) => {
    const orchestrator = createPromptOrchestrator();
    return await orchestrator.input(message, options);
  },

  /**
   * Password input
   */
  password: async (message, options = {}) => {
    const orchestrator = createPromptOrchestrator();
    return await orchestrator.password(message, options);
  }
};

// Export everything
module.exports = {
  PromptOrchestrator,
  createPromptOrchestrator,
  prompts,
  validators,
  transformers,
  choices,
  templates,
  // Wizards
  ProjectInitWizard,
  DatabaseWizard,
  DeploymentWizard,
  // Quick functions
  quickInit,
  quickDatabaseSetup,
  quickDeploymentSetup
};
