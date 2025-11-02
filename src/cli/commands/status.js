/**
 * STATUS Command - Shows system and project status
 */

const chalk = require('chalk');
const { checkService } = require('../../utils/system-check');

class StatusCommand {
  static async execute() {
    console.log(chalk.cyan.bold('\n📊 System Status\n'));

    // Check services
    const services = {
      postgresql: await checkService('postgresql'),
      redis: await checkService('redis'),
      nodejs: await checkService('node'),
      playwright: await checkService('playwright'),
    };

    console.log(chalk.white('Services:'));
    Object.entries(services).forEach(([name, status]) => {
      const icon = status ? '✅' : '❌';
      const color = status ? chalk.green : chalk.red;
      console.log(color(`  ${icon} ${name}: ${status ? 'Running' : 'Not running'}`));
    });

    console.log();
  }
}

module.exports = StatusCommand;
