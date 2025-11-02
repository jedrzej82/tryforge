/**
 * Autonomous Model System
 * Automatically discovers and generates missing database models
 */

const chalk = require('chalk');
const ora = require('ora');
const ModelDiscovery = require('./model-discovery');
const ModelGenerator = require('./model-generator');

// AI Provider imports
const ClaudeAPI = require('../ai-services/claude-api');
const OpenRouterAPI = require('../ai-services/openrouter-api');

class AutonomousModelSystem {
  constructor(options = {}) {
    // Initialize AI provider
    const aiProvider = process.env.AI_PROVIDER || 'claude';

    if (aiProvider === 'openrouter') {
      this.ai = new OpenRouterAPI();
      this.providerName = 'OpenRouter';
    } else {
      this.ai = new ClaudeAPI();
      this.providerName = 'Claude';
    }

    this.discovery = new ModelDiscovery(this.ai);
    this.generator = new ModelGenerator();

    this.options = {
      orm: options.orm || 'prisma',
      language: options.language || 'typescript',
      autoEnrich: options.autoEnrich !== false,
      generateMigrations: options.generateMigrations !== false,
      ...options
    };

    console.log(chalk.cyan(`🤖 Autonomous Model System initialized with ${this.providerName}`));
  }

  /**
   * Main entry point: Analyze requirements and generate all needed models
   * @param {Object} requirements - Application requirements
   * @param {string} projectPath - Project root path
   */
  async generateMissingModels(requirements, projectPath) {
    console.log(chalk.cyan('\n🔍 Starting autonomous model generation...\n'));

    try {
      // Step 1: Analyze existing project
      const projectAnalysis = await this.discovery.analyzeProject(projectPath);

      // Step 2: Discover required models from requirements
      const requiredModels = await this.discovery.discoverModels(requirements);

      // Step 3: Determine which models are missing
      console.log(chalk.cyan('\n📋 Checking existing models...\n'));
      const missingModels = await this.discovery.getMissingModels(
        requiredModels,
        projectPath
      );

      if (missingModels.length === 0) {
        console.log(chalk.green('\n✨ All required models already exist!\n'));
        return {
          success: true,
          generated: [],
          skipped: requiredModels.length,
          message: 'No models needed to be generated'
        };
      }

      console.log(chalk.yellow(`\n⚠️  Found ${missingModels.length} missing models\n`));

      // Step 4: Enrich models with AI if enabled
      let enrichedModels = missingModels;
      if (this.options.autoEnrich) {
        console.log(chalk.cyan('🧠 Enriching models with AI suggestions...\n'));
        enrichedModels = await this.enrichModels(missingModels, requirements);
      }

      // Step 5: Resolve dependencies (order models correctly)
      const orderedModels = this.discovery.resolveDependencies(enrichedModels);

      // Step 6: Generate report
      this.discovery.generateReport(orderedModels);

      // Step 7: Ask for confirmation (optional)
      if (this.options.interactive) {
        const confirmed = await this.confirmGeneration(orderedModels);
        if (!confirmed) {
          console.log(chalk.yellow('Model generation cancelled by user'));
          return { success: false, cancelled: true };
        }
      }

      // Step 8: Generate models
      const results = await this.generator.generateModels(
        orderedModels,
        projectPath,
        this.options
      );

      // Step 9: Summary
      this.printSummary(results);

      return {
        success: true,
        generated: results.filter(r => r.success && !r.skipped),
        skipped: results.filter(r => r.skipped),
        failed: results.filter(r => !r.success),
        models: orderedModels
      };
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      throw error;
    }
  }

  /**
   * Enrich models with AI suggestions
   */
  async enrichModels(models, requirements) {
    const enriched = [];

    for (const model of models) {
      const enrichedModel = await this.discovery.enrichModel(model, {
        appType: requirements.type,
        features: requirements.features
      });
      enriched.push(enrichedModel);
    }

    return enriched;
  }

  /**
   * Ask user for confirmation before generating
   */
  async confirmGeneration(models) {
    // For now, auto-confirm. In future, add interactive prompt
    return true;
  }

  /**
   * Print generation summary
   */
  printSummary(results) {
    console.log(chalk.cyan('\n📊 Generation Summary\n'));

    const successful = results.filter(r => r.success && !r.skipped);
    const skipped = results.filter(r => r.skipped);
    const failed = results.filter(r => !r.success);

    console.log(chalk.green(`  ✓ Generated: ${successful.length} models`));

    if (skipped.length > 0) {
      console.log(chalk.yellow(`  ⊘ Skipped: ${skipped.length} models (already exist)`));
    }

    if (failed.length > 0) {
      console.log(chalk.red(`  ✗ Failed: ${failed.length} models`));
      failed.forEach(f => {
        console.log(chalk.red(`    - ${f.model}: ${f.error}`));
      });
    }

    console.log('');

    if (successful.length > 0) {
      console.log(chalk.cyan('📝 Next steps:\n'));
      console.log(chalk.white('  1. Review generated models'));

      if (this.options.orm === 'prisma') {
        console.log(chalk.white('  2. Run: npx prisma generate'));
        console.log(chalk.white('  3. Run: npx prisma migrate dev --name init'));
      } else {
        console.log(chalk.white('  2. Run migrations'));
      }

      console.log(chalk.white('  3. Start implementing business logic\n'));
    }
  }

  /**
   * Generate models from a simple description (for quick prototyping)
   */
  async generateFromDescription(description, projectPath) {
    console.log(chalk.cyan(`\n🚀 Generating models from description...\n`));
    console.log(chalk.gray(`Description: "${description}"\n`));

    const spinner = ora('Analyzing description...').start();

    try {
      // Use AI to convert description to structured requirements
      const prompt = `Convert this application description into structured requirements:

Description: "${description}"

Return a JSON object with:
{
  "type": "app type (e.g., ecommerce, blog, social, saas)",
  "description": "detailed description",
  "features": ["feature1", "feature2", ...]
}

Only return the JSON, no explanations.`;

      const response = await this.ai.generateCode(prompt, {
        type: 'analysis',
        maxTokens: 2000
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse requirements from description');
      }

      const requirements = JSON.parse(jsonMatch[0]);

      spinner.succeed('Requirements analyzed');

      // Generate models based on requirements
      return await this.generateMissingModels(requirements, projectPath);
    } catch (error) {
      spinner.fail('Failed to analyze description');
      throw error;
    }
  }

  /**
   * Detect missing models during development
   * Useful for continuous development
   */
  async detectAndGenerateMissing(projectPath) {
    console.log(chalk.cyan('\n🔍 Detecting missing models in project...\n'));

    const spinner = ora('Analyzing codebase...').start();

    try {
      // Analyze codebase to find model references
      const referencedModels = await this.analyzeCodeForModelReferences(projectPath);

      spinner.text = 'Checking which models exist...';

      // Check which referenced models are missing
      const missing = [];
      for (const modelName of referencedModels) {
        const exists = await this.discovery.modelExists(modelName, projectPath);
        if (!exists) {
          missing.push({ name: modelName });
        }
      }

      if (missing.length === 0) {
        spinner.succeed('All referenced models exist');
        return { success: true, missing: [] };
      }

      spinner.warn(`Found ${missing.length} missing model(s): ${missing.map(m => m.name).join(', ')}`);

      // Generate missing models with AI help
      console.log(chalk.cyan('\n🤖 Generating missing models with AI...\n'));

      const generatedModels = [];

      for (const missingModel of missing) {
        const model = await this.generateModelFromName(missingModel.name, projectPath);
        generatedModels.push(model);
      }

      // Generate the models
      const results = await this.generator.generateModels(
        generatedModels,
        projectPath,
        this.options
      );

      this.printSummary(results);

      return {
        success: true,
        generated: results.filter(r => r.success),
        models: generatedModels
      };
    } catch (error) {
      spinner.fail('Detection failed');
      throw error;
    }
  }

  /**
   * Analyze code to find model references
   */
  async analyzeCodeForModelReferences(projectPath) {
    const fs = require('fs-extra');
    const path = require('path');
    const glob = require('glob');

    const codeFiles = glob.sync('**/*.{js,ts}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**']
    });

    const modelReferences = new Set();

    // Simple regex to find model imports/uses
    const patterns = [
      /from ['"].*\/models\/(\w+)['"]/g,
      /require\(['"].*\/models\/(\w+)['"]\)/g,
      /prisma\.(\w+)\./g,
      /models\.(\w+)\./g
    ];

    for (const file of codeFiles) {
      const filePath = path.join(projectPath, file);
      const content = await fs.readFile(filePath, 'utf8');

      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            // Capitalize first letter to match model naming convention
            const modelName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            modelReferences.add(modelName);
          }
        }
      });
    }

    return Array.from(modelReferences);
  }

  /**
   * Generate a model definition from just its name using AI
   */
  async generateModelFromName(modelName, projectPath) {
    const spinner = ora(`Analyzing ${modelName}...`).start();

    try {
      const prompt = `Create a complete database model definition for: ${modelName}

Based on common patterns and best practices, define:
1. All necessary fields with appropriate types
2. Validation rules
3. Indexes
4. Relationships to common models (if applicable)
5. Default values

Return as JSON with this structure:
{
  "name": "${modelName}",
  "purpose": "description",
  "fields": [
    { "name": "id", "type": "uuid", "primary": true },
    ...
  ],
  "relationships": [...],
  "indexes": [...],
  "validations": {...}
}`;

      const response = await this.ai.generateCode(prompt, {
        type: 'analysis',
        maxTokens: 2000
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Could not generate model definition for ${modelName}`);
      }

      const model = JSON.parse(jsonMatch[0]);

      spinner.succeed(`Generated definition for ${modelName}`);

      return model;
    } catch (error) {
      spinner.fail(`Failed to generate ${modelName}`);
      throw error;
    }
  }

  /**
   * Watch mode: continuously detect and generate missing models
   */
  async watch(projectPath) {
    console.log(chalk.cyan('\n👀 Watching for missing models...\n'));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    const chokidar = require('chokidar');

    // Watch code files
    const watcher = chokidar.watch('**/*.{js,ts}', {
      cwd: projectPath,
      ignored: ['node_modules/**', 'dist/**', 'build/**'],
      persistent: true
    });

    let timeout;

    watcher.on('change', () => {
      // Debounce checks
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          await this.detectAndGenerateMissing(projectPath);
        } catch (error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      }, 2000);
    });

    // Keep process alive
    return new Promise(() => {});
  }
}

module.exports = AutonomousModelSystem;
