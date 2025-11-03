/**
 * Inline Transformer
 * Handles inlining of variables and functions
 */

const ASTUtils = require('../utils/ast-utils');
const ScopeAnalyzer = require('../utils/scope-analyzer');

class InlineTransformer {
  /**
   * Inline variable
   * @param {string} code - Source code
   * @param {string} variableName - Variable name to inline
   * @returns {object} Inline result
   */
  static inlineVariable(code, variableName) {
    try {
      const ast = ASTUtils.parse(code);
      let variableValue = null;
      let variablePath = null;
      let inlineCount = 0;

      // Find the variable declaration
      ASTUtils.traverse(ast, {
        VariableDeclarator(path) {
          if (path.node.id.name === variableName && path.node.init) {
            variableValue = path.node.init;
            variablePath = path;
          }
        },
      });

      if (!variableValue) {
        throw new Error(`Variable ${variableName} not found or has no initializer`);
      }

      // Check if it's safe to inline (variable should be constant)
      const binding = ScopeAnalyzer.findBinding(variablePath, variableName);
      if (binding && !binding.constant) {
        throw new Error(`Variable ${variableName} is not constant, cannot inline`);
      }

      // Replace all references with the value
      ASTUtils.traverse(ast, {
        Identifier(path) {
          if (
            path.node.name === variableName &&
            path.key !== 'id' &&
            path.isReferencedIdentifier()
          ) {
            path.replaceWith(ASTUtils.cloneNode(variableValue));
            inlineCount++;
          }
        },
      });

      // Remove the variable declaration
      if (variablePath) {
        const declarationPath = variablePath.parentPath;
        if (declarationPath.node.declarations.length === 1) {
          declarationPath.remove();
        } else {
          variablePath.remove();
        }
      }

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        variableName,
        inlineCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Inline function
   * @param {string} code - Source code
   * @param {string} functionName - Function name to inline
   * @returns {object} Inline result
   */
  static inlineFunction(code, functionName) {
    try {
      const ast = ASTUtils.parse(code);
      let functionNode = null;
      let functionPath = null;
      let inlineCount = 0;

      // Find the function declaration
      ASTUtils.traverse(ast, {
        FunctionDeclaration(path) {
          if (path.node.id?.name === functionName) {
            functionNode = path.node;
            functionPath = path;
          }
        },
      });

      if (!functionNode) {
        throw new Error(`Function ${functionName} not found`);
      }

      // Check if function is simple enough to inline
      if (!this.canInlineFunction(functionNode)) {
        throw new Error(`Function ${functionName} is too complex to inline`);
      }

      // Replace all calls with the function body
      ASTUtils.traverse(ast, {
        CallExpression(path) {
          if (path.node.callee.name === functionName) {
            const inlinedCode = this.inlineFunctionCall(
              functionNode,
              path.node.arguments
            );

            if (inlinedCode) {
              path.replaceWithMultiple(inlinedCode);
              inlineCount++;
            }
          }
        },
      });

      // Remove the function declaration
      if (functionPath) {
        functionPath.remove();
      }

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        functionName,
        inlineCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if function can be inlined
   * @param {object} functionNode - Function node
   * @returns {boolean} Can inline
   */
  static canInlineFunction(functionNode) {
    // Function should be simple (few statements, no complex control flow)
    const statements = functionNode.body.body;

    if (statements.length > 5) return false;

    // Check for complex patterns
    let hasComplexPatterns = false;
    ASTUtils.traverse(functionNode, {
      ForStatement() {
        hasComplexPatterns = true;
      },
      WhileStatement() {
        hasComplexPatterns = true;
      },
      TryStatement() {
        hasComplexPatterns = true;
      },
    });

    return !hasComplexPatterns;
  }

  /**
   * Inline function call
   * @param {object} functionNode - Function node
   * @param {array} args - Call arguments
   * @returns {array} Inlined statements
   */
  static inlineFunctionCall(functionNode, args) {
    const params = functionNode.params;
    const body = functionNode.body.body;

    // Create mapping of parameters to arguments
    const paramMap = {};
    params.forEach((param, index) => {
      if (param.type === 'Identifier') {
        paramMap[param.name] = args[index] || null;
      }
    });

    // Clone and transform function body
    const inlinedStatements = body.map((statement) => {
      const cloned = ASTUtils.cloneNode(statement);

      // Replace parameter references with arguments
      ASTUtils.traverse(cloned, {
        Identifier(path) {
          if (paramMap[path.node.name]) {
            path.replaceWith(ASTUtils.cloneNode(paramMap[path.node.name]));
          }
        },
      });

      return cloned;
    });

    return inlinedStatements;
  }

  /**
   * Inline constant
   * @param {string} code - Source code
   * @param {string} constantName - Constant name
   * @returns {object} Inline result
   */
  static inlineConstant(code, constantName) {
    return this.inlineVariable(code, constantName);
  }

  /**
   * Inline ternary to if-else
   * @param {string} code - Source code
   * @returns {object} Inline result
   */
  static inlineTernaryToIfElse(code) {
    try {
      const ast = ASTUtils.parse(code);
      let inlineCount = 0;

      ASTUtils.traverse(ast, {
        ConditionalExpression(path) {
          // Only inline if part of an assignment or return
          const parent = path.parent;

          if (
            parent.type === 'VariableDeclarator' ||
            parent.type === 'AssignmentExpression' ||
            parent.type === 'ReturnStatement'
          ) {
            const ifStatement = this.ternaryToIfElse(path.node, parent);

            if (ifStatement) {
              const statement = path.getStatementParent();
              statement.replaceWith(ifStatement);
              inlineCount++;
            }
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        inlineCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Convert ternary to if-else
   * @param {object} ternary - Ternary expression
   * @param {object} parent - Parent node
   * @returns {object} If statement
   */
  static ternaryToIfElse(ternary, parent) {
    const t = require('@babel/types');

    let consequent, alternate;

    if (parent.type === 'ReturnStatement') {
      consequent = t.returnStatement(ternary.consequent);
      alternate = t.returnStatement(ternary.alternate);
    } else if (parent.type === 'VariableDeclarator') {
      consequent = t.expressionStatement(
        t.assignmentExpression('=', parent.id, ternary.consequent)
      );
      alternate = t.expressionStatement(
        t.assignmentExpression('=', parent.id, ternary.alternate)
      );
    } else {
      return null;
    }

    return t.ifStatement(
      ternary.test,
      t.blockStatement([consequent]),
      t.blockStatement([alternate])
    );
  }

  /**
   * Inline import
   * @param {string} code - Source code
   * @param {string} importName - Import name to inline
   * @returns {object} Inline result
   */
  static inlineImport(code, importName) {
    try {
      const ast = ASTUtils.parse(code);
      let importSource = null;
      let importPath = null;

      // Find the import
      ASTUtils.traverse(ast, {
        ImportDeclaration(path) {
          const spec = path.node.specifiers.find(
            (s) => s.local.name === importName
          );

          if (spec) {
            importSource = path.node.source.value;
            importPath = path;
          }
        },
      });

      if (!importSource) {
        throw new Error(`Import ${importName} not found`);
      }

      // For simplicity, we'll just remove the import if it's not used
      const isUsed = ScopeAnalyzer.isVariableUsed(importPath, importName);

      if (!isUsed) {
        // Remove the import specifier
        importPath.node.specifiers = importPath.node.specifiers.filter(
          (s) => s.local.name !== importName
        );

        // If no more specifiers, remove the entire import
        if (importPath.node.specifiers.length === 0) {
          importPath.remove();
        }
      }

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        importName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Simplify expression
   * @param {string} code - Source code
   * @returns {object} Simplify result
   */
  static simplifyExpressions(code) {
    try {
      const ast = ASTUtils.parse(code);
      let simplifyCount = 0;

      ASTUtils.traverse(ast, {
        BinaryExpression(path) {
          // Simplify constant expressions
          if (
            path.node.left.type === 'NumericLiteral' &&
            path.node.right.type === 'NumericLiteral'
          ) {
            const result = this.evaluateBinaryExpression(path.node);
            if (result !== null) {
              path.replaceWith({ type: 'NumericLiteral', value: result });
              simplifyCount++;
            }
          }
        },

        UnaryExpression(path) {
          // Simplify double negation
          if (
            path.node.operator === '!' &&
            path.node.argument.type === 'UnaryExpression' &&
            path.node.argument.operator === '!'
          ) {
            path.replaceWith(path.node.argument.argument);
            simplifyCount++;
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        simplifyCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Evaluate binary expression
   * @param {object} node - Binary expression node
   * @returns {number|null} Result
   */
  static evaluateBinaryExpression(node) {
    const left = node.left.value;
    const right = node.right.value;

    switch (node.operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      case '%':
        return left % right;
      default:
        return null;
    }
  }
}

module.exports = InlineTransformer;
