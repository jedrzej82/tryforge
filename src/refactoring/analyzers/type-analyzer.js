/**
 * Type Analyzer
 * Analyzes TypeScript types and infers JavaScript types
 */

const fs = require('fs-extra');
const ASTUtils = require('../utils/ast-utils');

class TypeAnalyzer {
  /**
   * Analyze types in file
   * @param {string} filePath - File path
   * @returns {object} Type analysis
   */
  static async analyzeFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf8');
      const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');

      return {
        success: true,
        filePath,
        isTypeScript,
        types: isTypeScript
          ? this.analyzeTypeScriptTypes(code)
          : this.inferJavaScriptTypes(code),
        typeErrors: isTypeScript ? this.findTypeScriptErrors(code) : [],
        suggestions: this.generateTypeSuggestions(code, isTypeScript),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze TypeScript types
   * @param {string} code - Source code
   * @returns {object} Type information
   */
  static analyzeTypeScriptTypes(code) {
    try {
      const ast = ASTUtils.parse(code);
      const types = {
        interfaces: [],
        types: [],
        enums: [],
        functions: [],
        variables: [],
      };

      ASTUtils.traverse(ast, {
        TSInterfaceDeclaration(path) {
          types.interfaces.push({
            name: path.node.id.name,
            members: path.node.body.body.length,
            location: ASTUtils.getLocation(path.node),
          });
        },

        TSTypeAliasDeclaration(path) {
          types.types.push({
            name: path.node.id.name,
            location: ASTUtils.getLocation(path.node),
          });
        },

        TSEnumDeclaration(path) {
          types.enums.push({
            name: path.node.id.name,
            members: path.node.members.length,
            location: ASTUtils.getLocation(path.node),
          });
        },

        FunctionDeclaration(path) {
          if (path.node.returnType) {
            types.functions.push({
              name: path.node.id?.name || '<anonymous>',
              returnType: this.getTypeAnnotation(path.node.returnType),
              params: path.node.params.map((p) => ({
                name: p.name || '<pattern>',
                type: p.typeAnnotation
                  ? this.getTypeAnnotation(p.typeAnnotation)
                  : 'any',
              })),
              location: ASTUtils.getLocation(path.node),
            });
          }
        },

        VariableDeclarator(path) {
          if (path.node.id.typeAnnotation) {
            types.variables.push({
              name: path.node.id.name,
              type: this.getTypeAnnotation(path.node.id.typeAnnotation),
              location: ASTUtils.getLocation(path.node),
            });
          }
        },
      });

      return types;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get type annotation string
   * @param {object} typeAnnotation - Type annotation node
   * @returns {string} Type string
   */
  static getTypeAnnotation(typeAnnotation) {
    if (!typeAnnotation) return 'any';

    try {
      return ASTUtils.generate(typeAnnotation).code.replace(/^:\s*/, '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Infer JavaScript types
   * @param {string} code - Source code
   * @returns {object} Inferred types
   */
  static inferJavaScriptTypes(code) {
    try {
      const ast = ASTUtils.parse(code);
      const inferred = {
        functions: [],
        variables: [],
      };

      ASTUtils.traverse(ast, {
        FunctionDeclaration(path) {
          const returnType = this.inferReturnType(path.node);
          const params = this.inferParameterTypes(path.node);

          inferred.functions.push({
            name: path.node.id?.name || '<anonymous>',
            returnType,
            params,
            location: ASTUtils.getLocation(path.node),
          });
        },

        VariableDeclarator(path) {
          if (path.node.init) {
            const type = this.inferExpressionType(path.node.init);
            inferred.variables.push({
              name: path.node.id.name,
              type,
              location: ASTUtils.getLocation(path.node),
            });
          }
        },
      });

      return inferred;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Infer return type from function
   * @param {object} node - Function node
   * @returns {string} Inferred type
   */
  static inferReturnType(node) {
    const returnStatements = [];

    ASTUtils.traverse(node, {
      ReturnStatement(path) {
        if (path.node.argument) {
          returnStatements.push(path.node.argument);
        }
      },
    });

    if (returnStatements.length === 0) return 'void';

    const types = returnStatements.map((stmt) => this.inferExpressionType(stmt));
    const uniqueTypes = [...new Set(types)];

    if (uniqueTypes.length === 1) return uniqueTypes[0];
    return uniqueTypes.join(' | ');
  }

  /**
   * Infer parameter types
   * @param {object} node - Function node
   * @returns {array} Parameter types
   */
  static inferParameterTypes(node) {
    return node.params.map((param) => ({
      name: param.name || '<pattern>',
      type: param.typeAnnotation
        ? this.getTypeAnnotation(param.typeAnnotation)
        : this.inferParamType(param),
    }));
  }

  /**
   * Infer parameter type
   * @param {object} param - Parameter node
   * @returns {string} Inferred type
   */
  static inferParamType(param) {
    // Check for default value
    if (param.type === 'AssignmentPattern') {
      return this.inferExpressionType(param.right);
    }

    // Check for destructuring
    if (param.type === 'ObjectPattern') return 'object';
    if (param.type === 'ArrayPattern') return 'array';

    return 'any';
  }

  /**
   * Infer expression type
   * @param {object} node - Expression node
   * @returns {string} Inferred type
   */
  static inferExpressionType(node) {
    if (!node) return 'undefined';

    switch (node.type) {
      case 'NumericLiteral':
        return 'number';
      case 'StringLiteral':
        return 'string';
      case 'BooleanLiteral':
        return 'boolean';
      case 'NullLiteral':
        return 'null';
      case 'ArrayExpression':
        return 'array';
      case 'ObjectExpression':
        return 'object';
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return 'function';
      case 'NewExpression':
        return node.callee.name || 'object';
      case 'BinaryExpression':
        return this.inferBinaryExpressionType(node);
      case 'UnaryExpression':
        return this.inferUnaryExpressionType(node);
      default:
        return 'any';
    }
  }

  /**
   * Infer binary expression type
   * @param {object} node - Binary expression node
   * @returns {string} Inferred type
   */
  static inferBinaryExpressionType(node) {
    const arithmeticOps = ['+', '-', '*', '/', '%', '**'];
    const comparisonOps = ['==', '===', '!=', '!==', '<', '>', '<=', '>='];

    if (arithmeticOps.includes(node.operator)) return 'number';
    if (comparisonOps.includes(node.operator)) return 'boolean';

    return 'any';
  }

  /**
   * Infer unary expression type
   * @param {object} node - Unary expression node
   * @returns {string} Inferred type
   */
  static inferUnaryExpressionType(node) {
    if (node.operator === '!') return 'boolean';
    if (node.operator === 'typeof') return 'string';
    if (['+', '-', '~'].includes(node.operator)) return 'number';

    return 'any';
  }

  /**
   * Find TypeScript type errors
   * @param {string} code - Source code
   * @returns {array} Type errors
   */
  static findTypeScriptErrors(code) {
    // This is a simplified version
    // In production, use TypeScript compiler API
    const errors = [];

    try {
      const ast = ASTUtils.parse(code);

      ASTUtils.traverse(ast, {
        CallExpression(path) {
          // Check for potential type mismatches
          // This is very basic - real implementation would use TS compiler
        },
      });
    } catch (error) {
      errors.push({
        message: error.message,
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Generate type suggestions
   * @param {string} code - Source code
   * @param {boolean} isTypeScript - Is TypeScript
   * @returns {array} Suggestions
   */
  static generateTypeSuggestions(code, isTypeScript) {
    const suggestions = [];

    try {
      const ast = ASTUtils.parse(code);

      if (!isTypeScript) {
        // Suggest adding types to JavaScript
        ASTUtils.traverse(ast, {
          FunctionDeclaration(path) {
            if (!path.node.returnType) {
              suggestions.push({
                type: 'add-return-type',
                message: `Consider adding return type to function '${
                  path.node.id?.name || '<anonymous>'
                }'`,
                location: ASTUtils.getLocation(path.node),
              });
            }

            path.node.params.forEach((param, index) => {
              if (!param.typeAnnotation) {
                suggestions.push({
                  type: 'add-param-type',
                  message: `Consider adding type to parameter '${
                    param.name || `param${index}`
                  }'`,
                  location: ASTUtils.getLocation(param),
                });
              }
            });
          },

          VariableDeclarator(path) {
            if (path.node.init && !path.node.id.typeAnnotation) {
              const inferredType = this.inferExpressionType(path.node.init);
              if (inferredType !== 'any') {
                suggestions.push({
                  type: 'add-variable-type',
                  message: `Consider adding type annotation: ${inferredType}`,
                  location: ASTUtils.getLocation(path.node),
                  suggestedType: inferredType,
                });
              }
            }
          },
        });
      } else {
        // Suggest improvements to TypeScript
        ASTUtils.traverse(ast, {
          TSTypeAliasDeclaration(path) {
            // Check for overly complex types
            const typeStr = ASTUtils.generate(path.node.typeAnnotation).code;
            if (typeStr.length > 100) {
              suggestions.push({
                type: 'simplify-type',
                message: `Type '${path.node.id.name}' is complex, consider breaking it down`,
                location: ASTUtils.getLocation(path.node),
              });
            }
          },
        });
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return suggestions;
  }

  /**
   * Convert JavaScript to TypeScript
   * @param {string} code - JavaScript code
   * @returns {string} TypeScript code
   */
  static convertToTypeScript(code) {
    try {
      const ast = ASTUtils.parse(code);
      const inferred = this.inferJavaScriptTypes(code);

      // Add type annotations based on inferred types
      ASTUtils.traverse(ast, {
        FunctionDeclaration(path) {
          const funcInfo = inferred.functions.find(
            (f) => f.name === (path.node.id?.name || '<anonymous>')
          );

          if (funcInfo && !path.node.returnType) {
            // In a real implementation, we would add the type annotation to the AST
            // This is a simplified version
          }
        },
      });

      return ASTUtils.generate(ast).code;
    } catch (error) {
      throw new Error(`Failed to convert to TypeScript: ${error.message}`);
    }
  }
}

module.exports = TypeAnalyzer;
