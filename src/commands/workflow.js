/**
 * WORKFLOW Command Implementation
 * Launch Workflow Builder
 */

const chalk = require('chalk');
const ora = require('ora');

async function workflowCommand(options) {
  console.log(chalk.bold.blue('\n🔄 TryForge Workflow Builder\n'));
  
  const spinner = ora('Starting Workflow Builder...').start();
  
  try {
    const WorkflowBuilder = require('../core/workflow-builder');
    
    const builder = new WorkflowBuilder({
      port: options.port || 5556
    });
    
    spinner.text = 'Starting server...';
    await builder.start();
    
    spinner.succeed(chalk.green('Workflow Builder ready!'));
    
    console.log(chalk.yellow('\n📊 Workflow Builder Interface:'));
    console.log(`  ${chalk.cyan('URL:')} http://localhost:${options.port || 5556}/workflow-builder`);
    
    console.log(chalk.yellow('\n✨ Features:'));
    console.log('  • Visual drag-and-drop workflow designer');
    console.log('  • 30+ built-in nodes (triggers, actions, logic)');
    console.log('  • Real-time workflow execution');
    console.log('  • Advanced integrations (Slack, Stripe, AWS, etc.)');
    console.log('  • AI-powered data processing');
    console.log('  • Webhook triggers');
    console.log('  • Scheduled workflows (cron)');
    console.log('  • Database operations');
    console.log('  • HTTP requests');
    console.log('  • Conditional logic');
    console.log('  • Data transformations');
    console.log('  • Loop & merge operations');
    console.log('  • Export/import workflows');
    
    console.log(chalk.yellow('\n🚀 Node Categories:'));
    console.log('  • Triggers: webhook, schedule, email, database, file-watcher');
    console.log('  • Actions: HTTP, database, email, SMS, AI, web-scraper');
    console.log('  • Logic: IF, switch, loop, merge, split');
    console.log('  • Integrations: Slack, Discord, Telegram, Stripe, AWS, Google');
    console.log('  • Advanced: ML predict, image process, PDF generate, cache');
    
    console.log(chalk.gray('\n💡 Tip: Open the URL in your browser to start building workflows\n'));
    console.log(chalk.yellow('Press Ctrl+C to stop the builder\n'));
    
    // Keep process running
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n👋 Closing Workflow Builder...'));
      process.exit(0);
    });
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to start Workflow Builder'));
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

module.exports = { workflowCommand };
