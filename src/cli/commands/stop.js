/**
 * STOP Command - Stops all running servers
 */

const chalk = require('chalk');
const ora = require('ora');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class StopCommand {
  static async execute() {
    console.log(chalk.cyan.bold('\n⏹️  Stopping all servers...\n'));

    const spinner = ora('Finding running processes...').start();

    try {
      // Stop backend (port 3000)
      spinner.text = 'Stopping backend server...';
      await this.killPort(3000);
      spinner.succeed(chalk.green('✅ Backend stopped'));

      // Stop frontend (port 5173)
      console.log();
      spinner.start('Stopping frontend dev server...');
      await this.killPort(5173);
      spinner.succeed(chalk.green('✅ Frontend stopped'));

      // Optionally stop PostgreSQL and Redis
      const { shouldStopServices } = await this.askStopServices();

      if (shouldStopServices) {
        console.log();
        spinner.start('Stopping PostgreSQL...');
        await this.stopPostgreSQL();
        spinner.succeed(chalk.green('✅ PostgreSQL stopped'));

        console.log();
        spinner.start('Stopping Redis...');
        await this.stopRedis();
        spinner.succeed(chalk.green('✅ Redis stopped'));
      }

      console.log(chalk.green.bold('\n✅ All servers stopped\n'));

    } catch (error) {
      spinner.fail(chalk.red('Failed to stop some servers'));
      console.error(chalk.red(`\nError: ${error.message}`));
    }
  }

  static async killPort(port) {
    try {
      // Find process on port
      const { stdout } = await execPromise(`lsof -ti:${port}`);

      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');

        // Kill all processes
        for (const pid of pids) {
          await execPromise(`kill -9 ${pid}`);
        }
      }
    } catch (error) {
      // Port not in use or already stopped
    }
  }

  static async stopPostgreSQL() {
    try {
      await execPromise('sudo systemctl stop postgresql');
    } catch (error) {
      // Already stopped or not installed
    }
  }

  static async stopRedis() {
    try {
      await execPromise('sudo systemctl stop redis-server');
    } catch (error) {
      // Already stopped or not installed
    }
  }

  static async askStopServices() {
    const inquirer = require('inquirer');

    return await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldStopServices',
        message: 'Also stop PostgreSQL and Redis?',
        default: false,
      },
    ]);
  }
}

module.exports = StopCommand;
