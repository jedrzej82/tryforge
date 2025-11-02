/**
 * PREVIEW Command - Live preview with hot reload
 */

const chalk = require('chalk');
const LivePreview = require('../../automation/live-preview');
const path = require('path');

class PreviewCommand {
  static async execute(projectPath) {
    const targetPath = projectPath || process.cwd();

    console.log(chalk.cyan.bold('\n🎬 Starting Live Preview...\n'));
    console.log(chalk.gray(`Project: ${targetPath}\n`));

    const preview = new LivePreview(targetPath);

    try {
      await preview.start();

      // Keep running until user stops
      process.on('SIGINT', async () => {
        await preview.stop();
        process.exit(0);
      });

    } catch (error) {
      console.error(chalk.red(`\n❌ Preview failed: ${error.message}\n`));
      process.exit(1);
    }
  }
}

module.exports = PreviewCommand;
