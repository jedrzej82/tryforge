/**
 * Move Transformer
 * Handles moving functions, classes, and code between files
 */

const fs = require('fs-extra');
const path = require('path');
const ASTUtils = require('../utils/ast-utils');

class MoveTransformer {
  /**
   * Move function to another file
   * @param {string} sourceFile - Source file path
   * @param {string} targetFile - Target file path
   * @param {string} functionName - Function name to move
   * @returns {object} Move result
   */
  static async moveFunction(sourceFile, targetFile, functionName) {
    try {
      const sourceCode = await fs.readFile(sourceFile, 'utf8');
      const sourceAst = ASTUtils.parse(sourceCode);
      let functionNode = null;
      let functionPath = null;

      // Find and extract the function
      ASTUtils.traverse(sourceAst, {
        FunctionDeclaration(path) {
          if (path.node.id?.name === functionName) {
            functionNode = path.node;
            functionPath = path;
          }
        },
      });

      if (!functionNode) {
        throw new Error(`Function ${functionName} not found in ${sourceFile}`);
      }

      // Remove from source
      functionPath.remove();
      const newSourceCode = ASTUtils.generate(sourceAst).code;

      // Add to target
      let targetCode = '';
      if (await fs.pathExists(targetFile)) {
        targetCode = await fs.readFile(targetFile, 'utf8');
      }

      const targetAst = targetCode
        ? ASTUtils.parse(targetCode)
        : { type: 'Program', body: [], sourceType: 'module' };

      // Add function to target
      targetAst.body.push(functionNode);

      // Add export
      const exportDeclaration = {
        type: 'ExportNamedDeclaration',
        declaration: null,
        specifiers: [
          {
            type: 'ExportSpecifier',
            local: { type: 'Identifier', name: functionName },
            exported: { type: 'Identifier', name: functionName },
          },
        ],
      };
      targetAst.body.push(exportDeclaration);

      const newTargetCode = ASTUtils.generate(targetAst).code;

      // Write files
      await fs.writeFile(sourceFile, newSourceCode, 'utf8');
      await fs.writeFile(targetFile, newTargetCode, 'utf8');

      // Update imports in source file
      await this.addImport(sourceFile, targetFile, functionName);

      return {
        success: true,
        sourceFile,
        targetFile,
        functionName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Move class to another file
   * @param {string} sourceFile - Source file path
   * @param {string} targetFile - Target file path
   * @param {string} className - Class name to move
   * @returns {object} Move result
   */
  static async moveClass(sourceFile, targetFile, className) {
    try {
      const sourceCode = await fs.readFile(sourceFile, 'utf8');
      const sourceAst = ASTUtils.parse(sourceCode);
      let classNode = null;
      let classPath = null;

      // Find and extract the class
      ASTUtils.traverse(sourceAst, {
        ClassDeclaration(path) {
          if (path.node.id?.name === className) {
            classNode = path.node;
            classPath = path;
          }
        },
      });

      if (!classNode) {
        throw new Error(`Class ${className} not found in ${sourceFile}`);
      }

      // Remove from source
      classPath.remove();
      const newSourceCode = ASTUtils.generate(sourceAst).code;

      // Add to target
      let targetCode = '';
      if (await fs.pathExists(targetFile)) {
        targetCode = await fs.readFile(targetFile, 'utf8');
      }

      const targetAst = targetCode
        ? ASTUtils.parse(targetCode)
        : { type: 'Program', body: [], sourceType: 'module' };

      // Add class to target
      targetAst.body.push(classNode);

      // Add export
      const exportDeclaration = {
        type: 'ExportNamedDeclaration',
        declaration: null,
        specifiers: [
          {
            type: 'ExportSpecifier',
            local: { type: 'Identifier', name: className },
            exported: { type: 'Identifier', name: className },
          },
        ],
      };
      targetAst.body.push(exportDeclaration);

      const newTargetCode = ASTUtils.generate(targetAst).code;

      // Write files
      await fs.writeFile(sourceFile, newSourceCode, 'utf8');
      await fs.writeFile(targetFile, newTargetCode, 'utf8');

      // Update imports in source file
      await this.addImport(sourceFile, targetFile, className);

      return {
        success: true,
        sourceFile,
        targetFile,
        className,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Add import to file
   * @param {string} file - File path
   * @param {string} importFrom - Import source
   * @param {string} importName - Import name
   */
  static async addImport(file, importFrom, importName) {
    const code = await fs.readFile(file, 'utf8');
    const ast = ASTUtils.parse(code);

    // Calculate relative path
    const relativePath = path.relative(path.dirname(file), importFrom)
      .replace(/\\/g, '/')
      .replace(/\.js$/, '');

    const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;

    // Add import declaration
    const importDeclaration = {
      type: 'ImportDeclaration',
      specifiers: [
        {
          type: 'ImportSpecifier',
          local: { type: 'Identifier', name: importName },
          imported: { type: 'Identifier', name: importName },
        },
      ],
      source: { type: 'StringLiteral', value: importPath },
    };

    ast.body.unshift(importDeclaration);

    const newCode = ASTUtils.generate(ast).code;
    await fs.writeFile(file, newCode, 'utf8');
  }

  /**
   * Move multiple items to new file
   * @param {string} sourceFile - Source file path
   * @param {string} targetFile - Target file path
   * @param {array} items - Items to move (names)
   * @returns {object} Move result
   */
  static async moveItems(sourceFile, targetFile, items) {
    const results = [];

    for (const item of items) {
      // Try as function first, then class
      let result = await this.moveFunction(sourceFile, targetFile, item);

      if (!result.success) {
        result = await this.moveClass(sourceFile, targetFile, item);
      }

      results.push(result);
    }

    return {
      success: results.every((r) => r.success),
      results,
      sourceFile,
      targetFile,
    };
  }

  /**
   * Move to new module
   * @param {string} sourceFile - Source file path
   * @param {string} modulePath - New module path
   * @param {array} exports - Items to export
   * @returns {object} Move result
   */
  static async moveToNewModule(sourceFile, modulePath, exports) {
    try {
      // Create new module directory
      await fs.ensureDir(modulePath);

      const indexFile = path.join(modulePath, 'index.js');
      const results = [];

      for (const exportName of exports) {
        const targetFile = path.join(modulePath, `${exportName}.js`);
        const result = await this.moveFunction(sourceFile, targetFile, exportName);
        results.push(result);
      }

      // Create index.js
      const indexContent = exports
        .map(
          (exp) =>
            `export { ${exp} } from './${exp}';`
        )
        .join('\n');

      await fs.writeFile(indexFile, indexContent, 'utf8');

      return {
        success: true,
        sourceFile,
        modulePath,
        exports,
        results,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reorganize imports
   * @param {string} filePath - File path
   * @returns {object} Reorganize result
   */
  static async reorganizeImports(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf8');
      const ast = ASTUtils.parse(code);

      // Separate imports by type
      const imports = {
        external: [],
        internal: [],
        relative: [],
      };

      const otherNodes = [];

      ast.body.forEach((node) => {
        if (node.type === 'ImportDeclaration') {
          const source = node.source.value;

          if (source.startsWith('.')) {
            imports.relative.push(node);
          } else if (source.startsWith('@/') || source.startsWith('~/')) {
            imports.internal.push(node);
          } else {
            imports.external.push(node);
          }
        } else {
          otherNodes.push(node);
        }
      });

      // Sort imports alphabetically within each group
      Object.keys(imports).forEach((key) => {
        imports[key].sort((a, b) =>
          a.source.value.localeCompare(b.source.value)
        );
      });

      // Rebuild AST
      ast.body = [
        ...imports.external,
        ...imports.internal,
        ...imports.relative,
        ...otherNodes,
      ];

      const newCode = ASTUtils.generate(ast).code;
      await fs.writeFile(filePath, newCode, 'utf8');

      return {
        success: true,
        filePath,
        importCounts: {
          external: imports.external.length,
          internal: imports.internal.length,
          relative: imports.relative.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Split file by exports
   * @param {string} sourceFile - Source file path
   * @param {string} targetDir - Target directory
   * @returns {object} Split result
   */
  static async splitFileByExports(sourceFile, targetDir) {
    try {
      const code = await fs.readFile(sourceFile, 'utf8');
      const ast = ASTUtils.parse(code);

      await fs.ensureDir(targetDir);

      const exports = [];
      const splitFiles = [];

      // Find all exported declarations
      ASTUtils.traverse(ast, {
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            const name =
              path.node.declaration.id?.name ||
              path.node.declaration.declarations?.[0]?.id?.name;

            if (name) {
              exports.push({
                name,
                node: path.node.declaration,
              });
            }
          }
        },

        ExportDefaultDeclaration(path) {
          exports.push({
            name: 'default',
            node: path.node.declaration,
          });
        },
      });

      // Create separate files
      for (const exp of exports) {
        const fileName = exp.name === 'default' ? 'index.js' : `${exp.name}.js`;
        const targetFile = path.join(targetDir, fileName);

        const newAst = {
          type: 'Program',
          body: [exp.node],
          sourceType: 'module',
        };

        const newCode = ASTUtils.generate(newAst).code;
        await fs.writeFile(targetFile, newCode, 'utf8');

        splitFiles.push({
          name: exp.name,
          file: targetFile,
        });
      }

      return {
        success: true,
        sourceFile,
        targetDir,
        splitFiles,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = MoveTransformer;
