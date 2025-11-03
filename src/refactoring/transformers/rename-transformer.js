/**
 * Rename Transformer
 * Handles renaming of variables, functions, classes, and files
 */

const fs = require('fs-extra');
const path = require('path');
const ASTUtils = require('../utils/ast-utils');
const ScopeAnalyzer = require('../utils/scope-analyzer');

class RenameTransformer {
  /**
   * Rename identifier in file
   * @param {string} filePath - File path
   * @param {string} oldName - Old name
   * @param {string} newName - New name
   * @returns {object} Rename result
   */
  static async renameInFile(filePath, oldName, newName) {
    try {
      const code = await fs.readFile(filePath, 'utf8');
      const result = this.renameInCode(code, oldName, newName);

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
      };
    }
  }

  /**
   * Rename identifier in code
   * @param {string} code - Source code
   * @param {string} oldName - Old name
   * @param {string} newName - New name
   * @returns {object} Rename result
   */
  static renameInCode(code, oldName, newName) {
    try {
      const ast = ASTUtils.parse(code);
      let renameCount = 0;

      // Find all occurrences and rename
      ASTUtils.traverse(ast, {
        Identifier(path) {
          if (path.node.name === oldName) {
            // Check if it's safe to rename in this scope
            const canRename = ScopeAnalyzer.canSafelyRename(
              path,
              oldName,
              newName
            );

            if (canRename.safe) {
              path.node.name = newName;
              renameCount++;
            }
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        renameCount,
        oldName,
        newName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Rename function
   * @param {string} code - Source code
   * @param {string} oldName - Old function name
   * @param {string} newName - New function name
   * @returns {object} Rename result
   */
  static renameFunction(code, oldName, newName) {
    try {
      const ast = ASTUtils.parse(code);
      let renameCount = 0;

      ASTUtils.traverse(ast, {
        FunctionDeclaration(path) {
          if (path.node.id?.name === oldName) {
            path.node.id.name = newName;
            renameCount++;
          }
        },

        // Rename all calls to the function
        CallExpression(path) {
          if (path.node.callee.name === oldName) {
            path.node.callee.name = newName;
            renameCount++;
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        renameCount,
        type: 'function',
        oldName,
        newName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Rename class
   * @param {string} code - Source code
   * @param {string} oldName - Old class name
   * @param {string} newName - New class name
   * @returns {object} Rename result
   */
  static renameClass(code, oldName, newName) {
    try {
      const ast = ASTUtils.parse(code);
      let renameCount = 0;

      ASTUtils.traverse(ast, {
        ClassDeclaration(path) {
          if (path.node.id?.name === oldName) {
            path.node.id.name = newName;
            renameCount++;
          }
        },

        // Rename instantiation
        NewExpression(path) {
          if (path.node.callee.name === oldName) {
            path.node.callee.name = newName;
            renameCount++;
          }
        },

        // Rename extends
        ClassDeclaration(path) {
          if (path.node.superClass?.name === oldName) {
            path.node.superClass.name = newName;
            renameCount++;
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        renameCount,
        type: 'class',
        oldName,
        newName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Rename variable
   * @param {string} code - Source code
   * @param {string} oldName - Old variable name
   * @param {string} newName - New variable name
   * @param {object} scope - Scope information (optional)
   * @returns {object} Rename result
   */
  static renameVariable(code, oldName, newName, scope = null) {
    try {
      const ast = ASTUtils.parse(code);
      let renameCount = 0;

      ASTUtils.traverse(ast, {
        enter(path) {
          if (path.node.type === 'Identifier' && path.node.name === oldName) {
            // Check scope if provided
            if (scope) {
              const binding = ScopeAnalyzer.findBinding(path, oldName);
              if (binding && binding.scope === scope) {
                path.node.name = newName;
                renameCount++;
              }
            } else {
              path.node.name = newName;
              renameCount++;
            }
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        renameCount,
        type: 'variable',
        oldName,
        newName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Rename property
   * @param {string} code - Source code
   * @param {string} oldName - Old property name
   * @param {string} newName - New property name
   * @returns {object} Rename result
   */
  static renameProperty(code, oldName, newName) {
    try {
      const ast = ASTUtils.parse(code);
      let renameCount = 0;

      ASTUtils.traverse(ast, {
        ObjectProperty(path) {
          if (path.node.key.name === oldName) {
            path.node.key.name = newName;
            renameCount++;
          }
        },

        MemberExpression(path) {
          if (path.node.property.name === oldName && !path.node.computed) {
            path.node.property.name = newName;
            renameCount++;
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        renameCount,
        type: 'property',
        oldName,
        newName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Rename across multiple files
   * @param {array} filePaths - File paths
   * @param {string} oldName - Old name
   * @param {string} newName - New name
   * @returns {object} Batch rename result
   */
  static async renameAcrossFiles(filePaths, oldName, newName) {
    const results = [];
    let totalRenamed = 0;

    for (const filePath of filePaths) {
      const result = await this.renameInFile(filePath, oldName, newName);
      results.push(result);

      if (result.success) {
        totalRenamed += result.renameCount;
      }
    }

    return {
      success: true,
      results,
      totalRenamed,
      filesChanged: results.filter((r) => r.success && r.renameCount > 0).length,
      oldName,
      newName,
    };
  }

  /**
   * Rename import
   * @param {string} code - Source code
   * @param {string} oldName - Old import name
   * @param {string} newName - New import name
   * @returns {object} Rename result
   */
  static renameImport(code, oldName, newName) {
    try {
      const ast = ASTUtils.parse(code);
      let renameCount = 0;

      ASTUtils.traverse(ast, {
        ImportDeclaration(path) {
          path.node.specifiers.forEach((spec) => {
            if (spec.local.name === oldName) {
              spec.local.name = newName;
              renameCount++;
            }
          });
        },

        // Rename all usages
        Identifier(path) {
          if (
            path.node.name === oldName &&
            path.key !== 'imported' &&
            path.key !== 'exported'
          ) {
            path.node.name = newName;
            renameCount++;
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        renameCount,
        type: 'import',
        oldName,
        newName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Rename file and update imports
   * @param {string} oldPath - Old file path
   * @param {string} newPath - New file path
   * @param {array} dependentFiles - Files that import this file
   * @returns {object} Rename result
   */
  static async renameFile(oldPath, newPath, dependentFiles = []) {
    try {
      // Rename the file
      await fs.move(oldPath, newPath);

      // Update imports in dependent files
      const oldRelative = path.basename(oldPath, path.extname(oldPath));
      const newRelative = path.basename(newPath, path.extname(newPath));

      const updateResults = [];

      for (const depFile of dependentFiles) {
        const code = await fs.readFile(depFile, 'utf8');
        const ast = ASTUtils.parse(code);
        let updated = false;

        ASTUtils.traverse(ast, {
          ImportDeclaration(path) {
            if (path.node.source.value.includes(oldRelative)) {
              path.node.source.value = path.node.source.value.replace(
                oldRelative,
                newRelative
              );
              updated = true;
            }
          },
        });

        if (updated) {
          const newCode = ASTUtils.generate(ast).code;
          await fs.writeFile(depFile, newCode, 'utf8');
          updateResults.push({ file: depFile, updated: true });
        }
      }

      return {
        success: true,
        oldPath,
        newPath,
        updatedFiles: updateResults,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Preview rename
   * @param {string} code - Source code
   * @param {string} oldName - Old name
   * @param {string} newName - New name
   * @returns {object} Preview result
   */
  static previewRename(code, oldName, newName) {
    const result = this.renameInCode(code, oldName, newName);

    if (result.success) {
      return {
        success: true,
        originalCode: code,
        newCode: result.code,
        changes: result.renameCount,
        diff: this.generateDiff(code, result.code),
      };
    }

    return result;
  }

  /**
   * Generate diff
   * @param {string} oldCode - Old code
   * @param {string} newCode - New code
   * @returns {string} Diff
   */
  static generateDiff(oldCode, newCode) {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const diff = [];

    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      if (oldLines[i] !== newLines[i]) {
        if (oldLines[i]) diff.push(`- ${oldLines[i]}`);
        if (newLines[i]) diff.push(`+ ${newLines[i]}`);
      }
    }

    return diff.join('\n');
  }
}

module.exports = RenameTransformer;
