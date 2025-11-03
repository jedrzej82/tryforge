/**
 * Scope Analyzer
 * Analyzes variable scopes and bindings
 */

const ASTUtils = require('./ast-utils');

class ScopeAnalyzer {
  /**
   * Analyze scopes in code
   * @param {string} code - Source code
   * @returns {object} Scope information
   */
  static analyze(code) {
    const ast = ASTUtils.parse(code);
    const scopes = [];
    let currentScope = null;

    ASTUtils.traverse(ast, {
      Program(path) {
        currentScope = {
          type: 'program',
          bindings: {},
          references: {},
          parent: null,
          children: [],
        };
        scopes.push(currentScope);
        this.analyzeScopeBindings(path, currentScope);
      },

      FunctionDeclaration(path) {
        const scope = this.createScope('function', currentScope, path);
        scopes.push(scope);
        this.analyzeScopeBindings(path, scope);
      },

      FunctionExpression(path) {
        const scope = this.createScope('function', currentScope, path);
        scopes.push(scope);
        this.analyzeScopeBindings(path, scope);
      },

      ArrowFunctionExpression(path) {
        const scope = this.createScope('function', currentScope, path);
        scopes.push(scope);
        this.analyzeScopeBindings(path, scope);
      },

      BlockStatement(path) {
        const scope = this.createScope('block', currentScope, path);
        scopes.push(scope);
        this.analyzeScopeBindings(path, scope);
      },
    });

    return {
      scopes,
      globalScope: scopes[0],
    };
  }

  /**
   * Create a new scope
   * @param {string} type - Scope type
   * @param {object} parent - Parent scope
   * @param {object} path - AST path
   * @returns {object} Scope object
   */
  static createScope(type, parent, path) {
    const scope = {
      type,
      bindings: {},
      references: {},
      parent,
      children: [],
      path,
    };

    if (parent) {
      parent.children.push(scope);
    }

    return scope;
  }

  /**
   * Analyze bindings in scope
   * @param {object} path - AST path
   * @param {object} scope - Scope object
   */
  static analyzeScopeBindings(path, scope) {
    // Get all bindings from the scope
    const bindings = path.scope.bindings;

    for (const [name, binding] of Object.entries(bindings)) {
      scope.bindings[name] = {
        name,
        kind: binding.kind,
        constant: binding.constant,
        references: binding.references,
        referencePaths: binding.referencePaths,
        violations: binding.constantViolations,
      };
    }

    // Get all references
    const references = path.scope.references;
    for (const reference of references) {
      const name = reference.identifier.name;
      if (!scope.references[name]) {
        scope.references[name] = [];
      }
      scope.references[name].push(reference);
    }
  }

  /**
   * Find binding for identifier
   * @param {object} path - AST path
   * @param {string} name - Identifier name
   * @returns {object} Binding info
   */
  static findBinding(path, name) {
    return path.scope.getBinding(name);
  }

  /**
   * Check if identifier is defined in scope
   * @param {object} path - AST path
   * @param {string} name - Identifier name
   * @returns {boolean} Is defined
   */
  static isDefined(path, name) {
    return path.scope.hasBinding(name);
  }

  /**
   * Check if identifier is global
   * @param {object} path - AST path
   * @param {string} name - Identifier name
   * @returns {boolean} Is global
   */
  static isGlobal(path, name) {
    return !path.scope.hasBinding(name);
  }

  /**
   * Get all bindings in scope
   * @param {object} path - AST path
   * @returns {object} Bindings
   */
  static getBindings(path) {
    return path.scope.bindings;
  }

  /**
   * Get all references to identifier
   * @param {object} path - AST path
   * @param {string} name - Identifier name
   * @returns {array} References
   */
  static getReferences(path, name) {
    const binding = this.findBinding(path, name);
    return binding ? binding.referencePaths : [];
  }

  /**
   * Check if variable is used
   * @param {object} path - AST path
   * @param {string} name - Variable name
   * @returns {boolean} Is used
   */
  static isVariableUsed(path, name) {
    const binding = this.findBinding(path, name);
    return binding ? binding.references > 0 : false;
  }

  /**
   * Check if variable is constant
   * @param {object} path - AST path
   * @param {string} name - Variable name
   * @returns {boolean} Is constant
   */
  static isConstant(path, name) {
    const binding = this.findBinding(path, name);
    return binding ? binding.constant : false;
  }

  /**
   * Rename identifier in scope
   * @param {object} path - AST path
   * @param {string} oldName - Old name
   * @param {string} newName - New name
   * @returns {number} Number of renames
   */
  static rename(path, oldName, newName) {
    const binding = this.findBinding(path, oldName);
    if (!binding) return 0;

    let count = 0;

    // Rename the binding itself
    if (binding.identifier) {
      binding.identifier.name = newName;
      count++;
    }

    // Rename all references
    binding.referencePaths.forEach((refPath) => {
      refPath.node.name = newName;
      count++;
    });

    return count;
  }

  /**
   * Find unused variables
   * @param {string} code - Source code
   * @returns {array} Unused variables
   */
  static findUnusedVariables(code) {
    const ast = ASTUtils.parse(code);
    const unused = [];

    ASTUtils.traverse(ast, {
      VariableDeclarator(path) {
        const name = path.node.id.name;
        const binding = path.scope.getBinding(name);

        if (binding && binding.references === 0) {
          unused.push({
            name,
            kind: path.parent.kind,
            loc: ASTUtils.getLocation(path.node),
          });
        }
      },

      FunctionDeclaration(path) {
        if (!path.node.id) return;

        const name = path.node.id.name;
        const binding = path.scope.parent.getBinding(name);

        if (binding && binding.references === 0) {
          unused.push({
            name,
            kind: 'function',
            loc: ASTUtils.getLocation(path.node),
          });
        }
      },
    });

    return unused;
  }

  /**
   * Find shadowed variables
   * @param {string} code - Source code
   * @returns {array} Shadowed variables
   */
  static findShadowedVariables(code) {
    const ast = ASTUtils.parse(code);
    const shadowed = [];

    ASTUtils.traverse(ast, {
      VariableDeclarator(path) {
        const name = path.node.id.name;
        const parentScope = path.scope.parent;

        if (parentScope && parentScope.hasBinding(name)) {
          shadowed.push({
            name,
            loc: ASTUtils.getLocation(path.node),
          });
        }
      },
    });

    return shadowed;
  }

  /**
   * Get scope depth
   * @param {object} path - AST path
   * @returns {number} Scope depth
   */
  static getScopeDepth(path) {
    let depth = 0;
    let currentPath = path;

    while (currentPath.scope.parent) {
      depth++;
      currentPath = currentPath.parentPath;
    }

    return depth;
  }

  /**
   * Check if identifier can be safely renamed
   * @param {object} path - AST path
   * @param {string} oldName - Old name
   * @param {string} newName - New name
   * @returns {object} Safety check result
   */
  static canSafelyRename(path, oldName, newName) {
    // Check if new name already exists in scope
    if (path.scope.hasBinding(newName)) {
      return {
        safe: false,
        reason: `Name '${newName}' already exists in scope`,
      };
    }

    // Check if old name exists
    const binding = this.findBinding(path, oldName);
    if (!binding) {
      return {
        safe: false,
        reason: `Name '${oldName}' not found in scope`,
      };
    }

    return { safe: true };
  }

  /**
   * Get all identifiers in scope
   * @param {object} path - AST path
   * @returns {array} Identifier names
   */
  static getAllIdentifiers(path) {
    return Object.keys(path.scope.bindings);
  }

  /**
   * Find conflicts
   * @param {object} path - AST path
   * @param {string} name - Name to check
   * @returns {array} Conflicting scopes
   */
  static findConflicts(path, name) {
    const conflicts = [];
    let currentScope = path.scope;

    while (currentScope) {
      if (currentScope.hasBinding(name)) {
        conflicts.push(currentScope);
      }
      currentScope = currentScope.parent;
    }

    return conflicts;
  }
}

module.exports = ScopeAnalyzer;
