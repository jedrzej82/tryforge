/**
 * CREATE Command - Creates new applications from description
 * Uses Triple AI: Claude (orchestrator) + GitHub Spark (UI) + Pollinations (graphics)
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const Orchestrator = require('../../orchestrator');
const MemorySystem = require('../../memory');
const { validateProjectName } = require('../../utils/validators');

class CreateCommand {
  /**
   * Execute CREATE command
   * @param {string} description - Application description
   * @param {Object} options - Command options
   */
  static async execute(description, options) {
    console.log(chalk.cyan.bold('\n🚀 CREATE MODE activated\n'));

    // If no description provided, start interactive mode
    if (!description) {
      description = await this.interactiveMode();
    }

    console.log(chalk.white(`📋 Analyzing requirements: "${description}"\n`));

    const spinner = ora('Initializing Triple AI system...').start();

    try {
      // Step 1: Initialize Orchestrator (Claude)
      const orchestrator = new Orchestrator({
        mode: 'create',
        description,
        options,
      });

      // Step 2: Analyze and plan
      spinner.text = 'Analyzing requirements...';
      const analysis = await orchestrator.analyzeRequirements(description);

      spinner.succeed(chalk.green('✅ Requirements analyzed'));
      this.displayAnalysis(analysis);

      spinner.start('Planning architecture...');
      const architecture = await orchestrator.planArchitecture(analysis);

      spinner.succeed(chalk.green('✅ Architecture planned'));
      this.displayArchitecture(architecture);

      // Step 3: Generate project name
      const projectName = await this.getProjectName(analysis);

      // Step 4: Execute Triple AI generation (parallel)
      console.log(chalk.cyan('\n⚡ Starting parallel generation with Triple AI...\n'));

      const results = await orchestrator.executeTripleAI({
        analysis,
        architecture,
        projectName,
      });

      // Step 5: Integration
      console.log(chalk.cyan('\n🔧 Integrating all components...\n'));
      spinner.start('Connecting frontend to backend...');

      await orchestrator.integrate(results);

      spinner.succeed(chalk.green('✅ Integration complete'));

      // Step 6: Testing
      console.log(chalk.cyan('\n🧪 Running tests...\n'));
      spinner.start('Testing application...');

      const testResults = await orchestrator.test(results);

      if (testResults.success) {
        spinner.succeed(chalk.green('✅ All tests passed'));
      } else {
        spinner.warn(chalk.yellow(`⚠️  Some tests failed: ${testResults.failed} failed`));
      }

      // Step 7: Local deployment
      console.log(chalk.cyan('\n🚀 Deploying locally...\n'));
      spinner.start('Starting servers...');

      const deployResult = await orchestrator.deploy(results);

      spinner.succeed(chalk.green('✅ Application deployed'));

      // Step 8: Record in memory
      await MemorySystem.recordCreation({
        description,
        options,
        analysis,
        architecture,
        results,
        projectName,
      });

      // Step 9: Display summary
      this.displaySuccess(projectName, deployResult, results);

    } catch (error) {
      spinner.fail(chalk.red('❌ Creation failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      console.error(chalk.gray(error.stack));
      process.exit(1);
    }
  }

  /**
   * Interactive mode - asks user questions
   */
  static async interactiveMode() {
    console.log(chalk.cyan('Starting interactive mode...\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'appType',
        message: 'What type of application?',
        choices: [
          { name: 'Blog/Content Platform', value: 'blog' },
          { name: 'E-commerce Store', value: 'ecommerce' },
          { name: 'Social Network', value: 'social' },
          { name: 'Project Management Tool', value: 'project-management' },
          { name: 'Booking System', value: 'booking' },
          { name: 'Custom (describe yourself)', value: 'custom' },
        ],
      },
      {
        type: 'input',
        name: 'customDescription',
        message: 'Describe your application:',
        when: (answers) => answers.appType === 'custom',
        validate: (input) => input.trim().length > 5 || 'Description must be at least 5 characters',
      },
      {
        type: 'input',
        name: 'details',
        message: 'Any specific details or features?',
        when: (answers) => answers.appType !== 'custom',
      },
    ]);

    if (answers.appType === 'custom') {
      return answers.customDescription;
    }

    const baseDescriptions = {
      blog: 'Blog platform with posts, categories, and comments',
      ecommerce: 'E-commerce store with products, cart, and checkout',
      social: 'Social media platform with posts, comments, and friends',
      'project-management': 'Project management tool with tasks, boards, and teams',
      booking: 'Booking system with calendar, reservations, and payments',
    };

    let description = baseDescriptions[answers.appType];
    if (answers.details) {
      description += ` - ${answers.details}`;
    }

    return description;
  }

  /**
   * Display analysis results
   */
  static displayAnalysis(analysis) {
    console.log(chalk.white('\n📊 Analysis Results:\n'));
    console.log(chalk.gray(`  Type: ${analysis.type}`));
    console.log(chalk.gray(`  Complexity: ${analysis.complexity}`));
    console.log(chalk.gray(`  Features: ${analysis.features.join(', ')}`));
    console.log(chalk.gray(`  Tech Stack: ${analysis.techStack.join(', ')}`));
    console.log();
  }

  /**
   * Display architecture plan
   */
  static displayArchitecture(architecture) {
    console.log(chalk.white('\n🏗️  Architecture Plan:\n'));
    console.log(chalk.gray(`  Database Tables: ${architecture.database.tables.length}`));
    console.log(chalk.gray(`  API Endpoints: ${architecture.api.endpoints.length}`));
    console.log(chalk.gray(`  Frontend Components: ${architecture.frontend.components.length}`));
    console.log(chalk.gray(`  Graphics Needed: ${architecture.graphics.items.length}`));
    console.log();
  }

  /**
   * Get project name from user
   */
  static async getProjectName(analysis) {
    const suggested = analysis.suggestedName || 'my-app';

    const { projectName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: suggested,
        validate: validateProjectName,
      },
    ]);

    return projectName;
  }

  /**
   * Display success summary
   */
  static displaySuccess(projectName, deployResult, results) {
    console.log(chalk.green.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green.bold(`🎉 ${projectName.toUpperCase()} CREATED SUCCESSFULLY!`));
    console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    console.log(chalk.white('📊 Project Stats:'));
    console.log(chalk.gray(`   - Total files: ${results.stats.totalFiles}`));
    console.log(chalk.gray(`   - Components: ${results.stats.components}`));
    console.log(chalk.gray(`   - API endpoints: ${results.stats.endpoints}`));
    console.log(chalk.gray(`   - Database tables: ${results.stats.tables}`));
    console.log(chalk.gray(`   - Custom graphics: ${results.stats.graphics}`));
    console.log(chalk.gray(`   - Time taken: ${results.stats.duration}\n`));

    console.log(chalk.white('🌐 Access your app:'));
    console.log(chalk.cyan(`   Frontend: ${deployResult.frontendUrl}`));
    console.log(chalk.cyan(`   Backend:  ${deployResult.backendUrl}`));
    console.log(chalk.cyan(`   Database: ${deployResult.databaseUrl}\n`));

    console.log(chalk.white('📚 Documentation:'));
    console.log(chalk.gray(`   - API docs: ${deployResult.backendUrl}/api-docs`));
    console.log(chalk.gray(`   - README: ./${projectName}/README.md`));
    console.log(chalk.gray(`   - Architecture: ./${projectName}/docs/ARCHITECTURE.md\n`));

    console.log(chalk.white('✨ What\'s next?'));
    console.log(chalk.gray('   - Customize the design: tryforge refactor "improve UI"'));
    console.log(chalk.gray('   - Add features: tryforge refactor "add [feature]"'));
    console.log(chalk.gray('   - Deploy: tryforge build && tryforge deploy'));
    console.log();
  }
}

module.exports = CreateCommand;
