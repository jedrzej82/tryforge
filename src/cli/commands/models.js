/**
 * Models Command
 * Autonomous model generation and management
 */

const chalk = require('chalk');
const AutonomousModelSystem = require('../../automation/autonomous-model-system');

class ModelsCommand {
  /**
   * Generate models from requirements
   */
  static async generate(options = {}) {
    try {
      const projectPath = options.path || process.cwd();

      console.log(chalk.cyan('🤖 TryForge Autonomous Model Generator\n'));

      // Initialize system
      const modelSystem = new AutonomousModelSystem({
        orm: options.orm || 'prisma',
        language: options.language || 'typescript',
        autoEnrich: options.enrich !== false,
        generateMigrations: options.migrations !== false,
        interactive: options.interactive || false
      });

      let result;

      // Different generation modes
      if (options.description) {
        // Generate from simple description
        result = await modelSystem.generateFromDescription(
          options.description,
          projectPath
        );
      } else if (options.requirements) {
        // Generate from structured requirements
        const requirements = require(options.requirements);
        result = await modelSystem.generateMissingModels(
          requirements,
          projectPath
        );
      } else {
        console.error(chalk.red('❌ Please provide --description or --requirements'));
        process.exit(1);
      }

      if (result.success) {
        console.log(chalk.green('\n✨ Model generation completed successfully!\n'));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Detect and generate missing models
   */
  static async detect(options = {}) {
    try {
      const projectPath = options.path || process.cwd();

      console.log(chalk.cyan('🔍 TryForge Model Detection\n'));

      const modelSystem = new AutonomousModelSystem({
        orm: options.orm || 'prisma',
        language: options.language || 'typescript',
        autoEnrich: true,
        generateMigrations: options.migrations !== false
      });

      const result = await modelSystem.detectAndGenerateMissing(projectPath);

      if (result.success) {
        if (result.generated.length > 0) {
          console.log(chalk.green('\n✨ Missing models generated successfully!\n'));
        } else {
          console.log(chalk.green('\n✨ No missing models detected!\n'));
        }
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Watch mode - continuously detect and generate
   */
  static async watch(options = {}) {
    try {
      const projectPath = options.path || process.cwd();

      const modelSystem = new AutonomousModelSystem({
        orm: options.orm || 'prisma',
        language: options.language || 'typescript',
        autoEnrich: true,
        generateMigrations: options.migrations !== false
      });

      await modelSystem.watch(projectPath);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * List existing models
   */
  static async list(options = {}) {
    try {
      const projectPath = options.path || process.cwd();
      const fs = require('fs-extra');
      const path = require('path');

      console.log(chalk.cyan('📋 Existing Models\n'));

      // Check different locations
      const locations = [
        { path: 'prisma/schema.prisma', type: 'prisma' },
        { path: 'backend/src/models', type: 'directory' },
        { path: 'backend/src/entities', type: 'directory' },
        { path: 'src/models', type: 'directory' }
      ];

      let foundModels = [];

      for (const loc of locations) {
        const fullPath = path.join(projectPath, loc.path);

        if (await fs.pathExists(fullPath)) {
          if (loc.type === 'prisma') {
            const schema = await fs.readFile(fullPath, 'utf8');
            const models = Array.from(schema.matchAll(/model\s+(\w+)\s*\{/g))
              .map(m => m[1]);

            if (models.length > 0) {
              console.log(chalk.white(`📄 Prisma Schema (${loc.path}):`));
              models.forEach((model, idx) => {
                console.log(chalk.gray(`  ${idx + 1}. ${model}`));
              });
              foundModels = foundModels.concat(models);
            }
          } else if (loc.type === 'directory') {
            const files = await fs.readdir(fullPath);
            const models = files
              .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
              .map(f => path.basename(f, path.extname(f)));

            if (models.length > 0) {
              console.log(chalk.white(`\n📁 ${loc.path}:`));
              models.forEach((model, idx) => {
                console.log(chalk.gray(`  ${idx + 1}. ${model}`));
              });
              foundModels = foundModels.concat(models);
            }
          }
        }
      }

      if (foundModels.length === 0) {
        console.log(chalk.yellow('No models found in project'));
      } else {
        console.log(chalk.cyan(`\nTotal: ${foundModels.length} models`));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Analyze model structure and suggest improvements
   */
  static async analyze(options = {}) {
    try {
      const projectPath = options.path || process.cwd();

      console.log(chalk.cyan('🔬 Analyzing Models\n'));

      const modelSystem = new AutonomousModelSystem({
        orm: options.orm || 'prisma'
      });

      const analysis = await modelSystem.discovery.analyzeProject(projectPath);

      console.log(chalk.white(`Existing models: ${analysis.existingModels.length}`));

      if (analysis.existingModels.length > 0) {
        console.log(chalk.gray('\nModels found:'));
        analysis.existingModels.forEach((model, idx) => {
          console.log(chalk.gray(`  ${idx + 1}. ${model}`));
        });
      }

      // TODO: Add more analysis (relationships, indexes, performance suggestions)
      console.log(chalk.cyan('\n✨ Analysis complete\n'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  }
}

module.exports = ModelsCommand;
