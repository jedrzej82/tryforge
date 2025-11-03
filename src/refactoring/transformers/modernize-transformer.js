/**
 * Modernize Transformer
 * Converts legacy code to modern JavaScript/TypeScript
 */

const ASTUtils = require('../utils/ast-utils');
const t = require('@babel/types');

class ModernizeTransformer {
  /**
   * Modernize code
   * @param {string} code - Source code
   * @param {object} options - Modernization options
   * @returns {object} Modernize result
   */
  static modernize(code, options = {}) {
    const defaultOptions = {
      varToConst: true,
      callbacksToAsync: true,
      arrowFunctions: true,
      templateLiterals: true,
      destructuring: true,
      spreadOperator: true,
      optionalChaining: true,
      nullishCoalescing: true,
      ...options,
    };

    try {
      let ast = ASTUtils.parse(code);
      const transformations = [];

      if (defaultOptions.varToConst) {
        const result = this.convertVarToConstLet(ast);
        transformations.push(...result);
      }

      if (defaultOptions.arrowFunctions) {
        const result = this.convertToArrowFunctions(ast);
        transformations.push(...result);
      }

      if (defaultOptions.templateLiterals) {
        const result = this.convertToTemplateLiterals(ast);
        transformations.push(...result);
      }

      if (defaultOptions.destructuring) {
        const result = this.addDestructuring(ast);
        transformations.push(...result);
      }

      if (defaultOptions.spreadOperator) {
        const result = this.useSpreadOperator(ast);
        transformations.push(...result);
      }

      if (defaultOptions.optionalChaining) {
        const result = this.useOptionalChaining(ast);
        transformations.push(...result);
      }

      if (defaultOptions.nullishCoalescing) {
        const result = this.useNullishCoalescing(ast);
        transformations.push(...result);
      }

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        transformations,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Convert var to const/let
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Transformations
   */
  static convertVarToConstLet(ast) {
    const transformations = [];

    ASTUtils.traverse(ast, {
      VariableDeclaration(path) {
        if (path.node.kind === 'var') {
          // Check if variable is reassigned
          const isReassigned = path.node.declarations.some((decl) => {
            const binding = path.scope.getBinding(decl.id.name);
            return binding && !binding.constant;
          });

          // Use const if not reassigned, let if reassigned
          path.node.kind = isReassigned ? 'let' : 'const';

          transformations.push({
            type: 'var-to-const-let',
            name: path.node.declarations[0]?.id?.name,
            from: 'var',
            to: path.node.kind,
            location: ASTUtils.getLocation(path.node),
          });
        }
      },
    });

    return transformations;
  }

  /**
   * Convert to arrow functions
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Transformations
   */
  static convertToArrowFunctions(ast) {
    const transformations = [];

    ASTUtils.traverse(ast, {
      FunctionExpression(path) {
        // Don't convert if uses 'this' or 'arguments'
        let usesThis = false;
        let usesArguments = false;

        path.traverse({
          ThisExpression() {
            usesThis = true;
          },
          Identifier(innerPath) {
            if (innerPath.node.name === 'arguments') {
              usesArguments = true;
            }
          },
        });

        if (!usesThis && !usesArguments) {
          const arrowFunc = t.arrowFunctionExpression(
            path.node.params,
            path.node.body,
            path.node.async
          );

          path.replaceWith(arrowFunc);

          transformations.push({
            type: 'function-to-arrow',
            location: ASTUtils.getLocation(path.node),
          });
        }
      },
    });

    return transformations;
  }

  /**
   * Convert to template literals
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Transformations
   */
  static convertToTemplateLiterals(ast) {
    const transformations = [];

    ASTUtils.traverse(ast, {
      BinaryExpression(path) {
        if (path.node.operator === '+' && this.isStringConcatenation(path.node)) {
          const templateLiteral = this.buildTemplateLiteral(path.node);

          if (templateLiteral) {
            path.replaceWith(templateLiteral);

            transformations.push({
              type: 'string-concat-to-template',
              location: ASTUtils.getLocation(path.node),
            });
          }
        }
      },
    });

    return transformations;
  }

  /**
   * Check if binary expression is string concatenation
   * @param {object} node - Binary expression node
   * @returns {boolean} Is string concatenation
   */
  static isStringConcatenation(node) {
    if (node.operator !== '+') return false;

    return (
      t.isStringLiteral(node.left) ||
      t.isStringLiteral(node.right) ||
      (t.isBinaryExpression(node.left) &&
        this.isStringConcatenation(node.left)) ||
      (t.isBinaryExpression(node.right) &&
        this.isStringConcatenation(node.right))
    );
  }

  /**
   * Build template literal from concatenation
   * @param {object} node - Binary expression node
   * @returns {object} Template literal node
   */
  static buildTemplateLiteral(node) {
    const parts = [];

    const collectParts = (n) => {
      if (t.isBinaryExpression(n) && n.operator === '+') {
        collectParts(n.left);
        collectParts(n.right);
      } else {
        parts.push(n);
      }
    };

    collectParts(node);

    const quasis = [];
    const expressions = [];

    parts.forEach((part, i) => {
      if (t.isStringLiteral(part)) {
        quasis.push(
          t.templateElement({ raw: part.value, cooked: part.value })
        );
      } else {
        if (quasis.length === expressions.length) {
          quasis.push(t.templateElement({ raw: '', cooked: '' }));
        }
        expressions.push(part);
      }
    });

    // Add final empty quasi if needed
    if (quasis.length === expressions.length) {
      quasis.push(t.templateElement({ raw: '', cooked: '' }, true));
    } else {
      quasis[quasis.length - 1].tail = true;
    }

    return t.templateLiteral(quasis, expressions);
  }

  /**
   * Add destructuring
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Transformations
   */
  static addDestructuring(ast) {
    const transformations = [];

    ASTUtils.traverse(ast, {
      VariableDeclarator(path) {
        // Convert obj.prop to destructuring
        if (
          path.node.init &&
          t.isMemberExpression(path.node.init) &&
          t.isIdentifier(path.node.id)
        ) {
          const objName = path.node.init.object.name;
          const propName = path.node.init.property.name;
          const varName = path.node.id.name;

          if (propName === varName) {
            const destructured = t.variableDeclarator(
              t.objectPattern([
                t.objectProperty(
                  t.identifier(propName),
                  t.identifier(varName),
                  false,
                  true
                ),
              ]),
              t.identifier(objName)
            );

            path.replaceWith(destructured);

            transformations.push({
              type: 'add-destructuring',
              variable: varName,
              location: ASTUtils.getLocation(path.node),
            });
          }
        }
      },
    });

    return transformations;
  }

  /**
   * Use spread operator
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Transformations
   */
  static useSpreadOperator(ast) {
    const transformations = [];

    ASTUtils.traverse(ast, {
      // Convert Array.prototype.concat to spread
      CallExpression(path) {
        if (
          t.isMemberExpression(path.node.callee) &&
          path.node.callee.property.name === 'concat' &&
          t.isArrayExpression(path.node.callee.object)
        ) {
          const spreadArray = t.arrayExpression([
            ...path.node.callee.object.elements.map((e) =>
              t.spreadElement(e)
            ),
            ...path.node.arguments.map((arg) =>
              t.isArrayExpression(arg) ? t.spreadElement(arg) : arg
            ),
          ]);

          path.replaceWith(spreadArray);

          transformations.push({
            type: 'concat-to-spread',
            location: ASTUtils.getLocation(path.node),
          });
        }

        // Convert Object.assign to spread
        if (
          t.isIdentifier(path.node.callee, { name: 'assign' }) ||
          (t.isMemberExpression(path.node.callee) &&
            path.node.callee.object.name === 'Object' &&
            path.node.callee.property.name === 'assign')
        ) {
          if (path.node.arguments.length >= 2) {
            const spreadObj = t.objectExpression(
              path.node.arguments.slice(1).map((arg) =>
                t.spreadElement(arg)
              )
            );

            path.replaceWith(spreadObj);

            transformations.push({
              type: 'assign-to-spread',
              location: ASTUtils.getLocation(path.node),
            });
          }
        }
      },
    });

    return transformations;
  }

  /**
   * Use optional chaining
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Transformations
   */
  static useOptionalChaining(ast) {
    const transformations = [];

    ASTUtils.traverse(ast, {
      LogicalExpression(path) {
        // Convert a && a.b to a?.b
        if (
          path.node.operator === '&&' &&
          t.isIdentifier(path.node.left) &&
          t.isMemberExpression(path.node.right) &&
          t.isIdentifier(path.node.right.object) &&
          path.node.left.name === path.node.right.object.name
        ) {
          const optionalMember = t.optionalMemberExpression(
            path.node.left,
            path.node.right.property,
            false,
            true
          );

          path.replaceWith(optionalMember);

          transformations.push({
            type: 'add-optional-chaining',
            location: ASTUtils.getLocation(path.node),
          });
        }
      },
    });

    return transformations;
  }

  /**
   * Use nullish coalescing
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Transformations
   */
  static useNullishCoalescing(ast) {
    const transformations = [];

    ASTUtils.traverse(ast, {
      LogicalExpression(path) {
        // Convert a || b to a ?? b when appropriate
        if (path.node.operator === '||') {
          // Check if left side is checked for null/undefined
          const nullishCoalescing = t.logicalExpression(
            '??',
            path.node.left,
            path.node.right
          );

          // Only replace if it makes sense
          // This is a simplified version - real implementation would be more sophisticated
          if (this.shouldUseNullishCoalescing(path)) {
            path.replaceWith(nullishCoalescing);

            transformations.push({
              type: 'or-to-nullish-coalescing',
              location: ASTUtils.getLocation(path.node),
            });
          }
        }
      },
    });

    return transformations;
  }

  /**
   * Check if should use nullish coalescing
   * @param {object} path - AST path
   * @returns {boolean} Should use
   */
  static shouldUseNullishCoalescing(path) {
    // Simplified check - in production, this would be more sophisticated
    return t.isIdentifier(path.node.left);
  }

  /**
   * Convert callbacks to async/await
   * @param {string} code - Source code
   * @returns {object} Transform result
   */
  static convertCallbacksToAsync(code) {
    try {
      const ast = ASTUtils.parse(code);
      const transformations = [];

      ASTUtils.traverse(ast, {
        CallExpression(path) {
          // Look for callback patterns like .then()
          if (
            t.isMemberExpression(path.node.callee) &&
            path.node.callee.property.name === 'then' &&
            path.node.arguments.length > 0 &&
            t.isFunctionExpression(path.node.arguments[0])
          ) {
            // This is a simplified conversion
            // Real implementation would need more sophisticated analysis
            transformations.push({
              type: 'callback-to-async',
              location: ASTUtils.getLocation(path.node),
              note: 'Manual conversion recommended',
            });
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        transformations,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Convert class components to hooks (React)
   * @param {string} code - Source code
   * @returns {object} Transform result
   */
  static convertClassToHooks(code) {
    try {
      const ast = ASTUtils.parse(code);
      const transformations = [];

      // This is a complex transformation that would require
      // detailed analysis of component state, lifecycle methods, etc.
      // This is a placeholder for the full implementation

      transformations.push({
        type: 'class-to-hooks',
        note: 'Complex transformation - manual review recommended',
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        transformations,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Remove use strict (when in modules)
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Transformations
   */
  static removeUseStrict(ast) {
    const transformations = [];

    if (ast.sourceType === 'module') {
      ASTUtils.traverse(ast, {
        Directive(path) {
          if (path.node.value.value === 'use strict') {
            path.remove();
            transformations.push({
              type: 'remove-use-strict',
              location: ASTUtils.getLocation(path.node),
            });
          }
        },
      });
    }

    return transformations;
  }
}

module.exports = ModernizeTransformer;
