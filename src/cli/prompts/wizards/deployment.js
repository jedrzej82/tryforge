/**
 * TryForge CLI - Deployment Configuration Wizard
 * Interactive wizard for deployment setup
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const {
  validateRequired,
  validateUrl,
  validateEmail
} = require('../validators');
const {
  normalizeUrl,
  normalizeEmail
} = require('../transformers');
const {
  DEPLOYMENT_CHOICES
} = require('../choices');
const {
  createBanner,
  createSummary,
  createConfirmationPrompt,
  createInfoMessage,
  createWarningMessage
} = require('../templates');

/**
 * Deployment Configuration Wizard
 */
class DeploymentWizard {
  constructor() {
    this.config = {};
  }

  /**
   * Run the complete wizard
   */
  async run() {
    console.log(createBanner(
      '🚀 Deployment Configuration',
      'Configure your deployment settings'
    ));

    try {
      // Step 1: Platform Selection
      await this.promptPlatform();

      // Step 2: Platform-specific Configuration
      if (this.config.platform !== 'none') {
        await this.promptPlatformConfig();
      }

      // Step 3: Environment Variables
      await this.promptEnvironmentVariables();

      // Step 4: Build Configuration
      if (this.config.platform !== 'none') {
        await this.promptBuildConfig();
      }

      // Step 5: Domain and SSL
      if (this.config.platform !== 'docker') {
        await this.promptDomainConfig();
      }

      // Step 6: Confirmation
      const confirmed = await this.promptConfirmation();

      if (!confirmed) {
        console.log(chalk.yellow('\n✗ Deployment configuration cancelled\n'));
        return null;
      }

      return this.config;
    } catch (error) {
      console.log(chalk.red(`\n✗ Error: ${error.message}\n`));
      throw error;
    }
  }

  /**
   * Prompt for deployment platform
   */
  async promptPlatform() {
    console.log(chalk.cyan.bold('\n☁️  Platform Selection\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'platform',
        message: 'Where do you want to deploy?',
        choices: DEPLOYMENT_CHOICES,
        pageSize: 10
      }
    ]);

    const selectedPlatform = DEPLOYMENT_CHOICES.find(p => p.value === answers.platform);

    this.config = {
      ...this.config,
      ...answers,
      platformInfo: selectedPlatform
    };

    if (selectedPlatform.value !== 'none') {
      console.log(chalk.gray(`\n${selectedPlatform.description}`));
      console.log(chalk.gray(`Best for: ${selectedPlatform.bestFor.join(', ')}\n`));
    }
  }

  /**
   * Prompt for platform-specific configuration
   */
  async promptPlatformConfig() {
    const platform = this.config.platform;

    console.log(chalk.cyan.bold('\n⚙️  Platform Configuration\n'));

    // Common questions
    const commonQuestions = [
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name on platform:',
        default: 'my-app',
        validate: validateRequired
      }
    ];

    let platformSpecificQuestions = [];

    // Platform-specific questions
    if (platform === 'vercel') {
      platformSpecificQuestions = [
        {
          type: 'input',
          name: 'vercelToken',
          message: 'Vercel API token (optional, for CLI deployment):',
          default: ''
        },
        {
          type: 'input',
          name: 'vercelTeam',
          message: 'Vercel team/organization (optional):',
          default: ''
        },
        {
          type: 'list',
          name: 'framework',
          message: 'Framework preset:',
          choices: [
            { name: 'Next.js', value: 'nextjs' },
            { name: 'Create React App', value: 'create-react-app' },
            { name: 'Vite', value: 'vite' },
            { name: 'Other', value: 'other' }
          ]
        }
      ];
    } else if (platform === 'netlify') {
      platformSpecificQuestions = [
        {
          type: 'input',
          name: 'netlifyToken',
          message: 'Netlify API token (optional, for CLI deployment):',
          default: ''
        },
        {
          type: 'input',
          name: 'netlifyTeam',
          message: 'Netlify team (optional):',
          default: ''
        },
        {
          type: 'input',
          name: 'buildCommand',
          message: 'Build command:',
          default: 'npm run build'
        },
        {
          type: 'input',
          name: 'publishDir',
          message: 'Publish directory:',
          default: 'dist'
        }
      ];
    } else if (platform === 'railway') {
      platformSpecificQuestions = [
        {
          type: 'input',
          name: 'railwayToken',
          message: 'Railway API token (optional):',
          default: ''
        },
        {
          type: 'confirm',
          name: 'railwayDatabase',
          message: 'Provision Railway database?',
          default: true
        },
        {
          type: 'list',
          name: 'railwayDbType',
          message: 'Database type:',
          choices: [
            { name: 'PostgreSQL', value: 'postgresql' },
            { name: 'MySQL', value: 'mysql' },
            { name: 'MongoDB', value: 'mongodb' },
            { name: 'Redis', value: 'redis' }
          ],
          when: (answers) => answers.railwayDatabase
        }
      ];
    } else if (platform === 'render') {
      platformSpecificQuestions = [
        {
          type: 'input',
          name: 'renderApiKey',
          message: 'Render API key (optional):',
          default: ''
        },
        {
          type: 'list',
          name: 'renderServiceType',
          message: 'Service type:',
          choices: [
            { name: 'Web Service', value: 'web' },
            { name: 'Static Site', value: 'static' },
            { name: 'Background Worker', value: 'worker' },
            { name: 'Cron Job', value: 'cron' }
          ]
        },
        {
          type: 'list',
          name: 'renderRegion',
          message: 'Deployment region:',
          choices: [
            { name: 'Oregon (US West)', value: 'oregon' },
            { name: 'Ohio (US East)', value: 'ohio' },
            { name: 'Frankfurt (EU)', value: 'frankfurt' },
            { name: 'Singapore', value: 'singapore' }
          ]
        }
      ];
    } else if (platform === 'docker') {
      platformSpecificQuestions = [
        {
          type: 'input',
          name: 'dockerRegistry',
          message: 'Docker registry (optional):',
          default: 'docker.io',
          filter: normalizeUrl
        },
        {
          type: 'input',
          name: 'dockerImage',
          message: 'Docker image name:',
          default: 'my-app',
          validate: validateRequired
        },
        {
          type: 'confirm',
          name: 'dockerCompose',
          message: 'Generate Docker Compose file?',
          default: true
        },
        {
          type: 'confirm',
          name: 'multiStage',
          message: 'Use multi-stage build?',
          default: true
        },
        {
          type: 'list',
          name: 'baseImage',
          message: 'Base image:',
          choices: [
            { name: 'Node.js 18 Alpine', value: 'node:18-alpine' },
            { name: 'Node.js 20 Alpine', value: 'node:20-alpine' },
            { name: 'Node.js 18', value: 'node:18' },
            { name: 'Node.js 20', value: 'node:20' }
          ]
        }
      ];
    }

    const answers = await inquirer.prompt([
      ...commonQuestions,
      ...platformSpecificQuestions
    ]);

    this.config = { ...this.config, ...answers };
  }

  /**
   * Prompt for environment variables
   */
  async promptEnvironmentVariables() {
    console.log(chalk.cyan.bold('\n🔐 Environment Variables\n'));

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useEnvFile',
        message: 'Create .env file for environment variables?',
        default: true
      },
      {
        type: 'input',
        name: 'nodeEnv',
        message: 'NODE_ENV:',
        default: 'production',
        validate: validateRequired
      },
      {
        type: 'number',
        name: 'port',
        message: 'Application port:',
        default: 3000
      },
      {
        type: 'confirm',
        name: 'includeDbUrl',
        message: 'Include database URL in environment?',
        default: true
      },
      {
        type: 'confirm',
        name: 'includeApiKeys',
        message: 'Will you need API keys configuration?',
        default: true
      }
    ]);

    this.config = { ...this.config, ...answers };

    if (answers.includeApiKeys) {
      console.log(createInfoMessage(
        'API Keys',
        'You can configure API keys after deployment or in your .env file'
      ));
    }
  }

  /**
   * Prompt for build configuration
   */
  async promptBuildConfig() {
    console.log(chalk.cyan.bold('\n🏗️  Build Configuration\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'buildCommand',
        message: 'Build command:',
        default: 'npm run build',
        when: !this.config.buildCommand // Skip if already set
      },
      {
        type: 'input',
        name: 'startCommand',
        message: 'Start command:',
        default: 'npm start'
      },
      {
        type: 'input',
        name: 'installCommand',
        message: 'Install command:',
        default: 'npm install'
      },
      {
        type: 'confirm',
        name: 'autoRedeploy',
        message: 'Auto-redeploy on git push?',
        default: true
      },
      {
        type: 'input',
        name: 'branch',
        message: 'Git branch to deploy:',
        default: 'main',
        when: (answers) => answers.autoRedeploy
      }
    ]);

    this.config = { ...this.config, ...answers };
  }

  /**
   * Prompt for domain configuration
   */
  async promptDomainConfig() {
    console.log(chalk.cyan.bold('\n🌐 Domain & SSL\n'));

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'customDomain',
        message: 'Configure custom domain?',
        default: false
      },
      {
        type: 'input',
        name: 'domain',
        message: 'Custom domain:',
        validate: (input) => {
          if (!input) return 'Domain is required';

          // Basic domain validation
          const domainPattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
          if (!domainPattern.test(input)) {
            return 'Please enter a valid domain (e.g., example.com)';
          }

          return true;
        },
        when: (answers) => answers.customDomain
      },
      {
        type: 'confirm',
        name: 'ssl',
        message: 'Enable SSL/HTTPS?',
        default: true,
        when: (answers) => answers.customDomain
      },
      {
        type: 'list',
        name: 'sslProvider',
        message: 'SSL certificate provider:',
        choices: [
          { name: 'Auto (Let\'s Encrypt)', value: 'auto' },
          { name: 'Custom certificate', value: 'custom' }
        ],
        default: 'auto',
        when: (answers) => answers.customDomain && answers.ssl
      }
    ]);

    this.config = { ...this.config, ...answers };

    if (answers.customDomain) {
      console.log(createInfoMessage(
        'Domain Setup',
        [
          `Point your domain's DNS to the platform's nameservers`,
          'SSL certificate will be automatically provisioned',
          'Allow up to 24 hours for DNS propagation'
        ]
      ));
    }
  }

  /**
   * Prompt for confirmation
   */
  async promptConfirmation() {
    const summaryData = {
      'Platform': this.config.platformInfo?.short || 'None',
      'Project Name': this.config.projectName || 'N/A'
    };

    if (this.config.platform !== 'none') {
      summaryData['Build Command'] = this.config.buildCommand || 'N/A';
      summaryData['Start Command'] = this.config.startCommand || 'N/A';
      summaryData['Auto Deploy'] = this.config.autoRedeploy ? 'Yes' : 'No';

      if (this.config.customDomain) {
        summaryData['Domain'] = this.config.domain;
        summaryData['SSL'] = this.config.ssl ? 'Enabled' : 'Disabled';
      }
    }

    console.log(createSummary('Deployment Configuration Summary', summaryData));

    const { confirmed } = await inquirer.prompt([
      createConfirmationPrompt(
        this.config,
        'Continue with this deployment configuration?'
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
 * Quick deployment setup (with defaults)
 */
async function quickDeploymentSetup() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'platform',
      message: 'Deployment platform:',
      choices: DEPLOYMENT_CHOICES.slice(0, 5),
      default: 'vercel'
    }
  ]);

  // Return config with defaults
  return {
    ...answers,
    projectName: 'my-app',
    buildCommand: 'npm run build',
    startCommand: 'npm start',
    installCommand: 'npm install',
    autoRedeploy: true,
    branch: 'main',
    useEnvFile: true,
    nodeEnv: 'production',
    port: 3000
  };
}

module.exports = {
  DeploymentWizard,
  quickDeploymentSetup
};
