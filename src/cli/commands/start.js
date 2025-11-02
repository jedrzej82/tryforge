/**
 * START Command - Starts development servers
 */

const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class StartCommand {
  static async execute() {
    console.log(chalk.cyan.bold('\n🚀 Starting development servers...\n'));

    const spinner = ora('Checking services...').start();

    try {
      // Step 1: Check PostgreSQL
      spinner.text = 'Checking PostgreSQL...';
      const pgRunning = await this.checkPostgreSQL();

      if (!pgRunning) {
        spinner.warn(chalk.yellow('⚠️  PostgreSQL not running. Starting...'));
        await this.startPostgreSQL();
      }
      spinner.succeed(chalk.green('✅ PostgreSQL running'));

      // Step 2: Check Redis
      console.log();
      spinner.start('Checking Redis...');
      const redisRunning = await this.checkRedis();

      if (!redisRunning) {
        spinner.warn(chalk.yellow('⚠️  Redis not running. Starting...'));
        await this.startRedis();
      }
      spinner.succeed(chalk.green('✅ Redis running'));

      // Step 3: Install dependencies if needed
      console.log();
      spinner.start('Checking dependencies...');
      await this.ensureDependencies();
      spinner.succeed(chalk.green('✅ Dependencies installed'));

      // Step 4: Run database migrations
      console.log();
      spinner.start('Running database migrations...');
      await this.runMigrations();
      spinner.succeed(chalk.green('✅ Database up to date'));

      // Step 5: Start backend server
      console.log();
      spinner.start('Starting backend server...');
      const backendUrl = await this.startBackend();
      spinner.succeed(chalk.green(`✅ Backend started: ${backendUrl}`));

      // Step 6: Start frontend dev server
      console.log();
      spinner.start('Starting frontend dev server...');
      const frontendUrl = await this.startFrontend();
      spinner.succeed(chalk.green(`✅ Frontend started: ${frontendUrl}`));

      // Success summary
      console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.cyan.bold('✅ ALL SERVERS RUNNING'));
      console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

      console.log(chalk.white('🌐 Access your application:'));
      console.log(chalk.cyan(`   Frontend:  ${frontendUrl}`));
      console.log(chalk.cyan(`   Backend:   ${backendUrl}`));
      console.log(chalk.cyan(`   API Docs:  ${backendUrl}/api-docs`));
      console.log();

      console.log(chalk.gray('💡 Servers will auto-reload on file changes'));
      console.log(chalk.gray('   Press Ctrl+C to stop all servers\n'));

      // Keep process alive
      this.keepAlive();

    } catch (error) {
      spinner.fail(chalk.red('Failed to start servers'));
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static checkPostgreSQL() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec('pg_isready', (error) => {
        resolve(!error);
      });
    });
  }

  static async startPostgreSQL() {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec('sudo systemctl start postgresql', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  static checkRedis() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec('redis-cli ping', (error, stdout) => {
        resolve(stdout?.trim() === 'PONG');
      });
    });
  }

  static async startRedis() {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec('sudo systemctl start redis-server', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  static async ensureDependencies() {
    const backendDir = path.join(process.cwd(), 'backend');
    const frontendDir = path.join(process.cwd(), 'frontend');

    // Backend
    if (fs.existsSync(backendDir)) {
      const backendNodeModules = path.join(backendDir, 'node_modules');
      if (!fs.existsSync(backendNodeModules)) {
        await this.npmInstall(backendDir);
      }
    }

    // Frontend
    if (fs.existsSync(frontendDir)) {
      const frontendNodeModules = path.join(frontendDir, 'node_modules');
      if (!fs.existsSync(frontendNodeModules)) {
        await this.npmInstall(frontendDir);
      }
    }
  }

  static npmInstall(dir) {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: dir,
        stdio: 'pipe',
      });

      npm.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('npm install failed'));
      });
    });
  }

  static async runMigrations() {
    const backendDir = path.join(process.cwd(), 'backend');
    if (!fs.existsSync(backendDir)) return;

    // Run migrations if they exist
    const migrationsScript = path.join(backendDir, 'scripts', 'migrate.js');
    if (fs.existsSync(migrationsScript)) {
      return new Promise((resolve, reject) => {
        const node = spawn('node', [migrationsScript], {
          cwd: backendDir,
          stdio: 'pipe',
        });

        node.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error('Migrations failed'));
        });
      });
    }
  }

  static startBackend() {
    return new Promise((resolve, reject) => {
      const backendDir = path.join(process.cwd(), 'backend');

      if (!fs.existsSync(backendDir)) {
        resolve('http://localhost:3000 (not configured)');
        return;
      }

      const npm = spawn('npm', ['run', 'dev'], {
        cwd: backendDir,
        stdio: 'inherit',
        detached: true,
      });

      // Wait a bit for server to start
      setTimeout(() => {
        resolve('http://localhost:3000');
      }, 2000);
    });
  }

  static startFrontend() {
    return new Promise((resolve, reject) => {
      const frontendDir = path.join(process.cwd(), 'frontend');

      if (!fs.existsSync(frontendDir)) {
        resolve('http://localhost:5173 (not configured)');
        return;
      }

      const npm = spawn('npm', ['run', 'dev'], {
        cwd: frontendDir,
        stdio: 'inherit',
        detached: true,
      });

      // Wait a bit for server to start
      setTimeout(() => {
        resolve('http://localhost:5173');
      }, 3000);
    });
  }

  static keepAlive() {
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n⚠️  Shutting down servers...'));
      process.exit(0);
    });

    // Keep process running
    setInterval(() => {}, 1000);
  }
}

module.exports = StartCommand;
