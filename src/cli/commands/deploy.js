/**
 * DEPLOY Command - Deploy to cloud platforms
 */

const chalk = require('chalk');
const DeploymentManager = require('../../automation/deployment-manager');

class DeployCommand {
  static async execute(platform, options) {
    const projectPath = options.path || process.cwd();

    console.log(chalk.cyan.bold('\n🚀 DEPLOYMENT\n'));

    const manager = new DeploymentManager(projectPath);

    try {
      const result = await manager.deploy(platform);

      if (result.success) {
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green.bold('✅ DEPLOYMENT SUCCESSFUL'));
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        if (result.url) {
          console.log(chalk.white('🌐 Live URL: ') + chalk.cyan.underline(result.url));
          console.log(chalk.white('📱 Platform: ') + chalk.cyan(result.platform));
          console.log();
        }

        if (result.manual) {
          console.log(chalk.yellow('⚠️  Please complete manual steps above'));
        }
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Deployment failed: ${error.message}\n`));
      process.exit(1);
    }
  }

  static async status(platform, options) {
    const projectPath = options.path || process.cwd();
    const manager = new DeploymentManager(projectPath);

    try {
      await manager.getStatus(platform);
    } catch (error) {
      console.error(chalk.red(`\n❌ Failed: ${error.message}\n`));
    }
  }
}

module.exports = DeployCommand;
