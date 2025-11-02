/**
 * ANALYZE Command - Analyzes codebase for issues and opportunities
 */

const chalk = require('chalk');
const ora = require('ora');
const Orchestrator = require('../../orchestrator');

class AnalyzeCommand {
  static async execute(type, options) {
    console.log(chalk.cyan.bold(`\n🔍 Analyzing: ${type}\n`));

    const spinner = ora('Scanning codebase...').start();

    try {
      const orchestrator = new Orchestrator({ mode: 'analyze' });
      const results = await orchestrator.analyze(type);

      spinner.succeed(chalk.green('✅ Analysis complete'));

      this.displayResults(type, results);

    } catch (error) {
      spinner.fail(chalk.red('❌ Analysis failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static displayResults(type, results) {
    console.log(chalk.white('\n📊 Analysis Results:\n'));

    if (results.issues) {
      console.log(chalk.red(`🔴 Critical: ${results.issues.critical.length}`));
      console.log(chalk.yellow(`🟠 Important: ${results.issues.important.length}`));
      console.log(chalk.gray(`🟡 Minor: ${results.issues.minor.length}\n`));
    }

    if (results.opportunities) {
      console.log(chalk.white('💡 Opportunities:'));
      results.opportunities.forEach(opp => {
        console.log(chalk.gray(`  - ${opp.title}: ${opp.impact}`));
      });
    }

    console.log();
  }
}

module.exports = AnalyzeCommand;
