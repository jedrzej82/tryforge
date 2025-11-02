/**
 * INIT Command Implementation
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

async function init() {
  console.log(chalk.bold.blue('\n🔥 Initializing TryForge...\n'));
  
  try {
    // Create .tryforge directory
    const tryforgeDir = path.join(process.cwd(), '.tryforge');
    await fs.mkdir(tryforgeDir, { recursive: true });
    
    // Create config file
    const config = {
      version: '1.0.0',
      tripleAI: {
        claude: { enabled: true },
        githubSpark: { enabled: true },
        pollinations: { enabled: true }
      },
      defaults: {
        projectType: 'webapp',
        generateGraphics: true,
        includeFrontend: true,
        includeBackend: true
      }
    };
    
    await fs.writeFile(
      path.join(tryforgeDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );
    
    // Create .env.example
    const envExample = `# TryForge Configuration

# Claude API
CLAUDE_API_KEY=your_claude_api_key_here

# GitHub
GITHUB_TOKEN=your_github_token_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis (for caching and queues)
REDIS_URL=redis://localhost:6379
`;
    
    await fs.writeFile(path.join(process.cwd(), '.env.example'), envExample);
    
    console.log(chalk.green('✅ TryForge initialized successfully!\n'));
    console.log(chalk.gray('Created:'));
    console.log('  • .tryforge/config.json');
    console.log('  • .env.example');
    
    console.log(chalk.yellow('\n📝 Next steps:'));
    console.log('  1. Copy .env.example to .env');
    console.log('  2. Add your API keys to .env');
    console.log('  3. Run: tryforge create my-app');
    
    console.log(chalk.gray('\n💡 Tip: Use "tryforge config --show" to view current settings\n'));
    
  } catch (error) {
    console.error(chalk.red('❌ Initialization failed:'), error.message);
    process.exit(1);
  }
}

module.exports = init;
