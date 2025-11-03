/**
 * Extract Transformer
 * Handles extraction of functions, components, and constants
 */

const ASTUtils = require('../utils/ast-utils');
const ScopeAnalyzer = require('../utils/scope-analyzer');
const t = require('@babel/types');

class ExtractTransformer {
  /**
   * Extract function from code block
   * @param {string} code - Source code
   * @param {number} startLine - Start line
   * @param {number} endLine - End line
   * @param {string} functionName - New function name
   * @returns {object} Extract result
   */
  static extractFunction(code, startLine, endLine, functionName) {
    try {
      const ast = ASTUtils.parse(code);
      const linesToExtract = [];
      let extractedStatements = [];
      let insertionPath = null;

      // Find statements in the specified line range
      ASTUtils.traverse(ast, {
        Statement(path) {
          const loc = ASTUtils.getLocation(path.node);
          if (
            loc &&
            loc.start.line >= startLine &&
            loc.end.line <= endLine
          ) {
            linesToExtract.push(path);
            extractedStatements.push(path.node);
          }

          // Find where to insert the new function
          if (
            loc &&
            loc.start.line < startLine &&
            !insertionPath
          ) {
            insertionPath = path.parentPath;
          }
        },
      });

      if (extractedStatements.length === 0) {
        throw new Error('No statements found in the specified range');
      }

      // Analyze variables used in the extracted code
      const analysis = this.analyzeExtractedCode(extractedStatements);

      // Create new function
      const newFunction = this.createFunction(
        functionName,
        analysis.params,
        extractedStatements,
        analysis.returns
      );

      // Create function call
      const functionCall = this.createFunctionCall(
        functionName,
        analysis.params
      );

      // Replace extracted code with function call
      const firstPath = linesToExtract[0];
      firstPath.replaceWith(functionCall);

      // Remove other extracted statements
      for (let i = 1; i < linesToExtract.length; i++) {
        linesToExtract[i].remove();
      }

      // Insert new function
      if (insertionPath) {
        insertionPath.insertBefore(newFunction);
      }

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        functionName,
        params: analysis.params,
        returns: analysis.returns,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze extracted code
   * @param {array} statements - Statements to analyze
   * @returns {object} Analysis result
   */
  static analyzeExtractedCode(statements) {
    const usedVariables = new Set();
    const declaredVariables = new Set();
    let hasReturn = false;

    statements.forEach((statement) => {
      ASTUtils.traverse(statement, {
        Identifier(path) {
          if (path.isReferencedIdentifier()) {
            usedVariables.add(path.node.name);
          }
        },

        VariableDeclarator(path) {
          declaredVariables.add(path.node.id.name);
        },

        ReturnStatement() {
          hasReturn = true;
        },
      });
    });

    // Parameters are variables used but not declared
    const params = Array.from(usedVariables).filter(
      (v) => !declaredVariables.has(v) && !this.isGlobal(v)
    );

    return {
      params,
      returns: hasReturn,
    };
  }

  /**
   * Check if identifier is global
   * @param {string} name - Identifier name
   * @returns {boolean} Is global
   */
  static isGlobal(name) {
    const globals = [
      'console',
      'window',
      'document',
      'Math',
      'Date',
      'Array',
      'Object',
      'String',
      'Number',
      'Boolean',
      'undefined',
      'null',
      'true',
      'false',
    ];
    return globals.includes(name);
  }

  /**
   * Create function
   * @param {string} name - Function name
   * @param {array} params - Parameters
   * @param {array} body - Function body
   * @param {boolean} hasReturn - Has return statement
   * @returns {object} Function node
   */
  static createFunction(name, params, body, hasReturn) {
    const paramNodes = params.map((p) => t.identifier(p));
    const bodyStatements = body.map((s) => ASTUtils.cloneNode(s));

    return t.functionDeclaration(
      t.identifier(name),
      paramNodes,
      t.blockStatement(bodyStatements)
    );
  }

  /**
   * Create function call
   * @param {string} name - Function name
   * @param {array} params - Parameters
   * @returns {object} Call expression node
   */
  static createFunctionCall(name, params) {
    const args = params.map((p) => t.identifier(p));
    const callExpr = t.callExpression(t.identifier(name), args);

    return t.expressionStatement(callExpr);
  }

  /**
   * Extract variable
   * @param {string} code - Source code
   * @param {object} expression - Expression to extract
   * @param {string} variableName - Variable name
   * @param {string} kind - Variable kind (const, let, var)
   * @returns {object} Extract result
   */
  static extractVariable(code, expression, variableName, kind = 'const') {
    try {
      const ast = ASTUtils.parse(code);
      let extracted = false;

      ASTUtils.traverse(ast, {
        Expression(path) {
          const exprCode = ASTUtils.generate(path.node).code;
          if (exprCode === expression) {
            // Create variable declaration
            const varDeclaration = t.variableDeclaration(kind, [
              t.variableDeclarator(
                t.identifier(variableName),
                ASTUtils.cloneNode(path.node)
              ),
            ]);

            // Insert before the statement containing the expression
            const statement = path.getStatementParent();
            statement.insertBefore(varDeclaration);

            // Replace expression with variable reference
            path.replaceWith(t.identifier(variableName));

            extracted = true;
            path.stop();
          }
        },
      });

      if (!extracted) {
        throw new Error('Expression not found');
      }

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        variableName,
        kind,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract constant
   * @param {string} code - Source code
   * @param {any} value - Value to extract
   * @param {string} constantName - Constant name
   * @returns {object} Extract result
   */
  static extractConstant(code, value, constantName) {
    try {
      const ast = ASTUtils.parse(code);
      const valueStr = JSON.stringify(value);
      let extracted = false;
      let firstOccurrence = null;

      // Find all occurrences of the value
      ASTUtils.traverse(ast, {
        Literal(path) {
          const literalValue = JSON.stringify(path.node.value);
          if (literalValue === valueStr) {
            if (!firstOccurrence) {
              firstOccurrence = path;
            }
            // Replace with constant reference
            path.replaceWith(t.identifier(constantName));
            extracted = true;
          }
        },
      });

      if (!extracted) {
        throw new Error('Value not found');
      }

      // Create constant declaration at the top
      const constantDeclaration = t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(constantName),
          t.valueToNode(value)
        ),
      ]);

      // Insert at the top of the program
      ast.program.body.unshift(constantDeclaration);

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        constantName,
        value,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract React component
   * @param {string} code - Source code
   * @param {string} jsxCode - JSX code to extract
   * @param {string} componentName - Component name
   * @returns {object} Extract result
   */
  static extractComponent(code, jsxCode, componentName) {
    try {
      const ast = ASTUtils.parse(code);
      let extracted = false;

      ASTUtils.traverse(ast, {
        JSXElement(path) {
          const elementCode = ASTUtils.generate(path.node).code;
          if (elementCode.includes(jsxCode)) {
            // Analyze props needed
            const props = this.analyzeComponentProps(path.node);

            // Create component
            const component = this.createReactComponent(
              componentName,
              props,
              path.node
            );

            // Insert component before current function
            const funcParent = path.getFunctionParent();
            if (funcParent) {
              funcParent.insertBefore(component);
            }

            // Replace JSX with component usage
            const componentCall = this.createComponentUsage(
              componentName,
              props
            );
            path.replaceWith(componentCall);

            extracted = true;
            path.stop();
          }
        },
      });

      if (!extracted) {
        throw new Error('JSX code not found');
      }

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        componentName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze component props
   * @param {object} jsxNode - JSX node
   * @returns {array} Props
   */
  static analyzeComponentProps(jsxNode) {
    const props = new Set();

    ASTUtils.traverse(jsxNode, {
      Identifier(path) {
        if (path.isReferencedIdentifier()) {
          props.add(path.node.name);
        }
      },
    });

    return Array.from(props);
  }

  /**
   * Create React component
   * @param {string} name - Component name
   * @param {array} props - Props
   * @param {object} jsx - JSX element
   * @returns {object} Component node
   */
  static createReactComponent(name, props, jsx) {
    const propsParam = props.length > 0
      ? t.objectPattern(
          props.map((p) =>
            t.objectProperty(
              t.identifier(p),
              t.identifier(p),
              false,
              true
            )
          )
        )
      : t.identifier('props');

    return t.functionDeclaration(
      t.identifier(name),
      [propsParam],
      t.blockStatement([t.returnStatement(ASTUtils.cloneNode(jsx))])
    );
  }

  /**
   * Create component usage
   * @param {string} name - Component name
   * @param {array} props - Props
   * @returns {object} JSX element
   */
  static createComponentUsage(name, props) {
    const attributes = props.map((p) =>
      t.jsxAttribute(
        t.jsxIdentifier(p),
        t.jsxExpressionContainer(t.identifier(p))
      )
    );

    return t.jsxElement(
      t.jsxOpeningElement(t.jsxIdentifier(name), attributes, true),
      null,
      [],
      true
    );
  }

  /**
   * Extract method to separate function
   * @param {string} code - Source code
   * @param {string} className - Class name
   * @param {string} methodName - Method name
   * @returns {object} Extract result
   */
  static extractMethod(code, className, methodName) {
    try {
      const ast = ASTUtils.parse(code);
      let method = null;

      ASTUtils.traverse(ast, {
        ClassDeclaration(path) {
          if (path.node.id.name === className) {
            const methodIndex = path.node.body.body.findIndex(
              (m) => m.key?.name === methodName
            );

            if (methodIndex !== -1) {
              method = path.node.body.body[methodIndex];
              path.node.body.body.splice(methodIndex, 1);
            }
          }
        },
      });

      if (!method) {
        throw new Error(`Method ${methodName} not found in class ${className}`);
      }

      // Convert method to function
      const func = t.functionDeclaration(
        t.identifier(methodName),
        method.params,
        method.body
      );

      // Insert after class
      ASTUtils.traverse(ast, {
        ClassDeclaration(path) {
          if (path.node.id.name === className) {
            path.insertAfter(func);
            path.stop();
          }
        },
      });

      const newCode = ASTUtils.generate(ast).code;

      return {
        success: true,
        code: newCode,
        methodName,
        className,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = ExtractTransformer;
