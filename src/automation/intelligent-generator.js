/**
 * Intelligent Code Generator
 * Uses Claude API for smart, context-aware code generation
 */

const ClaudeAPI = require('../ai-services/claude-api');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { beautify } = require('js-beautify');

class IntelligentGenerator {
  constructor() {
    this.claude = new ClaudeAPI();
  }

  /**
   * Generate complete feature with AI
   * @param {Object} feature - Feature description
   * @param {Object} project - Project context
   */
  async generateFeature(feature, project) {
    const spinner = ora('Analyzing feature requirements...').start();

    try {
      // Step 1: Analyze what needs to be generated
      const analysis = await this.analyzeFeature(feature, project);
      spinner.text = 'Generating components...';

      // Step 2: Generate all components in parallel
      const results = await Promise.all([
        this.generateFrontend Components(analysis, project),
        this.generateBackendCode(analysis, project),
        this.generateDatabaseChanges(analysis, project),
        this.generateTests(analysis, project),
      ]);

      spinner.succeed('Feature generated successfully');

      return {
        frontend: results[0],
        backend: results[1],
        database: results[2],
        tests: results[3],
        analysis,
      };
    } catch (error) {
      spinner.fail('Feature generation failed');
      throw error;
    }
  }

  /**
   * Analyze feature requirements
   */
  async analyzeFeature(feature, project) {
    const prompt = `Analyze this feature request for a ${project.type} application:

Feature: ${feature.description}

Current project structure:
- Framework: ${project.framework}
- Database: ${project.database}
- Existing components: ${project.existingComponents?.join(', ') || 'none'}
- Existing API routes: ${project.existingRoutes?.join(', ') || 'none'}

Provide a detailed breakdown of what needs to be created:
1. New React components needed
2. New API endpoints needed
3. Database schema changes
4. Required tests
5. Dependencies to install
6. Integration points with existing code

Format as JSON.`;

    const result = await this.claude.generateCode(prompt, { type: 'analysis' });

    try {
      return JSON.parse(result);
    } catch {
      // Fallback structure
      return {
        components: [],
        endpoints: [],
        databaseChanges: [],
        tests: [],
        dependencies: [],
      };
    }
  }

  /**
   * Generate frontend components with streaming
   */
  async generateFrontendComponents(analysis, project) {
    const components = [];

    for (const comp of analysis.components || []) {
      console.log(chalk.cyan(`\n🎨 Generating ${comp.name}...\n`));

      let generatedCode = '';

      // Stream component generation
      const stream = this.claude.generateCodeStream(
        this.createComponentPrompt(comp, project),
        { type: 'react-component' }
      );

      for await (const chunk of stream) {
        process.stdout.write(chalk.gray(chunk));
        generatedCode += chunk;
      }

      // Beautify generated code
      const beautifiedCode = beautify(generatedCode, {
        indent_size: 2,
        space_in_empty_paren: true,
      });

      components.push({
        name: comp.name,
        code: beautifiedCode,
        path: `src/components/${comp.name}.jsx`,
      });
    }

    return components;
  }

  /**
   * Generate backend code
   */
  async generateBackendCode(analysis, project) {
    const endpoints = [];

    for (const endpoint of analysis.endpoints || []) {
      console.log(chalk.green(`\n🔧 Generating ${endpoint.path}...\n`));

      const code = await this.claude.generateExpressRoute(
        endpoint.description,
        {
          database: project.database,
          auth: project.auth,
          features: endpoint.features,
        }
      );

      endpoints.push({
        path: endpoint.path,
        code,
        file: `src/routes/${endpoint.resource}.js`,
      });
    }

    return endpoints;
  }

  /**
   * Generate database changes
   */
  async generateDatabaseChanges(analysis, project) {
    if (!analysis.databaseChanges || analysis.databaseChanges.length === 0) {
      return [];
    }

    console.log(chalk.blue('\n💾 Generating database migrations...\n'));

    const migrations = [];

    for (const change of analysis.databaseChanges) {
      const sql = await this.claude.generateCode(
        `Generate PostgreSQL migration for: ${change.description}`,
        { type: 'database-schema' }
      );

      migrations.push({
        name: change.name,
        sql,
        file: `sql/migrations/${Date.now()}_${change.name}.sql`,
      });
    }

    return migrations;
  }

  /**
   * Generate tests
   */
  async generateTests(analysis, project) {
    console.log(chalk.yellow('\n🧪 Generating tests...\n'));

    const tests = [];

    // Generate component tests
    for (const comp of analysis.components || []) {
      const testCode = await this.claude.generateTests(
        `Component: ${comp.name}\nProps: ${JSON.stringify(comp.props || {})}`,
        'unit'
      );

      tests.push({
        name: `${comp.name}.test.jsx`,
        code: testCode,
        path: `tests/components/${comp.name}.test.jsx`,
      });
    }

    return tests;
  }

  /**
   * Create component prompt
   */
  createComponentPrompt(comp, project) {
    return `Generate a production-ready React component:

Name: ${comp.name}
Description: ${comp.description}
Props: ${JSON.stringify(comp.props || {})}

Project Context:
- Styling: ${project.styling}
- Existing components: ${project.existingComponents?.join(', ')}

Requirements:
1. Use React hooks
2. Include loading and error states
3. Add PropTypes
4. Make it accessible (ARIA)
5. Add inline documentation
6. Handle edge cases

Generate complete, production-ready code.`;
  }

  /**
   * Auto-fix code errors
   */
  async autoFix(filePath, error) {
    console.log(chalk.yellow(`\n🔧 Auto-fixing error in ${filePath}...\n`));

    const code = await fs.readFile(filePath, 'utf8');

    const fixedCode = await this.claude.fixCodeError(code, error.message, {
      language: path.extname(filePath).slice(1),
      errorType: error.type || 'compilation',
    });

    // Backup original
    await fs.writeFile(`${filePath}.backup`, code);

    // Write fixed code
    await fs.writeFile(filePath, fixedCode);

    console.log(chalk.green(`✅ Fixed and saved to ${filePath}`));
    console.log(chalk.gray(`   Backup: ${filePath}.backup`));

    return fixedCode;
  }

  /**
   * Improve existing code
   */
  async improveCode(filePath, improvements) {
    console.log(chalk.cyan(`\n✨ Improving ${filePath}...\n`));

    const code = await fs.readFile(filePath, 'utf8');

    const improvedCode = await this.claude.improveCode(code, improvements, {
      framework: this.detectFramework(filePath),
    });

    // Backup original
    await fs.writeFile(`${filePath}.backup`, code);

    // Write improved code
    await fs.writeFile(filePath, improvedCode);

    console.log(chalk.green(`✅ Code improved`));

    return improvedCode;
  }

  /**
   * Detect framework from file
   */
  detectFramework(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('import React') || content.includes('from "react"')) {
      return 'React';
    }
    if (content.includes('express')) {
      return 'Express';
    }
    return 'JavaScript';
  }

  /**
   * Save generated files to project
   */
  async saveToProject(projectPath, files) {
    for (const file of files) {
      const fullPath = path.join(projectPath, file.path);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.code);
      console.log(chalk.green(`  ✅ ${file.path}`));
    }
  }
}

module.exports = IntelligentGenerator;
