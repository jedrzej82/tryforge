/**
 * Deployment Manager
 * Deploy to Vercel, Netlify, Railway like Replit
 */

const { execa } = require('execa');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

class DeploymentManager {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  /**
   * Deploy project to selected platform
   */
  async deploy(platform) {
    if (!platform) {
      platform = await this.selectPlatform();
    }

    console.log(chalk.cyan.bold(`\n🚀 Deploying to ${platform}...\n`));

    switch (platform.toLowerCase()) {
      case 'vercel':
        return await this.deployToVercel();
      case 'netlify':
        return await this.deployToNetlify();
      case 'railway':
        return await this.deployToRailway();
      case 'render':
        return await this.deployToRender();
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }

  /**
   * Select deployment platform
   */
  async selectPlatform() {
    const { platform } = await inquirer.prompt([
      {
        type: 'list',
        name: 'platform',
        message: 'Select deployment platform:',
        choices: [
          { name: 'Vercel (Recommended for Frontend + API)', value: 'vercel' },
          { name: 'Netlify (Frontend + Serverless)', value: 'netlify' },
          { name: 'Railway (Full Stack)', value: 'railway' },
          { name: 'Render (Full Stack)', value: 'render' },
        ],
      },
    ]);

    return platform;
  }

  /**
   * Deploy to Vercel
   */
  async deployToVercel() {
    const spinner = ora('Preparing Vercel deployment...').start();

    try {
      // Check if vercel CLI is installed
      await this.ensureCLI('vercel', 'npm install -g vercel');

      // Create vercel.json config
      await this.createVercelConfig();

      spinner.text = 'Deploying to Vercel...';

      // Deploy
      const { stdout } = await execa('vercel', ['--prod'], {
        cwd: this.projectPath,
      });

      spinner.succeed('Deployed to Vercel');

      // Extract URL
      const urlMatch = stdout.match(/https:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : null;

      console.log(chalk.green.bold('\n✅ Deployment successful!\n'));
      if (url) {
        console.log(chalk.white('🌐 URL: ') + chalk.cyan(url));
      }
      console.log();

      return { success: true, url, platform: 'vercel' };
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  /**
   * Deploy to Netlify
   */
  async deployToNetlify() {
    const spinner = ora('Preparing Netlify deployment...').start();

    try {
      await this.ensureCLI('netlify', 'npm install -g netlify-cli');

      // Create netlify.toml config
      await this.createNetlifyConfig();

      spinner.text = 'Building for production...';
      await execa('npm', ['run', 'build'], {
        cwd: path.join(this.projectPath, 'frontend'),
      });

      spinner.text = 'Deploying to Netlify...';

      const { stdout } = await execa('netlify', ['deploy', '--prod'], {
        cwd: this.projectPath,
      });

      spinner.succeed('Deployed to Netlify');

      const urlMatch = stdout.match(/https:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : null;

      console.log(chalk.green.bold('\n✅ Deployment successful!\n'));
      if (url) {
        console.log(chalk.white('🌐 URL: ') + chalk.cyan(url));
      }
      console.log();

      return { success: true, url, platform: 'netlify' };
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  /**
   * Deploy to Railway
   */
  async deployToRailway() {
    const spinner = ora('Preparing Railway deployment...').start();

    try {
      await this.ensureCLI('railway', 'npm install -g @railway/cli');

      // Create railway.json config
      await this.createRailwayConfig();

      spinner.text = 'Deploying to Railway...';

      await execa('railway', ['up'], {
        cwd: this.projectPath,
      });

      spinner.succeed('Deployed to Railway');

      console.log(chalk.green.bold('\n✅ Deployment successful!\n'));
      console.log(chalk.white('Check your Railway dashboard for the URL\n'));

      return { success: true, platform: 'railway' };
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  /**
   * Deploy to Render
   */
  async deployToRender() {
    const spinner = ora('Preparing Render deployment...').start();

    try {
      // Create render.yaml config
      await this.createRenderConfig();

      spinner.succeed('Render configuration created');

      console.log(chalk.yellow('\n⚠️  Manual step required:\n'));
      console.log(chalk.white('1. Push your code to GitHub'));
      console.log(chalk.white('2. Connect your repo at https://dashboard.render.com'));
      console.log(chalk.white('3. Render will auto-deploy using render.yaml\n'));

      return { success: true, platform: 'render', manual: true };
    } catch (error) {
      spinner.fail('Configuration failed');
      throw error;
    }
  }

  /**
   * Ensure CLI tool is installed
   */
  async ensureCLI(command, installCmd) {
    try {
      await execa(command, ['--version']);
    } catch {
      console.log(chalk.yellow(`\n📦 ${command} not installed. Installing...\n`));
      await execa('sh', ['-c', installCmd]);
    }
  }

  /**
   * Create Vercel config
   */
  async createVercelConfig() {
    const config = {
      version: 2,
      builds: [
        {
          src: 'frontend/package.json',
          use: '@vercel/static-build',
          config: {
            distDir: 'dist',
          },
        },
        {
          src: 'backend/src/server.js',
          use: '@vercel/node',
        },
      ],
      routes: [
        {
          src: '/api/(.*)',
          dest: 'backend/src/server.js',
        },
        {
          src: '/(.*)',
          dest: 'frontend/dist/$1',
        },
      ],
    };

    await fs.writeJSON(
      path.join(this.projectPath, 'vercel.json'),
      config,
      { spaces: 2 }
    );
  }

  /**
   * Create Netlify config
   */
  async createNetlifyConfig() {
    const config = `[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

    await fs.writeFile(
      path.join(this.projectPath, 'netlify.toml'),
      config
    );
  }

  /**
   * Create Railway config
   */
  async createRailwayConfig() {
    const config = {
      build: {
        builder: 'NIXPACKS',
      },
      deploy: {
        startCommand: 'npm start',
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 10,
      },
    };

    await fs.writeJSON(
      path.join(this.projectPath, 'railway.json'),
      config,
      { spaces: 2 }
    );
  }

  /**
   * Create Render config
   */
  async createRenderConfig() {
    const config = `services:
  - type: web
    name: frontend
    env: node
    buildCommand: cd frontend && npm install && npm run build
    startCommand: cd frontend && npm run preview
    envVars:
      - key: NODE_ENV
        value: production

  - type: web
    name: backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: database
          property: connectionString

databases:
  - name: database
    databaseName: app_db
    user: app_user
`;

    await fs.writeFile(
      path.join(this.projectPath, 'render.yaml'),
      config
    );
  }

  /**
   * Get deployment status
   */
  async getStatus(platform) {
    const spinner = ora(`Checking ${platform} deployment status...`).start();

    try {
      let result;

      switch (platform.toLowerCase()) {
        case 'vercel':
          result = await execa('vercel', ['ls'], { cwd: this.projectPath });
          break;
        case 'netlify':
          result = await execa('netlify', ['status'], { cwd: this.projectPath });
          break;
        case 'railway':
          result = await execa('railway', ['status'], { cwd: this.projectPath });
          break;
      }

      spinner.succeed('Status retrieved');
      console.log('\n' + result.stdout + '\n');

      return result.stdout;
    } catch (error) {
      spinner.fail('Failed to get status');
      throw error;
    }
  }
}

module.exports = DeploymentManager;
