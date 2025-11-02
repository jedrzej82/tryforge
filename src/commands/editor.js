/**
 * EDITOR Command Implementation
 * Launch Visual Editor for project
 */

const chalk = require('chalk');
const ora = require('ora');
const path = require('path');

async function editorCommand(projectPath = '.', options) {
  console.log(chalk.bold.blue('\n🎨 TryForge Visual Editor\n'));
  
  const spinner = ora('Starting Visual Editor...').start();
  
  try {
    const fullPath = path.resolve(projectPath);
    const VisualEditor = require('../core/visual-editor');
    
    const editor = new VisualEditor({
      port: options.port || 5555
    });
    
    spinner.text = 'Loading project...';
    const projectId = await editor.loadProject(fullPath);
    
    spinner.text = 'Starting server...';
    await editor.start();
    
    spinner.succeed(chalk.green('Visual Editor ready!'));
    
    console.log(chalk.yellow('\n📊 Editor Interface:'));
    console.log(`  ${chalk.cyan('URL:')} http://localhost:${options.port || 5555}/editor`);
    console.log(`  ${chalk.cyan('Project:')} ${fullPath}`);
    console.log(`  ${chalk.cyan('Project ID:')} ${projectId}`);
    
    console.log(chalk.yellow('\n✨ Features:'));
    console.log('  • Visual element editing');
    console.log('  • Color scheme customization');
    console.log('  • Text content editing');
    console.log('  • Real-time preview');
    console.log('  • Individual element properties');
    console.log('  • Live code export');
    
    console.log(chalk.gray('\n💡 Tip: Open the URL in your browser to start editing\n'));
    console.log(chalk.yellow('Press Ctrl+C to stop the editor\n'));
    
    // Keep process running
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n👋 Closing Visual Editor...'));
      process.exit(0);
    });
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to start Visual Editor'));
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

module.exports = { editorCommand };
