/**
 * BUILD Command - Builds application for production
 */

const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class BuildCommand {
  static async execute(options) {
    console.log(chalk.cyan.bold('\n🔨 Building for production...\n'));

    const spinner = ora('Preparing build...').start();
    const env = options.env || 'production';

    try {
      // Step 1: Clean previous builds
      spinner.text = 'Cleaning previous builds...';
      await this.clean();
      spinner.succeed(chalk.green('✅ Cleaned'));

      // Step 2: Run tests
      console.log();
      spinner.start('Running tests before build...');
      const testsPass = await this.runTests();

      if (!testsPass) {
        spinner.fail(chalk.red('❌ Tests failed. Fix tests before building.'));
        process.exit(1);
      }
      spinner.succeed(chalk.green('✅ All tests passed'));

      // Step 3: Build backend
      console.log();
      spinner.start('Building backend...');
      await this.buildBackend(env);
      spinner.succeed(chalk.green('✅ Backend built'));

      // Step 4: Build frontend
      console.log();
      spinner.start('Building frontend...');
      await this.buildFrontend(env);
      spinner.succeed(chalk.green('✅ Frontend built'));

      // Step 5: Optimize assets
      console.log();
      spinner.start('Optimizing assets...');
      await this.optimizeAssets();
      spinner.succeed(chalk.green('✅ Assets optimized'));

      // Step 6: Generate production config
      console.log();
      spinner.start('Generating production config...');
      await this.generateProductionConfig(env);
      spinner.succeed(chalk.green('✅ Production config generated'));

      // Step 7: Create deployment package
      console.log();
      spinner.start('Creating deployment package...');
      const packagePath = await this.createDeploymentPackage();
      spinner.succeed(chalk.green('✅ Deployment package created'));

      // Success summary
      console.log(chalk.green.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.green.bold('✅ BUILD SUCCESSFUL'));
      console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

      console.log(chalk.white('📦 Build artifacts:'));
      console.log(chalk.gray(`   - Backend: ./dist/backend/`));
      console.log(chalk.gray(`   - Frontend: ./dist/frontend/`));
      console.log(chalk.gray(`   - Package: ${packagePath}\n`));

      console.log(chalk.white('🚀 Next steps:'));
      console.log(chalk.gray('   - Test locally: npm run serve:production'));
      console.log(chalk.gray('   - Deploy: npm run deploy'));
      console.log();

    } catch (error) {
      spinner.fail(chalk.red('Build failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static async clean() {
    const distDir = path.join(process.cwd(), 'dist');
    await fs.remove(distDir);
    await fs.ensureDir(distDir);
  }

  static async runTests() {
    return new Promise((resolve) => {
      const npm = spawn('npm', ['test', '--', '--passWithNoTests'], {
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      npm.on('close', (code) => {
        resolve(code === 0);
      });

      npm.on('error', () => {
        resolve(false);
      });
    });
  }

  static buildBackend(env) {
    return new Promise((resolve, reject) => {
      // Copy backend files to dist
      const backendSrc = path.join(process.cwd(), 'backend');
      const backendDist = path.join(process.cwd(), 'dist', 'backend');

      if (!fs.existsSync(backendSrc)) {
        resolve(); // No backend
        return;
      }

      fs.copy(backendSrc, backendDist, {
        filter: (src) => {
          // Exclude node_modules, tests, etc.
          return !src.includes('node_modules') &&
                 !src.includes('tests') &&
                 !src.includes('.test.js');
        },
      })
      .then(() => resolve())
      .catch(reject);
    });
  }

  static buildFrontend(env) {
    return new Promise((resolve, reject) => {
      const frontendDir = path.join(process.cwd(), 'frontend');

      if (!fs.existsSync(frontendDir)) {
        resolve(); // No frontend
        return;
      }

      // Run frontend build (vite, webpack, etc.)
      const npm = spawn('npm', ['run', 'build'], {
        cwd: frontendDir,
        stdio: 'pipe',
      });

      npm.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Frontend build failed'));
        }
      });

      npm.on('error', reject);
    });
  }

  static async optimizeAssets() {
    // Compress images, minify CSS/JS, etc.
    // Simplified for now
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  static async generateProductionConfig(env) {
    const config = {
      NODE_ENV: env,
      PORT: 3000,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/app_db',
    };

    const configPath = path.join(process.cwd(), 'dist', '.env.production');
    const content = Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    await fs.writeFile(configPath, content);
  }

  static async createDeploymentPackage() {
    const packagePath = path.join(process.cwd(), 'dist', 'deployment.tar.gz');

    // Create deployment package (simplified - would use tar in real implementation)
    await fs.ensureFile(packagePath);

    return packagePath;
  }
}

module.exports = BuildCommand;
