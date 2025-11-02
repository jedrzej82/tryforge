/**
 * REFACTOR Command - Improves existing applications
 * Uses Triple AI for parallel improvements
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const Orchestrator = require('../../orchestrator');
const MemorySystem = require('../../memory');

class RefactorCommand {
  static async execute(description, options) {
    console.log(chalk.cyan.bold('\n🔧 REFACTOR MODE activated\n'));

    const spinner = ora('Analyzing codebase...').start();

    try {
      // Step 1: Scan codebase
      const orchestrator = new Orchestrator({
        mode: 'refactor',
        description,
        options,
      });

      const analysis = await orchestrator.analyzeCodebase();
      spinner.succeed(chalk.green('✅ Codebase analyzed'));

      // Step 2: Generate improvement proposals
      spinner.start('Generating improvement proposals...');
      const proposals = await orchestrator.generateProposals(analysis);
      spinner.succeed(chalk.green('✅ Proposals generated'));

      // Step 3: Display proposals and get user selection
      const selectedImprovements = await this.selectImprovements(proposals);

      if (selectedImprovements.length === 0) {
        console.log(chalk.yellow('\n⚠️  No improvements selected. Exiting.'));
        return;
      }

      // Step 4: Execute improvements (Triple AI parallel)
      console.log(chalk.cyan('\n⚡ Executing improvements with Triple AI...\n'));

      const results = await orchestrator.executeRefactoring(selectedImprovements);

      // Step 5: Testing
      console.log(chalk.cyan('\n🧪 Running regression tests...\n'));
      const testResults = await orchestrator.test(results);

      // Step 6: Display before/after comparison
      this.displayComparison(analysis, results);

      // Step 7: Record in memory
      await MemorySystem.recordRefactoring({
        description,
        analysis,
        proposals,
        selectedImprovements,
        results,
      });

      console.log(chalk.green.bold('\n✅ Refactoring complete!\n'));

    } catch (error) {
      spinner.fail(chalk.red('❌ Refactoring failed'));
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  static async selectImprovements(proposals) {
    console.log(chalk.white('\n📋 Improvement Proposals:\n'));

    const choices = proposals.map((proposal, index) => ({
      name: `${proposal.category}: ${proposal.title} (Est. ${proposal.estimatedTime})`,
      value: index,
      checked: proposal.priority === 'high',
    }));

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select improvements to apply:',
        choices,
      },
    ]);

    return selected.map(index => proposals[index]);
  }

  static displayComparison(before, after) {
    console.log(chalk.white('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white('📊 IMPROVEMENT RESULTS'));
    console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    if (after.performance) {
      console.log(chalk.white('⚡ PERFORMANCE:'));
      console.log(chalk.gray(`  Load Time: ${before.performance.loadTime} → ${after.performance.loadTime} (${after.performance.loadTimeImprovement})`));
      console.log(chalk.gray(`  API Response: ${before.performance.apiResponse} → ${after.performance.apiResponse} (${after.performance.apiImprovement})\n`));
    }

    if (after.ui) {
      console.log(chalk.white('🎨 UI/UX:'));
      console.log(chalk.gray(`  Components Modernized: ${after.ui.componentsModernized}`));
      console.log(chalk.gray(`  Mobile Score: ${before.ui.mobileScore} → ${after.ui.mobileScore}\n`));
    }

    console.log(chalk.white('📁 Changes:'));
    console.log(chalk.gray(`  Files Modified: ${after.stats.modified}`));
    console.log(chalk.gray(`  Files Added: ${after.stats.added}`));
    console.log();
  }
}

module.exports = RefactorCommand;
