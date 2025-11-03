/**
 * Code Formatter
 * Integrates with Prettier and ESLint for code formatting
 */

const fs = require('fs-extra');
const path = require('path');

class CodeFormatter {
  constructor(options = {}) {
    this.options = {
      usePrettier: true,
      useESLint: true,
      prettierConfig: null,
      eslintConfig: null,
      ...options,
    };
  }

  /**
   * Format code using Prettier
   * @param {string} code - Source code
   * @param {string} filePath - File path (for parser detection)
   * @returns {object} Format result
   */
  async formatWithPrettier(code, filePath = null) {
    try {
      // In production, this would use the actual prettier package
      // For now, we'll simulate prettier formatting
      const prettier = this.loadPrettier();

      if (!prettier) {
        return {
          success: false,
          error: 'Prettier not installed',
        };
      }

      const options = await this.loadPrettierConfig(filePath);
      const parser = this.detectParser(filePath);

      const formatted = prettier.format(code, {
        parser,
        ...options,
      });

      return {
        success: true,
        code: formatted,
        formatter: 'prettier',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Load Prettier module
   * @returns {object|null} Prettier module
   */
  loadPrettier() {
    try {
      return require('prettier');
    } catch {
      return null;
    }
  }

  /**
   * Load Prettier config
   * @param {string} filePath - File path
   * @returns {object} Prettier config
   */
  async loadPrettierConfig(filePath) {
    if (this.options.prettierConfig) {
      return this.options.prettierConfig;
    }

    const defaultConfig = {
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 80,
      arrowParens: 'always',
      endOfLine: 'lf',
    };

    try {
      const prettier = this.loadPrettier();
      if (prettier && filePath) {
        const config = await prettier.resolveConfig(filePath);
        return config || defaultConfig;
      }
    } catch {
      // Ignore errors, use default config
    }

    return defaultConfig;
  }

  /**
   * Detect parser from file path
   * @param {string} filePath - File path
   * @returns {string} Parser name
   */
  detectParser(filePath) {
    if (!filePath) return 'babel';

    const ext = path.extname(filePath);

    const parserMap = {
      '.js': 'babel',
      '.jsx': 'babel',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.json': 'json',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less',
      '.md': 'markdown',
      '.html': 'html',
      '.yaml': 'yaml',
      '.yml': 'yaml',
    };

    return parserMap[ext] || 'babel';
  }

  /**
   * Format code using ESLint
   * @param {string} code - Source code
   * @param {string} filePath - File path
   * @returns {object} Format result
   */
  async formatWithESLint(code, filePath = null) {
    try {
      const eslint = this.loadESLint();

      if (!eslint) {
        return {
          success: false,
          error: 'ESLint not installed',
        };
      }

      const config = await this.loadESLintConfig(filePath);
      const { ESLint } = eslint;

      const eslintInstance = new ESLint({
        useEslintrc: false,
        baseConfig: config,
        fix: true,
      });

      // ESLint requires a file path for some operations
      const tempFile = filePath || 'temp.js';

      const results = await eslintInstance.lintText(code, {
        filePath: tempFile,
      });

      if (results[0]?.output) {
        return {
          success: true,
          code: results[0].output,
          formatter: 'eslint',
          fixedIssues: results[0].fixableErrorCount + results[0].fixableWarningCount,
        };
      }

      return {
        success: true,
        code,
        formatter: 'eslint',
        fixedIssues: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Load ESLint module
   * @returns {object|null} ESLint module
   */
  loadESLint() {
    try {
      return require('eslint');
    } catch {
      return null;
    }
  }

  /**
   * Load ESLint config
   * @param {string} filePath - File path
   * @returns {object} ESLint config
   */
  async loadESLintConfig(filePath) {
    if (this.options.eslintConfig) {
      return this.options.eslintConfig;
    }

    const defaultConfig = {
      env: {
        es2021: true,
        node: true,
      },
      extends: ['eslint:recommended'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off',
      },
    };

    try {
      if (filePath) {
        const configPath = await this.findESLintConfig(path.dirname(filePath));
        if (configPath) {
          const config = await fs.readJson(configPath);
          return config;
        }
      }
    } catch {
      // Ignore errors, use default config
    }

    return defaultConfig;
  }

  /**
   * Find ESLint config file
   * @param {string} dir - Directory to search
   * @returns {string|null} Config file path
   */
  async findESLintConfig(dir) {
    const configFiles = [
      '.eslintrc.json',
      '.eslintrc.js',
      '.eslintrc.yml',
      '.eslintrc',
    ];

    for (const file of configFiles) {
      const configPath = path.join(dir, file);
      if (await fs.pathExists(configPath)) {
        return configPath;
      }
    }

    // Check parent directory
    const parent = path.dirname(dir);
    if (parent !== dir) {
      return this.findESLintConfig(parent);
    }

    return null;
  }

  /**
   * Format code (using both Prettier and ESLint)
   * @param {string} code - Source code
   * @param {string} filePath - File path
   * @returns {object} Format result
   */
  async format(code, filePath = null) {
    let formatted = code;
    const results = {
      success: true,
      formatters: [],
    };

    // Apply ESLint first
    if (this.options.useESLint) {
      const eslintResult = await this.formatWithESLint(formatted, filePath);
      if (eslintResult.success) {
        formatted = eslintResult.code;
        results.formatters.push('eslint');
        results.eslintFixedIssues = eslintResult.fixedIssues;
      }
    }

    // Apply Prettier
    if (this.options.usePrettier) {
      const prettierResult = await this.formatWithPrettier(formatted, filePath);
      if (prettierResult.success) {
        formatted = prettierResult.code;
        results.formatters.push('prettier');
      }
    }

    results.code = formatted;
    return results;
  }

  /**
   * Format file
   * @param {string} filePath - File path
   * @returns {object} Format result
   */
  async formatFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf8');
      const result = await this.format(code, filePath);

      if (result.success) {
        await fs.writeFile(filePath, result.code, 'utf8');
      }

      return {
        ...result,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        filePath,
      };
    }
  }

  /**
   * Format multiple files
   * @param {array} filePaths - File paths
   * @returns {array} Format results
   */
  async formatFiles(filePaths) {
    const results = [];

    for (const filePath of filePaths) {
      const result = await this.formatFile(filePath);
      results.push(result);
    }

    return results;
  }

  /**
   * Check if code needs formatting
   * @param {string} code - Source code
   * @param {string} filePath - File path
   * @returns {object} Check result
   */
  async checkFormat(code, filePath = null) {
    const formatted = await this.format(code, filePath);

    return {
      needsFormatting: formatted.code !== code,
      originalCode: code,
      formattedCode: formatted.code,
    };
  }

  /**
   * Get formatting diff
   * @param {string} code - Source code
   * @param {string} filePath - File path
   * @returns {object} Diff result
   */
  async getFormattingDiff(code, filePath = null) {
    const formatted = await this.format(code, filePath);

    if (formatted.code === code) {
      return {
        hasDiff: false,
        diff: null,
      };
    }

    const diff = this.generateDiff(code, formatted.code);

    return {
      hasDiff: true,
      diff,
      originalLines: code.split('\n').length,
      formattedLines: formatted.code.split('\n').length,
    };
  }

  /**
   * Generate diff
   * @param {string} oldCode - Old code
   * @param {string} newCode - New code
   * @returns {string} Diff
   */
  generateDiff(oldCode, newCode) {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const diff = [];

    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      if (oldLines[i] !== newLines[i]) {
        if (oldLines[i]) diff.push(`- ${oldLines[i]}`);
        if (newLines[i]) diff.push(`+ ${newLines[i]}`);
      } else if (oldLines[i]) {
        diff.push(`  ${oldLines[i]}`);
      }
    }

    return diff.join('\n');
  }

  /**
   * Format with custom rules
   * @param {string} code - Source code
   * @param {object} rules - Custom rules
   * @returns {object} Format result
   */
  async formatWithCustomRules(code, rules) {
    const formatter = new CodeFormatter({
      prettierConfig: rules.prettier || null,
      eslintConfig: rules.eslint || null,
    });

    return formatter.format(code);
  }
}

module.exports = CodeFormatter;
