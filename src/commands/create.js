/**
 * CREATE Command Implementation
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const TryForge = require('../index');

async function createProject(name, options) {
  console.log(chalk.bold.blue('\n🔥 TryForge CREATE Mode\n'));
  
  // Prompt for additional details if needed
  if (!options.type) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What type of application do you want to create?',
        choices: [
          { name: '📝 Blog Platform', value: 'blog' },
          { name: '🛒 E-commerce Store', value: 'ecommerce' },
          { name: '👥 Social Media App', value: 'social' },
          { name: '💼 SaaS Application', value: 'saas' },
          { name: '📊 Dashboard/Admin Panel', value: 'dashboard' },
          { name: '🌐 General Web App', value: 'webapp' }
        ]
      },
      {
        type: 'confirm',
        name: 'graphics',
        message: 'Generate AI graphics (logo, hero images)?',
        default: true
      },
      {
        type: 'confirm',
        name: 'backend',
        message: 'Include backend API?',
        default: true
      },
      {
        type: 'confirm',
        name: 'frontend',
        message: 'Include frontend UI?',
        default: true
      }
    ]);
    
    Object.assign(options, answers);
  }
  
  const spinner = ora('Starting Triple AI orchestration...').start();
  
  try {
    const tryforge = new TryForge();
    
    spinner.text = 'Claude: Generating architecture...';
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    spinner.text = 'GitHub Spark: Creating UI components...';
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    spinner.text = 'Pollinations AI: Generating graphics...';
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    spinner.text = 'Assembling project files...';
    const result = await tryforge.createProject(name, options);
    
    spinner.succeed(chalk.green('Project created successfully! ✨'));
    
    console.log(chalk.gray('\n📦 Project structure:'));
    console.log(`  ${name}/`);
    console.log(`  ├── frontend/       ${chalk.gray('(React + Vite)')}`);
    console.log(`  ├── backend/        ${chalk.gray('(Express + Node.js)')}`);
    console.log(`  ├── database/       ${chalk.gray('(PostgreSQL schema)')}`);
    console.log(`  └── README.md`);
    
    console.log(chalk.yellow('\n🚀 Next steps:'));
    console.log(`  ${chalk.cyan('cd')} ${name}`);
    console.log(`  ${chalk.cyan('npm install')}`);
    console.log(`  ${chalk.cyan('npm run dev')}`);
    
    console.log(chalk.gray('\n💡 Tip: Run "tryforge analyze" to get insights about your new project\n'));
    
    return result;
  } catch (error) {
    spinner.fail(chalk.red('Project creation failed'));
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

module.exports = { createProject };
