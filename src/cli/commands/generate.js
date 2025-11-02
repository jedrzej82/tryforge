/**
 * GENERATE Command - AI-powered code generation
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const IntelligentGenerator = require('../../automation/intelligent-generator');
const path = require('path');
const fs = require('fs-extra');

class GenerateCommand {
  static async execute(type, description, options) {
    console.log(chalk.cyan.bold('\n🤖 AI Code Generation\n'));

    const generator = new IntelligentGenerator();
    const projectPath = options.path || process.cwd();

    try {
      switch (type) {
        case 'component':
          await this.generateComponent(generator, description, projectPath);
          break;
        case 'route':
          await this.generateRoute(generator, description, projectPath);
          break;
        case 'feature':
          await this.generateFeature(generator, description, projectPath);
          break;
        case 'test':
          await this.generateTest(generator, options.file, projectPath);
          break;
        default:
          await this.interactiveGenerate(generator, projectPath);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Generation failed: ${error.message}\n`));
      process.exit(1);
    }
  }

  static async generateComponent(generator, description, projectPath) {
    console.log(chalk.cyan(`Generating component: ${description}\n`));

    const code = await generator.claude.generateReactComponent(description, {
      styling: 'CSS Modules',
      typescript: false,
    });

    // Extract component name
    const nameMatch = description.match(/(\w+)\s+component/i);
    const name = nameMatch ? nameMatch[1] : 'NewComponent';

    // Save to project
    const filePath = path.join(projectPath, 'frontend', 'src', 'components', `${name}.jsx`);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, code);

    console.log(chalk.green(`\n✅ Component generated: ${filePath}\n`));
  }

  static async generateRoute(generator, description, projectPath) {
    console.log(chalk.cyan(`Generating API route: ${description}\n`));

    const code = await generator.claude.generateExpressRoute(description, {
      database: 'PostgreSQL',
      auth: 'JWT',
    });

    // Save to project
    const { routeName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'routeName',
        message: 'Route file name (without .js):',
        default: 'newRoute',
      },
    ]);

    const filePath = path.join(projectPath, 'backend', 'src', 'routes', `${routeName}.js`);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, code);

    console.log(chalk.green(`\n✅ Route generated: ${filePath}\n`));
  }

  static async generateFeature(generator, description, projectPath) {
    console.log(chalk.cyan(`Generating feature: ${description}\n`));

    // Get project context
    const project = await this.getProjectContext(projectPath);

    // Generate feature
    const result = await generator.generateFeature(
      { description },
      project
    );

    // Save all generated files
    console.log(chalk.cyan('\n📝 Saving files...\n'));

    for (const component of result.frontend) {
      const filePath = path.join(projectPath, 'frontend', component.path);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, component.code);
      console.log(chalk.green(`  ✅ ${component.path}`));
    }

    for (const route of result.backend) {
      const filePath = path.join(projectPath, 'backend', route.file);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, route.code);
      console.log(chalk.green(`  ✅ ${route.file}`));
    }

    console.log(chalk.green.bold('\n✅ Feature generated successfully!\n'));
  }

  static async generateTest(generator, filePath, projectPath) {
    console.log(chalk.cyan(`Generating tests for: ${filePath}\n`));

    const fullPath = path.join(projectPath, filePath);
    const code = await fs.readFile(fullPath, 'utf8');

    const testCode = await generator.claude.generateTests(code, 'unit');

    // Save test file
    const testPath = filePath.replace(/\.(jsx?|tsx?)$/, '.test.$1');
    const fullTestPath = path.join(projectPath, testPath);
    await fs.ensureDir(path.dirname(fullTestPath));
    await fs.writeFile(fullTestPath, testCode);

    console.log(chalk.green(`\n✅ Tests generated: ${testPath}\n`));
  }

  static async interactiveGenerate(generator, projectPath) {
    const { type } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What do you want to generate?',
        choices: [
          { name: 'React Component', value: 'component' },
          { name: 'API Route (Express)', value: 'route' },
          { name: 'Complete Feature', value: 'feature' },
          { name: 'Tests', value: 'test' },
        ],
      },
    ]);

    const { description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: `Describe the ${type}:`,
        validate: (input) => input.length > 5 || 'Please provide a detailed description',
      },
    ]);

    await this.execute(type, description, { path: projectPath });
  }

  static async getProjectContext(projectPath) {
    const packageJsonPath = path.join(projectPath, 'frontend', 'package.json');

    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      return {
        type: 'Full Stack Application',
        framework: 'React',
        database: 'PostgreSQL',
        styling: 'CSS Modules',
        existingComponents: await this.getExistingComponents(projectPath),
        existingRoutes: await this.getExistingRoutes(projectPath),
      };
    }

    return {
      type: 'Application',
      framework: 'React',
      database: 'PostgreSQL',
    };
  }

  static async getExistingComponents(projectPath) {
    const componentsDir = path.join(projectPath, 'frontend', 'src', 'components');

    if (await fs.pathExists(componentsDir)) {
      const files = await fs.readdir(componentsDir);
      return files.map(f => path.basename(f, path.extname(f)));
    }

    return [];
  }

  static async getExistingRoutes(projectPath) {
    const routesDir = path.join(projectPath, 'backend', 'src', 'routes');

    if (await fs.pathExists(routesDir)) {
      const files = await fs.readdir(routesDir);
      return files.map(f => `/api/${path.basename(f, '.js')}`);
    }

    return [];
  }
}

module.exports = GenerateCommand;
