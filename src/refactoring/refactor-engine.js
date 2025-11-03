/**
 * Refactor Engine
 * Main engine for code refactoring operations
 */

const fs = require('fs-extra');
const path = require('path');
const ASTUtils = require('./utils/ast-utils');
const ScopeAnalyzer = require('./utils/scope-analyzer');

class RefactorEngine {
  constructor(options = {}) {
    this.options = {
      preserveFormatting: true,
      validateAfter: true,
      createBackup: true,
      ...options,
    };

    this.history = [];
    this.maxHistorySize = 50;
  }

  /**
   * Parse file to AST
   * @param {string} filePath - File path
   * @returns {object} AST and metadata
   */
  async parseFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf8');
      const ast = ASTUtils.parse(code);

      return {
        filePath,
        code,
        ast,
        valid: true,
      };
    } catch (error) {
      return {
        filePath,
        code: null,
        ast: null,
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Apply transformation to AST
   * @param {object} ast - Abstract Syntax Tree
   * @param {function} transformer - Transformation function
   * @returns {object} Transformed AST
   */
  transform(ast, transformer) {
    try {
      const clonedAst = ASTUtils.cloneNode(ast);
      transformer(clonedAst);
      return clonedAst;
    } catch (error) {
      throw new Error(`Transformation failed: ${error.message}`);
    }
  }

  /**
   * Generate code from AST
   * @param {object} ast - Abstract Syntax Tree
   * @returns {string} Generated code
   */
  generateCode(ast) {
    const result = ASTUtils.generate(ast, {
      retainLines: this.options.preserveFormatting,
      comments: true,
    });

    return result.code;
  }

  /**
   * Validate code
   * @param {string} code - Source code
   * @returns {object} Validation result
   */
  validateCode(code) {
    try {
      ASTUtils.parse(code);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Create backup of file
   * @param {string} filePath - File path
   * @returns {string} Backup path
   */
  async createBackup(filePath) {
    const backupPath = `${filePath}.backup`;
    await fs.copy(filePath, backupPath);
    return backupPath;
  }

  /**
   * Apply refactoring to file
   * @param {string} filePath - File path
   * @param {function} transformer - Transformation function
   * @returns {object} Refactoring result
   */
  async refactorFile(filePath, transformer) {
    try {
      // Create backup if enabled
      let backupPath = null;
      if (this.options.createBackup) {
        backupPath = await this.createBackup(filePath);
      }

      // Parse file
      const parsed = await this.parseFile(filePath);
      if (!parsed.valid) {
        throw new Error(`Failed to parse ${filePath}: ${parsed.error}`);
      }

      // Apply transformation
      const transformedAst = this.transform(parsed.ast, transformer);

      // Generate code
      const newCode = this.generateCode(transformedAst);

      // Validate if enabled
      if (this.options.validateAfter) {
        const validation = this.validateCode(newCode);
        if (!validation.valid) {
          throw new Error(`Generated code is invalid: ${validation.error}`);
        }
      }

      // Write file
      await fs.writeFile(filePath, newCode, 'utf8');

      // Add to history
      this.addToHistory({
        filePath,
        backupPath,
        originalCode: parsed.code,
        newCode,
        timestamp: new Date(),
      });

      return {
        success: true,
        filePath,
        backupPath,
        changes: this.calculateChanges(parsed.code, newCode),
      };
    } catch (error) {
      return {
        success: false,
        filePath,
        error: error.message,
      };
    }
  }

  /**
   * Apply refactoring to multiple files
   * @param {array} filePaths - File paths
   * @param {function} transformer - Transformation function
   * @returns {array} Results
   */
  async refactorFiles(filePaths, transformer) {
    const results = [];

    for (const filePath of filePaths) {
      const result = await this.refactorFile(filePath, transformer);
      results.push(result);
    }

    return results;
  }

  /**
   * Preview refactoring without applying
   * @param {string} filePath - File path
   * @param {function} transformer - Transformation function
   * @returns {object} Preview result
   */
  async previewRefactoring(filePath, transformer) {
    try {
      const parsed = await this.parseFile(filePath);
      if (!parsed.valid) {
        throw new Error(`Failed to parse ${filePath}: ${parsed.error}`);
      }

      const transformedAst = this.transform(parsed.ast, transformer);
      const newCode = this.generateCode(transformedAst);

      return {
        success: true,
        filePath,
        originalCode: parsed.code,
        newCode,
        changes: this.calculateChanges(parsed.code, newCode),
        diff: this.generateDiff(parsed.code, newCode),
      };
    } catch (error) {
      return {
        success: false,
        filePath,
        error: error.message,
      };
    }
  }

  /**
   * Calculate changes between original and new code
   * @param {string} originalCode - Original code
   * @param {string} newCode - New code
   * @returns {object} Changes
   */
  calculateChanges(originalCode, newCode) {
    const originalLines = originalCode.split('\n');
    const newLines = newCode.split('\n');

    return {
      linesAdded: Math.max(0, newLines.length - originalLines.length),
      linesRemoved: Math.max(0, originalLines.length - newLines.length),
      linesChanged: this.countChangedLines(originalLines, newLines),
      totalLines: newLines.length,
    };
  }

  /**
   * Count changed lines
   * @param {array} originalLines - Original lines
   * @param {array} newLines - New lines
   * @returns {number} Number of changed lines
   */
  countChangedLines(originalLines, newLines) {
    let changed = 0;
    const maxLength = Math.max(originalLines.length, newLines.length);

    for (let i = 0; i < maxLength; i++) {
      if (originalLines[i] !== newLines[i]) {
        changed++;
      }
    }

    return changed;
  }

  /**
   * Generate diff
   * @param {string} originalCode - Original code
   * @param {string} newCode - New code
   * @returns {string} Diff
   */
  generateDiff(originalCode, newCode) {
    const originalLines = originalCode.split('\n');
    const newLines = newCode.split('\n');
    const diff = [];

    const maxLength = Math.max(originalLines.length, newLines.length);

    for (let i = 0; i < maxLength; i++) {
      if (originalLines[i] !== newLines[i]) {
        if (originalLines[i]) {
          diff.push(`- ${originalLines[i]}`);
        }
        if (newLines[i]) {
          diff.push(`+ ${newLines[i]}`);
        }
      }
    }

    return diff.join('\n');
  }

  /**
   * Undo last refactoring
   * @returns {object} Undo result
   */
  async undo() {
    if (this.history.length === 0) {
      return {
        success: false,
        error: 'No refactoring to undo',
      };
    }

    const last = this.history.pop();

    try {
      await fs.writeFile(last.filePath, last.originalCode, 'utf8');

      return {
        success: true,
        filePath: last.filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Add to history
   * @param {object} entry - History entry
   */
  addToHistory(entry) {
    this.history.push(entry);

    // Keep history size limited
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Get history
   * @returns {array} History
   */
  getHistory() {
    return this.history;
  }

  /**
   * Restore from backup
   * @param {string} filePath - File path
   * @returns {object} Restore result
   */
  async restoreFromBackup(filePath) {
    const backupPath = `${filePath}.backup`;

    try {
      if (!(await fs.pathExists(backupPath))) {
        throw new Error('Backup file not found');
      }

      await fs.copy(backupPath, filePath);

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze code
   * @param {string} filePath - File path
   * @returns {object} Analysis result
   */
  async analyzeFile(filePath) {
    const parsed = await this.parseFile(filePath);
    if (!parsed.valid) {
      return {
        success: false,
        error: parsed.error,
      };
    }

    return {
      success: true,
      filePath,
      functions: ASTUtils.findFunctions(parsed.ast),
      variables: ASTUtils.findVariables(parsed.ast),
      imports: ASTUtils.findImports(parsed.ast),
      exports: ASTUtils.findExports(parsed.ast),
      classes: ASTUtils.findClasses(parsed.ast),
      nodeCount: ASTUtils.countNodes(parsed.ast),
    };
  }

  /**
   * Batch refactor with rollback
   * @param {array} operations - Refactoring operations
   * @returns {object} Batch result
   */
  async batchRefactor(operations) {
    const results = [];
    const backups = [];

    try {
      for (const operation of operations) {
        const result = await this.refactorFile(
          operation.filePath,
          operation.transformer
        );

        results.push(result);

        if (!result.success) {
          throw new Error(`Failed to refactor ${operation.filePath}`);
        }

        backups.push(result.backupPath);
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      // Rollback all changes
      for (const backup of backups) {
        if (backup) {
          const originalPath = backup.replace('.backup', '');
          await fs.copy(backup, originalPath);
        }
      }

      return {
        success: false,
        error: error.message,
        results,
      };
    }
  }
}

module.exports = RefactorEngine;
