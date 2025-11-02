/**
 * CONFIG Command Implementation
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

async function config(options) {
  const configPath = path.join(process.cwd(), '.tryforge', 'config.json');
  
  try {
    if (options.show) {
      // Show current configuration
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      console.log(chalk.bold.blue('\n⚙️  TryForge Configuration:\n'));
      console.log(JSON.stringify(config, null, 2));
      console.log();
      return;
    }
    
    // Update configuration
    let config = {};
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      // Config doesn't exist, create new one
      config = { tripleAI: {}, defaults: {} };
    }
    
    if (options.claudeKey) {
      config.tripleAI.claude = config.tripleAI.claude || {};
      config.tripleAI.claude.apiKey = options.claudeKey;
      console.log(chalk.green('✓ Claude API key updated'));
    }
    
    if (options.githubToken) {
      config.tripleAI.githubSpark = config.tripleAI.githubSpark || {};
      config.tripleAI.githubSpark.token = options.githubToken;
      console.log(chalk.green('✓ GitHub token updated'));
    }
    
    // Save updated config
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log(chalk.gray('\n💡 Configuration saved to .tryforge/config.json\n'));
    
  } catch (error) {
    console.error(chalk.red('❌ Configuration error:'), error.message);
    process.exit(1);
  }
}

module.exports = config;
