/**
 * AST Utilities
 * Provides helper functions for working with Abstract Syntax Trees
 */

const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

class ASTUtils {
  /**
   * Parse code to AST
   * @param {string} code - Source code
   * @param {object} options - Parser options
   * @returns {object} AST
   */
  static parse(code, options = {}) {
    const defaultOptions = {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'asyncGenerators',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator',
      ],
      ...options,
    };

    try {
      return parser.parse(code, defaultOptions);
    } catch (error) {
      throw new Error(`Failed to parse code: ${error.message}`);
    }
  }

  /**
   * Generate code from AST
   * @param {object} ast - Abstract Syntax Tree
   * @param {object} options - Generator options
   * @returns {object} Generated code and source map
   */
  static generate(ast, options = {}) {
    const defaultOptions = {
      retainLines: true,
      comments: true,
      ...options,
    };

    try {
      return generate(ast, defaultOptions);
    } catch (error) {
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  /**
   * Traverse AST with visitor pattern
   * @param {object} ast - Abstract Syntax Tree
   * @param {object} visitor - Visitor object
   */
  static traverse(ast, visitor) {
    try {
      traverse(ast, visitor);
    } catch (error) {
      throw new Error(`Failed to traverse AST: ${error.message}`);
    }
  }

  /**
   * Find nodes matching a predicate
   * @param {object} ast - Abstract Syntax Tree
   * @param {function} predicate - Matching function
   * @returns {array} Matching nodes
   */
  static findNodes(ast, predicate) {
    const nodes = [];

    this.traverse(ast, {
      enter(path) {
        if (predicate(path.node, path)) {
          nodes.push({ node: path.node, path });
        }
      },
    });

    return nodes;
  }

  /**
   * Find node by type
   * @param {object} ast - Abstract Syntax Tree
   * @param {string} nodeType - Node type to find
   * @returns {array} Matching nodes
   */
  static findNodesByType(ast, nodeType) {
    return this.findNodes(ast, (node) => t[`is${nodeType}`](node));
  }

  /**
   * Find all function declarations
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Function nodes
   */
  static findFunctions(ast) {
    const functions = [];

    this.traverse(ast, {
      FunctionDeclaration(path) {
        functions.push({ node: path.node, path, type: 'declaration' });
      },
      FunctionExpression(path) {
        functions.push({ node: path.node, path, type: 'expression' });
      },
      ArrowFunctionExpression(path) {
        functions.push({ node: path.node, path, type: 'arrow' });
      },
    });

    return functions;
  }

  /**
   * Find all variable declarations
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Variable nodes
   */
  static findVariables(ast) {
    const variables = [];

    this.traverse(ast, {
      VariableDeclaration(path) {
        path.node.declarations.forEach((declaration) => {
          variables.push({
            node: declaration,
            path,
            kind: path.node.kind,
            name: declaration.id.name,
          });
        });
      },
    });

    return variables;
  }

  /**
   * Find all imports
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Import nodes
   */
  static findImports(ast) {
    const imports = [];

    this.traverse(ast, {
      ImportDeclaration(path) {
        imports.push({
          node: path.node,
          path,
          source: path.node.source.value,
          specifiers: path.node.specifiers.map((spec) => ({
            type: spec.type,
            local: spec.local.name,
            imported: spec.imported ? spec.imported.name : null,
          })),
        });
      },
    });

    return imports;
  }

  /**
   * Find all exports
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Export nodes
   */
  static findExports(ast) {
    const exports = [];

    this.traverse(ast, {
      ExportNamedDeclaration(path) {
        exports.push({ node: path.node, path, type: 'named' });
      },
      ExportDefaultDeclaration(path) {
        exports.push({ node: path.node, path, type: 'default' });
      },
      ExportAllDeclaration(path) {
        exports.push({ node: path.node, path, type: 'all' });
      },
    });

    return exports;
  }

  /**
   * Find all class declarations
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Class nodes
   */
  static findClasses(ast) {
    const classes = [];

    this.traverse(ast, {
      ClassDeclaration(path) {
        classes.push({ node: path.node, path, name: path.node.id.name });
      },
      ClassExpression(path) {
        classes.push({ node: path.node, path, name: path.node.id?.name });
      },
    });

    return classes;
  }

  /**
   * Get function name
   * @param {object} node - Function node
   * @returns {string} Function name
   */
  static getFunctionName(node) {
    if (node.id) return node.id.name;
    if (node.key) return node.key.name;
    return '<anonymous>';
  }

  /**
   * Get function parameters
   * @param {object} node - Function node
   * @returns {array} Parameter names
   */
  static getFunctionParams(node) {
    return node.params.map((param) => {
      if (t.isIdentifier(param)) return param.name;
      if (t.isAssignmentPattern(param)) return param.left.name;
      if (t.isRestElement(param)) return `...${param.argument.name}`;
      return '<complex>';
    });
  }

  /**
   * Count nodes in AST
   * @param {object} ast - Abstract Syntax Tree
   * @returns {number} Node count
   */
  static countNodes(ast) {
    let count = 0;
    this.traverse(ast, {
      enter() {
        count++;
      },
    });
    return count;
  }

  /**
   * Get source location info
   * @param {object} node - AST node
   * @returns {object} Location info
   */
  static getLocation(node) {
    if (!node.loc) return null;

    return {
      start: {
        line: node.loc.start.line,
        column: node.loc.start.column,
      },
      end: {
        line: node.loc.end.line,
        column: node.loc.end.column,
      },
    };
  }

  /**
   * Clone an AST node
   * @param {object} node - AST node
   * @returns {object} Cloned node
   */
  static cloneNode(node) {
    return t.cloneDeep(node);
  }

  /**
   * Check if code is valid
   * @param {string} code - Source code
   * @returns {boolean} Is valid
   */
  static isValidCode(code) {
    try {
      this.parse(code);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get node type
   * @param {object} node - AST node
   * @returns {string} Node type
   */
  static getNodeType(node) {
    return node.type;
  }

  /**
   * Check if node is a function
   * @param {object} node - AST node
   * @returns {boolean} Is function
   */
  static isFunction(node) {
    return (
      t.isFunctionDeclaration(node) ||
      t.isFunctionExpression(node) ||
      t.isArrowFunctionExpression(node) ||
      t.isObjectMethod(node) ||
      t.isClassMethod(node)
    );
  }

  /**
   * Check if node is async
   * @param {object} node - AST node
   * @returns {boolean} Is async
   */
  static isAsync(node) {
    return node.async === true;
  }

  /**
   * Check if node is generator
   * @param {object} node - AST node
   * @returns {boolean} Is generator
   */
  static isGenerator(node) {
    return node.generator === true;
  }

  /**
   * Get all identifiers in scope
   * @param {object} path - AST path
   * @returns {array} Identifiers
   */
  static getIdentifiers(path) {
    const identifiers = new Set();

    path.traverse({
      Identifier(idPath) {
        identifiers.add(idPath.node.name);
      },
    });

    return Array.from(identifiers);
  }

  /**
   * Replace node
   * @param {object} path - AST path
   * @param {object} newNode - New node
   */
  static replaceNode(path, newNode) {
    path.replaceWith(newNode);
  }

  /**
   * Remove node
   * @param {object} path - AST path
   */
  static removeNode(path) {
    path.remove();
  }

  /**
   * Insert before node
   * @param {object} path - AST path
   * @param {object} newNode - New node
   */
  static insertBefore(path, newNode) {
    path.insertBefore(newNode);
  }

  /**
   * Insert after node
   * @param {object} path - AST path
   * @param {object} newNode - New node
   */
  static insertAfter(path, newNode) {
    path.insertAfter(newNode);
  }
}

module.exports = ASTUtils;
