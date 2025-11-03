#!/usr/bin/env node

/**
 * Code Refactor Command
 * CLI commands for code refactoring and analysis tools
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

// Analyzers
const CodeAnalyzer = require('../../refactoring/analyzers/code-analyzer');
const DependencyAnalyzer = require('../../refactoring/analyzers/dependency-analyzer');
const TypeAnalyzer = require('../../refactoring/analyzers/type-analyzer');
const SecurityAnalyzer = require('../../refactoring/analyzers/security-analyzer');

// Transformers
const RenameTransformer = require('../../refactoring/transformers/rename-transformer');
const ExtractTransformer = require('../../refactoring/transformers/extract-transformer');
const InlineTransformer = require('../../refactoring/transformers/inline-transformer');
const MoveTransformer = require('../../refactoring/transformers/move-transformer');
const ModernizeTransformer = require('../../refactoring/transformers/modernize-transformer');

// Formatters
const CodeFormatter = require('../../refactoring/formatters/code-formatter');
const ImportOrganizer = require('../../refactoring/formatters/import-organizer');

// Reporters
const ComplexityReporter = require('../../refactoring/reporters/complexity-reporter');
const DuplicationReporter = require('../../refactoring/reporters/duplication-reporter');
const DependencyReporter = require('../../refactoring/reporters/dependency-reporter');

// Main refactor engine
const RefactorEngine = require('../../refactoring/refactor-engine');

const program = new Command();

program
  .name('tryforge code-refactor')
  .description('Advanced code refactoring and analysis tools')
  .version('1.0.0');

/**
 * Analyze code command
 */
program
  .command('analyze [path]')
  .description('Analyze code complexity and quality')
  .option('-f, --format <format>', 'Output format (text, json, markdown, html)', 'text')
  .option('-t, --threshold <number>', 'Complexity threshold', '10')
  .option('--no-complexity', 'Skip complexity analysis')
  .option('--no-duplication', 'Skip duplication analysis')
  .option('--no-dependencies', 'Skip dependency analysis')
  .option('--no-security', 'Skip security analysis')
  .action(async (targetPath, options) => {
    const spinner = ora('Analyzing code...').start();

    try {
      const absPath = path.resolve(process.cwd(), targetPath || '.');
      const files = await findJavaScriptFiles(absPath);

      if (files.length === 0) {
        spinner.fail('No JavaScript/TypeScript files found');
        return;
      }

      spinner.text = `Analyzing ${files.length} files...`;

      const results = {
        complexity: [],
        duplication: [],
        dependencies: null,
        security: [],
      };

      // Analyze each file
      for (const file of files) {
        if (options.complexity) {
          const analysis = await CodeAnalyzer.analyzeFile(file);
          if (analysis.success) {
            results.complexity.push({ file, ...analysis });
          }
        }

        if (options.security) {
          const secAnalysis = await SecurityAnalyzer.analyzeFile(file);
          if (secAnalysis.success) {
            results.security.push({ file, ...secAnalysis });
          }
        }
      }

      // Dependency analysis (project-wide)
      if (options.dependencies) {
        const depAnalysis = await DependencyAnalyzer.analyzeProject(absPath);
        results.dependencies = depAnalysis;
      }

      spinner.succeed('Analysis complete');

      // Display results
      console.log('');

      if (options.complexity && results.complexity.length > 0) {
        const allComplexity = results.complexity.flatMap((r) => r.complexity || []);
        const allLongFunctions = results.complexity.flatMap(
          (r) => r.longFunctions || []
        );
        const allDeepNesting = results.complexity.flatMap((r) => r.deepNesting || []);

        const report = ComplexityReporter.generateReport(
          {
            complexity: allComplexity,
            longFunctions: allLongFunctions,
            deepNesting: allDeepNesting,
          },
          { format: options.format }
        );
        console.log(report);
      }

      if (options.dependencies && results.dependencies) {
        const report = DependencyReporter.generateReport(results.dependencies, {
          format: options.format,
        });
        console.log(report);
      }

      if (options.security && results.security.length > 0) {
        const allVulnerabilities = results.security.flatMap(
          (r) => r.vulnerabilities || []
        );
        const allSecrets = results.security.flatMap((r) => r.hardcodedSecrets || []);

        if (allVulnerabilities.length > 0 || allSecrets.length > 0) {
          console.log(chalk.bold.red('\n🔒 Security Issues Found:'));
          console.log(chalk.red('━'.repeat(60)));

          allVulnerabilities.forEach((vuln) => {
            console.log(
              chalk.yellow(`\n⚠️  ${vuln.message} [${vuln.severity}]`)
            );
          });

          allSecrets.forEach((secret) => {
            console.log(
              chalk.red(`\n🔑 ${secret.message} [${secret.severity}]`)
            );
            console.log(chalk.gray(`    Line ${secret.line}: ${secret.preview}`));
          });
        }
      }
    } catch (error) {
      spinner.fail(`Analysis failed: ${error.message}`);
    }
  });

/**
 * Rename command
 */
program
  .command('rename <oldName> <newName> [path]')
  .description('Rename variable, function, or class')
  .option('-t, --type <type>', 'Type: variable, function, class, property', 'variable')
  .option('-p, --preview', 'Preview changes without applying')
  .action(async (oldName, newName, targetPath, options) => {
    const spinner = ora(`Renaming ${oldName} to ${newName}...`).start();

    try {
      const absPath = path.resolve(process.cwd(), targetPath || '.');
      const files = await findJavaScriptFiles(absPath);

      if (options.preview) {
        // Preview mode
        for (const file of files) {
          const code = await fs.readFile(file, 'utf8');
          const result = RenameTransformer.renameInCode(code, oldName, newName);

          if (result.success && result.renameCount > 0) {
            console.log(
              chalk.yellow(`\n${file}: ${result.renameCount} occurrences`)
            );
          }
        }
        spinner.info('Preview complete (no changes made)');
      } else {
        // Apply changes
        const result = await RenameTransformer.renameAcrossFiles(
          files,
          oldName,
          newName
        );

        spinner.succeed(
          `Renamed ${oldName} to ${newName} (${result.totalRenamed} occurrences in ${result.filesChanged} files)`
        );
      }
    } catch (error) {
      spinner.fail(`Rename failed: ${error.message}`);
    }
  });

/**
 * Extract command
 */
program
  .command('extract <type> <name>')
  .description('Extract function, component, or constant')
  .option('-f, --file <file>', 'File path')
  .option('-s, --start <line>', 'Start line')
  .option('-e, --end <line>', 'End line')
  .action(async (type, name, options) => {
    const spinner = ora(`Extracting ${type}...`).start();

    try {
      if (!options.file) {
        throw new Error('File path is required (use -f or --file)');
      }

      const filePath = path.resolve(process.cwd(), options.file);
      const code = await fs.readFile(filePath, 'utf8');

      let result;

      switch (type) {
        case 'function':
          if (!options.start || !options.end) {
            throw new Error('Start and end lines are required for function extraction');
          }
          result = ExtractTransformer.extractFunction(
            code,
            parseInt(options.start),
            parseInt(options.end),
            name
          );
          break;

        case 'variable':
        case 'constant':
          result = ExtractTransformer.extractConstant(code, name, name);
          break;

        default:
          throw new Error(`Unknown extraction type: ${type}`);
      }

      if (result.success) {
        await fs.writeFile(filePath, result.code, 'utf8');
        spinner.succeed(`Extracted ${type} '${name}'`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      spinner.fail(`Extract failed: ${error.message}`);
    }
  });

/**
 * Modernize command
 */
program
  .command('modernize [path]')
  .description('Modernize code to ES6+')
  .option('--no-var-to-const', 'Skip var to const/let conversion')
  .option('--no-arrow-functions', 'Skip arrow function conversion')
  .option('--no-template-literals', 'Skip template literal conversion')
  .option('-p, --preview', 'Preview changes')
  .action(async (targetPath, options) => {
    const spinner = ora('Modernizing code...').start();

    try {
      const absPath = path.resolve(process.cwd(), targetPath || '.');
      const files = await findJavaScriptFiles(absPath);

      let totalTransformations = 0;

      for (const file of files) {
        const code = await fs.readFile(file, 'utf8');
        const result = ModernizeTransformer.modernize(code, {
          varToConst: options.varToConst !== false,
          arrowFunctions: options.arrowFunctions !== false,
          templateLiterals: options.templateLiterals !== false,
        });

        if (result.success && result.transformations.length > 0) {
          if (!options.preview) {
            await fs.writeFile(file, result.code, 'utf8');
          }

          totalTransformations += result.transformations.length;

          console.log(
            chalk.green(`\n✓ ${path.relative(process.cwd(), file)}`)
          );
          console.log(
            chalk.gray(`  ${result.transformations.length} transformations`)
          );
        }
      }

      if (options.preview) {
        spinner.info(
          `Preview complete: ${totalTransformations} transformations (no changes made)`
        );
      } else {
        spinner.succeed(`Modernized ${files.length} files with ${totalTransformations} transformations`);
      }
    } catch (error) {
      spinner.fail(`Modernize failed: ${error.message}`);
    }
  });

/**
 * Format command
 */
program
  .command('format [path]')
  .description('Format code with Prettier and ESLint')
  .option('--no-prettier', 'Skip Prettier formatting')
  .option('--no-eslint', 'Skip ESLint auto-fix')
  .option('-c, --check', 'Check formatting without fixing')
  .action(async (targetPath, options) => {
    const spinner = ora('Formatting code...').start();

    try {
      const absPath = path.resolve(process.cwd(), targetPath || '.');
      const files = await findJavaScriptFiles(absPath);

      const formatter = new CodeFormatter({
        usePrettier: options.prettier !== false,
        useESLint: options.eslint !== false,
      });

      let formatted = 0;
      let checked = 0;

      for (const file of files) {
        if (options.check) {
          const code = await fs.readFile(file, 'utf8');
          const result = await formatter.checkFormat(code, file);

          if (result.needsFormatting) {
            console.log(chalk.yellow(`✗ ${path.relative(process.cwd(), file)}`));
            formatted++;
          }
          checked++;
        } else {
          const result = await formatter.formatFile(file);

          if (result.success) {
            console.log(chalk.green(`✓ ${path.relative(process.cwd(), file)}`));
            formatted++;
          }
        }
      }

      if (options.check) {
        if (formatted === 0) {
          spinner.succeed('All files are properly formatted');
        } else {
          spinner.warn(
            `${formatted} file(s) need formatting out of ${checked} checked`
          );
        }
      } else {
        spinner.succeed(`Formatted ${formatted} file(s)`);
      }
    } catch (error) {
      spinner.fail(`Format failed: ${error.message}`);
    }
  });

/**
 * Complexity command
 */
program
  .command('complexity [path]')
  .description('Analyze code complexity')
  .option('-f, --format <format>', 'Output format', 'text')
  .option('-t, --threshold <number>', 'Complexity threshold', '10')
  .action(async (targetPath, options) => {
    const spinner = ora('Analyzing complexity...').start();

    try {
      const absPath = path.resolve(process.cwd(), targetPath || '.');
      const files = await findJavaScriptFiles(absPath);

      const allResults = [];

      for (const file of files) {
        const analysis = await CodeAnalyzer.analyzeFile(file);
        if (analysis.success) {
          allResults.push(analysis);
        }
      }

      const allComplexity = allResults.flatMap((r) => r.complexity || []);
      const allLongFunctions = allResults.flatMap((r) => r.longFunctions || []);
      const allDeepNesting = allResults.flatMap((r) => r.deepNesting || []);

      spinner.succeed('Analysis complete');

      const report = ComplexityReporter.generateReport(
        {
          complexity: allComplexity,
          longFunctions: allLongFunctions,
          deepNesting: allDeepNesting,
        },
        { format: options.format, threshold: parseInt(options.threshold) }
      );

      console.log(report);
    } catch (error) {
      spinner.fail(`Complexity analysis failed: ${error.message}`);
    }
  });

/**
 * Duplicates command
 */
program
  .command('duplicates [path]')
  .description('Find code duplication')
  .option('-f, --format <format>', 'Output format', 'text')
  .option('-s, --similarity <number>', 'Minimum similarity %', '80')
  .action(async (targetPath, options) => {
    const spinner = ora('Finding duplicates...').start();

    try {
      const absPath = path.resolve(process.cwd(), targetPath || '.');
      const files = await findJavaScriptFiles(absPath);

      const allDuplicates = [];

      for (const file of files) {
        const analysis = await CodeAnalyzer.analyzeFile(file);
        if (analysis.success && analysis.duplication) {
          allDuplicates.push(...analysis.duplication);
        }
      }

      spinner.succeed('Analysis complete');

      const report = DuplicationReporter.generateReport(
        { duplication: allDuplicates },
        {
          format: options.format,
          minSimilarity: parseInt(options.similarity),
        }
      );

      console.log(report);
    } catch (error) {
      spinner.fail(`Duplication analysis failed: ${error.message}`);
    }
  });

/**
 * Unused command
 */
program
  .command('unused [path]')
  .description('Find unused code')
  .action(async (targetPath) => {
    const spinner = ora('Finding unused code...').start();

    try {
      const absPath = path.resolve(process.cwd(), targetPath || '.');
      const files = await findJavaScriptFiles(absPath);

      console.log(chalk.bold.cyan('\n🔍 Unused Code Report'));
      console.log(chalk.cyan('━'.repeat(60)));

      let totalUnused = 0;

      for (const file of files) {
        const analysis = await CodeAnalyzer.analyzeFile(file);

        if (analysis.success && analysis.deadCode?.length > 0) {
          console.log(chalk.yellow(`\n${path.relative(process.cwd(), file)}:`));

          analysis.deadCode.forEach((dead) => {
            console.log(chalk.gray(`  • ${dead.message}`));
            if (dead.location) {
              console.log(
                chalk.dim(`    Line ${dead.location.start.line}`)
              );
            }
            totalUnused++;
          });
        }
      }

      spinner.succeed(`Found ${totalUnused} unused code blocks`);
    } catch (error) {
      spinner.fail(`Unused code analysis failed: ${error.message}`);
    }
  });

/**
 * Organize imports command
 */
program
  .command('organize-imports [path]')
  .description('Organize and sort imports')
  .option('--no-remove-unused', 'Keep unused imports')
  .option('--no-sort', 'Skip sorting')
  .action(async (targetPath, options) => {
    const spinner = ora('Organizing imports...').start();

    try {
      const absPath = path.resolve(process.cwd(), targetPath || '.');
      const files = await findJavaScriptFiles(absPath);

      let organized = 0;

      for (const file of files) {
        const result = await ImportOrganizer.organizeImportsInFile(file, {
          removeUnused: options.removeUnused !== false,
          sortImports: options.sort !== false,
        });

        if (result.success) {
          console.log(
            chalk.green(
              `✓ ${path.relative(process.cwd(), file)} (removed ${
                result.removed
              }, organized ${result.organized})`
            )
          );
          organized++;
        }
      }

      spinner.succeed(`Organized imports in ${organized} file(s)`);
    } catch (error) {
      spinner.fail(`Organize imports failed: ${error.message}`);
    }
  });

/**
 * Find JavaScript files
 * @param {string} searchPath - Path to search
 * @returns {array} File paths
 */
async function findJavaScriptFiles(searchPath) {
  return new Promise((resolve, reject) => {
    const stats = fs.statSync(searchPath);

    if (stats.isFile()) {
      resolve([searchPath]);
    } else {
      glob(
        '**/*.{js,jsx,ts,tsx}',
        {
          cwd: searchPath,
          ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
          absolute: true,
        },
        (err, files) => {
          if (err) reject(err);
          else resolve(files);
        }
      );
    }
  });
}

module.exports = program;

// If run directly
if (require.main === module) {
  program.parse(process.argv);
}
