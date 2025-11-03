/**
 * Import Organizer
 * Organizes, sorts, and optimizes imports
 */

const fs = require('fs-extra');
const ASTUtils = require('../utils/ast-utils');
const ScopeAnalyzer = require('../utils/scope-analyzer');

class ImportOrganizer {
  /**
   * Organize imports in code
   * @param {string} code - Source code
   * @param {object} options - Organization options
   * @returns {object} Organization result
   */
  static organizeImports(code, options = {}) {
    const defaultOptions = {
      sortImports: true,
      groupImports: true,
      removeUnused: true,
      separateGroups: true,
      sortSpecifiers: true,
      ...options,
    };

    try {
      const ast = ASTUtils.parse(code);
      const imports = this.extractImports(ast);
      const nonImportNodes = this.extractNonImportNodes(ast);

      let organizedImports = imports;

      if (defaultOptions.removeUnused) {
        organizedImports = this.removeUnusedImports(
          organizedImports,
          nonImportNodes
        );
      }

      if (defaultOptions.sortSpecifiers) {
        organizedImports = this.sortImportSpecifiers(organizedImports);
      }

      if (defaultOptions.groupImports) {
        organizedImports = this.groupImports(organizedImports);
      }

      if (defaultOptions.sortImports) {
        organizedImports = this.sortImports(organizedImports);
      }

      // Rebuild AST
      ast.body = [
        ...this.buildImportNodes(organizedImports, defaultOptions.separateGroups),
        ...nonImportNodes,
      ];

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        removed: imports.length - organizedImports.length,
        organized: organizedImports.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract imports from AST
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Imports
   */
  static extractImports(ast) {
    const imports = [];

    ast.body.forEach((node) => {
      if (node.type === 'ImportDeclaration') {
        imports.push({
          node,
          source: node.source.value,
          specifiers: node.specifiers,
        });
      }
    });

    return imports;
  }

  /**
   * Extract non-import nodes from AST
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Non-import nodes
   */
  static extractNonImportNodes(ast) {
    return ast.body.filter((node) => node.type !== 'ImportDeclaration');
  }

  /**
   * Remove unused imports
   * @param {array} imports - Imports
   * @param {array} codeNodes - Code nodes
   * @returns {array} Filtered imports
   */
  static removeUnusedImports(imports, codeNodes) {
    const usedIdentifiers = new Set();

    // Collect all used identifiers
    codeNodes.forEach((node) => {
      ASTUtils.traverse(node, {
        Identifier(path) {
          if (path.isReferencedIdentifier()) {
            usedIdentifiers.add(path.node.name);
          }
        },
      });
    });

    // Filter imports
    return imports.filter((imp) => {
      // Keep side-effect imports (no specifiers)
      if (imp.specifiers.length === 0) {
        return true;
      }

      // Filter specifiers
      imp.specifiers = imp.specifiers.filter((spec) => {
        const localName = spec.local.name;
        return usedIdentifiers.has(localName);
      });

      // Keep import if it has remaining specifiers
      return imp.specifiers.length > 0;
    });
  }

  /**
   * Sort import specifiers
   * @param {array} imports - Imports
   * @returns {array} Imports with sorted specifiers
   */
  static sortImportSpecifiers(imports) {
    return imports.map((imp) => ({
      ...imp,
      specifiers: imp.specifiers.sort((a, b) => {
        // Default imports first
        if (a.type === 'ImportDefaultSpecifier') return -1;
        if (b.type === 'ImportDefaultSpecifier') return 1;

        // Namespace imports second
        if (a.type === 'ImportNamespaceSpecifier') return -1;
        if (b.type === 'ImportNamespaceSpecifier') return 1;

        // Then alphabetically by local name
        return a.local.name.localeCompare(b.local.name);
      }),
    }));
  }

  /**
   * Group imports by type
   * @param {array} imports - Imports
   * @returns {object} Grouped imports
   */
  static groupImports(imports) {
    const groups = {
      builtin: [],
      external: [],
      internal: [],
      relative: [],
    };

    const builtinModules = [
      'fs',
      'path',
      'http',
      'https',
      'crypto',
      'util',
      'os',
      'events',
      'stream',
      'buffer',
      'child_process',
      'assert',
      'url',
      'querystring',
      'zlib',
    ];

    imports.forEach((imp) => {
      const source = imp.source;

      if (builtinModules.includes(source)) {
        groups.builtin.push(imp);
      } else if (source.startsWith('.') || source.startsWith('/')) {
        groups.relative.push(imp);
      } else if (source.startsWith('@/') || source.startsWith('~/')) {
        groups.internal.push(imp);
      } else {
        groups.external.push(imp);
      }
    });

    return groups;
  }

  /**
   * Sort imports within groups
   * @param {object|array} imports - Imports or grouped imports
   * @returns {array} Sorted imports
   */
  static sortImports(imports) {
    if (Array.isArray(imports)) {
      return imports.sort((a, b) => a.source.localeCompare(b.source));
    }

    // Sort within each group
    const sorted = {};
    Object.keys(imports).forEach((key) => {
      sorted[key] = imports[key].sort((a, b) =>
        a.source.localeCompare(b.source)
      );
    });

    return sorted;
  }

  /**
   * Build import nodes
   * @param {object|array} imports - Imports or grouped imports
   * @param {boolean} separateGroups - Add blank lines between groups
   * @returns {array} Import nodes
   */
  static buildImportNodes(imports, separateGroups = true) {
    const nodes = [];

    if (Array.isArray(imports)) {
      return imports.map((imp) => this.updateImportNode(imp));
    }

    // Build from groups
    const groupOrder = ['builtin', 'external', 'internal', 'relative'];

    groupOrder.forEach((groupName, index) => {
      const group = imports[groupName];

      if (group && group.length > 0) {
        group.forEach((imp) => {
          nodes.push(this.updateImportNode(imp));
        });

        // Add blank line between groups (represented as a comment)
        if (separateGroups && index < groupOrder.length - 1) {
          // We'll handle this in the generator
        }
      }
    });

    return nodes;
  }

  /**
   * Update import node with sorted specifiers
   * @param {object} imp - Import object
   * @returns {object} Import node
   */
  static updateImportNode(imp) {
    const node = { ...imp.node };
    node.specifiers = imp.specifiers;
    return node;
  }

  /**
   * Organize imports in file
   * @param {string} filePath - File path
   * @param {object} options - Organization options
   * @returns {object} Organization result
   */
  static async organizeImportsInFile(filePath, options = {}) {
    try {
      const code = await fs.readFile(filePath, 'utf8');
      const result = this.organizeImports(code, options);

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
   * Add missing imports
   * @param {string} code - Source code
   * @param {array} importsToAdd - Imports to add
   * @returns {object} Result
   */
  static addImports(code, importsToAdd) {
    try {
      const ast = ASTUtils.parse(code);

      // Add new imports at the beginning
      importsToAdd.forEach((imp) => {
        const importNode = this.createImportNode(
          imp.source,
          imp.specifiers
        );
        ast.body.unshift(importNode);
      });

      // Organize all imports
      const result = this.organizeImports(ASTUtils.generate(ast).code);

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create import node
   * @param {string} source - Import source
   * @param {array} specifiers - Import specifiers
   * @returns {object} Import node
   */
  static createImportNode(source, specifiers = []) {
    const specs = specifiers.map((spec) => {
      if (spec.default) {
        return {
          type: 'ImportDefaultSpecifier',
          local: { type: 'Identifier', name: spec.name },
        };
      } else if (spec.namespace) {
        return {
          type: 'ImportNamespaceSpecifier',
          local: { type: 'Identifier', name: spec.name },
        };
      } else {
        return {
          type: 'ImportSpecifier',
          local: { type: 'Identifier', name: spec.local || spec.name },
          imported: { type: 'Identifier', name: spec.name },
        };
      }
    });

    return {
      type: 'ImportDeclaration',
      specifiers: specs,
      source: { type: 'StringLiteral', value: source },
    };
  }

  /**
   * Find missing imports
   * @param {string} code - Source code
   * @returns {array} Missing imports
   */
  static findMissingImports(code) {
    try {
      const ast = ASTUtils.parse(code);
      const imports = this.extractImports(ast);
      const importedNames = new Set();

      imports.forEach((imp) => {
        imp.specifiers.forEach((spec) => {
          importedNames.add(spec.local.name);
        });
      });

      const usedNames = new Set();
      const missing = [];

      ASTUtils.traverse(ast, {
        Identifier(path) {
          if (path.isReferencedIdentifier()) {
            const name = path.node.name;
            if (!importedNames.has(name) && !usedNames.has(name)) {
              const binding = ScopeAnalyzer.findBinding(path, name);
              if (!binding) {
                usedNames.add(name);
                missing.push(name);
              }
            }
          }
        },
      });

      return missing;
    } catch (error) {
      return [];
    }
  }

  /**
   * Merge duplicate imports
   * @param {string} code - Source code
   * @returns {object} Merge result
   */
  static mergeDuplicateImports(code) {
    try {
      const ast = ASTUtils.parse(code);
      const imports = this.extractImports(ast);

      // Group by source
      const importMap = new Map();

      imports.forEach((imp) => {
        if (importMap.has(imp.source)) {
          const existing = importMap.get(imp.source);
          existing.specifiers.push(...imp.specifiers);
        } else {
          importMap.set(imp.source, { ...imp });
        }
      });

      // Remove duplicates and organize
      const mergedImports = Array.from(importMap.values());
      const result = this.organizeImports(code);

      return {
        success: true,
        code: result.code,
        merged: imports.length - mergedImports.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = ImportOrganizer;
