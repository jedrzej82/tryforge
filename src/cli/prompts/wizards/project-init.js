/**
 * TryForge CLI - Project Initialization Wizard
 * Interactive wizard for creating new projects
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const {
  validateProjectName,
  validateRequired
} = require('../validators');
const {
  sanitizeProjectName,
  formatPath
} = require('../transformers');
const {
  TEMPLATE_CHOICES,
  STYLING_CHOICES,
  FEATURE_CHOICES,
  PACKAGE_MANAGER_CHOICES,
  LICENSE_CHOICES,
  GRAPHICS_STYLE_CHOICES
} = require('../choices');
const {
  createBanner,
  createSummary,
  createConfirmationPrompt,
  createMultiSelectHelper
} = require('../templates');

/**
 * Project Initialization Wizard
 */
class ProjectInitWizard {
  constructor() {
    this.config = {};
  }

  /**
   * Run the complete wizard
   */
  async run() {
    // Welcome banner
    console.log(createBanner(
      '🚀 Welcome to TryForge',
      'Let\'s create your amazing app!'
    ));

    try {
      // Step 1: Basic Information
      await this.promptBasicInfo();

      // Step 2: Template Selection
      await this.promptTemplate();

      // Step 3: Styling
      await this.promptStyling();

      // Step 4: Features
      await this.promptFeatures();

      // Step 5: Advanced Options
      await this.promptAdvancedOptions();

      // Step 6: Confirmation
      const confirmed = await this.promptConfirmation();

      if (!confirmed) {
        console.log(chalk.yellow('\n✗ Project creation cancelled\n'));
        return null;
      }

      return this.config;
    } catch (error) {
      console.log(chalk.red(`\n✗ Error: ${error.message}\n`));
      throw error;
    }
  }

  /**
   * Prompt for basic project information
   */
  async promptBasicInfo() {
    console.log(chalk.cyan.bold('\n📝 Basic Information\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What\'s your project name?',
        validate: validateProjectName,
        filter: sanitizeProjectName,
        default: 'my-awesome-app'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: (answers) => `A TryForge application: ${answers.projectName}`
      },
      {
        type: 'input',
        name: 'path',
        message: 'Where should we create your project?',
        default: (answers) => path.join(process.cwd(), answers.projectName),
        filter: formatPath
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: process.env.USER || process.env.USERNAME || 'Anonymous'
      }
    ]);

    this.config = { ...this.config, ...answers };
  }

  /**
   * Prompt for template selection
   */
  async promptTemplate() {
    console.log(chalk.cyan.bold('\n🎨 Template Selection\n'));
    console.log(chalk.gray('Choose a template that best fits your needs:\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Select a template:',
        choices: TEMPLATE_CHOICES,
        pageSize: 10
      }
    ]);

    // Get selected template details
    const selectedTemplate = TEMPLATE_CHOICES.find(t => t.value === answers.template);

    this.config = {
      ...this.config,
      ...answers,
      templateInfo: selectedTemplate
    };

    // Show template details
    console.log(chalk.gray(`\nSelected: ${selectedTemplate.description}`));
    console.log(chalk.gray(`Tags: ${selectedTemplate.tags.join(', ')}\n`));
  }

  /**
   * Prompt for styling framework
   */
  async promptStyling() {
    console.log(chalk.cyan.bold('\n💅 Styling Framework\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'styling',
        message: 'Choose your styling solution:',
        choices: STYLING_CHOICES,
        pageSize: 10
      },
      {
        type: 'list',
        name: 'graphicsStyle',
        message: 'Graphics style for generated assets:',
        choices: GRAPHICS_STYLE_CHOICES
      },
      {
        type: 'input',
        name: 'colorScheme',
        message: 'Primary color scheme:',
        default: 'blue and white',
        validate: validateRequired
      }
    ]);

    this.config = { ...this.config, ...answers };
  }

  /**
   * Prompt for features selection
   */
  async promptFeatures() {
    console.log(chalk.cyan.bold('\n✨ Feature Selection\n'));
    console.log(createMultiSelectHelper());
    console.log('');

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to include:',
        choices: FEATURE_CHOICES,
        pageSize: 15,
        validate: (choices) => {
          if (choices.length === 0) {
            return 'Please select at least one feature';
          }
          return true;
        }
      }
    ]);

    this.config = { ...this.config, ...answers };

    // Show selected features
    console.log(chalk.gray(`\n${answers.features.length} features selected\n`));
  }

  /**
   * Prompt for advanced options
   */
  async promptAdvancedOptions() {
    console.log(chalk.cyan.bold('\n⚙️  Advanced Options\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Package manager:',
        choices: PACKAGE_MANAGER_CHOICES,
        default: 'npm'
      },
      {
        type: 'list',
        name: 'license',
        message: 'License:',
        choices: LICENSE_CHOICES,
        default: 'MIT'
      },
      {
        type: 'confirm',
        name: 'git',
        message: 'Initialize Git repository?',
        default: true
      },
      {
        type: 'confirm',
        name: 'installDeps',
        message: 'Install dependencies after creation?',
        default: true
      },
      {
        type: 'confirm',
        name: 'useTypeScript',
        message: 'Use TypeScript?',
        default: true,
        when: (answers) => {
          // Only ask if template doesn't already specify TS
          const template = this.config.templateInfo;
          return !template.tags.includes('typescript');
        }
      }
    ]);

    this.config = { ...this.config, ...answers };
  }

  /**
   * Prompt for confirmation
   */
  async promptConfirmation() {
    // Display summary
    console.log(createSummary('Configuration Summary', {
      'Project Name': this.config.projectName,
      'Description': this.config.description,
      'Path': this.config.path,
      'Template': this.config.templateInfo.short,
      'Styling': STYLING_CHOICES.find(s => s.value === this.config.styling)?.short,
      'Features': `${this.config.features.length} selected`,
      'Package Manager': this.config.packageManager,
      'License': this.config.license,
      'Git Repository': this.config.git ? 'Yes' : 'No',
      'Install Dependencies': this.config.installDeps ? 'Yes' : 'No'
    }));

    const { confirmed } = await inquirer.prompt([
      createConfirmationPrompt(
        this.config,
        'Proceed with project creation?'
      )
    ]);

    return confirmed;
  }

  /**
   * Get the configuration
   */
  getConfig() {
    return this.config;
  }
}

/**
 * Quick init prompts (minimal version)
 */
async function quickInit() {
  console.log(createBanner('🚀 Quick Project Setup'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      validate: validateProjectName,
      filter: sanitizeProjectName
    },
    {
      type: 'list',
      name: 'template',
      message: 'Template:',
      choices: TEMPLATE_CHOICES.slice(0, 5), // Show only top 5 templates
      pageSize: 5
    },
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Create project with default settings?',
      default: true
    }
  ]);

  if (!answers.confirmed) {
    return null;
  }

  // Return config with defaults
  return {
    projectName: answers.projectName,
    template: answers.template,
    description: `A TryForge application: ${answers.projectName}`,
    path: path.join(process.cwd(), answers.projectName),
    author: process.env.USER || process.env.USERNAME || 'Anonymous',
    styling: 'tailwind',
    features: ['auth', 'database', 'testing', 'logging', 'docker'],
    packageManager: 'npm',
    license: 'MIT',
    git: true,
    installDeps: true,
    graphicsStyle: 'modern',
    colorScheme: 'blue and white'
  };
}

module.exports = {
  ProjectInitWizard,
  quickInit
};
