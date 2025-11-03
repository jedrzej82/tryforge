/**
 * Code Analyzer
 * Analyzes code quality, complexity, and duplication
 */

const fs = require('fs-extra');
const ASTUtils = require('../utils/ast-utils');
const ScopeAnalyzer = require('../utils/scope-analyzer');

class CodeAnalyzer {
  /**
   * Analyze code file
   * @param {string} filePath - File path
   * @returns {object} Analysis result
   */
  static async analyzeFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf8');
      return this.analyzeCode(code, filePath);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze code
   * @param {string} code - Source code
   * @param {string} filePath - File path (optional)
   * @returns {object} Analysis result
   */
  static analyzeCode(code, filePath = null) {
    try {
      const ast = ASTUtils.parse(code);

      return {
        success: true,
        filePath,
        complexity: this.analyzeComplexity(ast),
        duplication: this.analyzeDuplication(ast),
        deadCode: this.findDeadCode(ast, code),
        longFunctions: this.findLongFunctions(ast),
        deepNesting: this.findDeepNesting(ast),
        unusedImports: this.findUnusedImports(ast),
        metrics: this.calculateMetrics(code, ast),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze cyclomatic complexity
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Complexity results
   */
  static analyzeComplexity(ast) {
    const functions = ASTUtils.findFunctions(ast);
    const complexityResults = [];

    for (const func of functions) {
      const complexity = this.calculateCyclomaticComplexity(func.node);
      const cognitiveComplexity = this.calculateCognitiveComplexity(func.node);

      if (complexity > 10 || cognitiveComplexity > 15) {
        complexityResults.push({
          name: ASTUtils.getFunctionName(func.node),
          type: func.type,
          cyclomaticComplexity: complexity,
          cognitiveComplexity,
          location: ASTUtils.getLocation(func.node),
          severity: this.getComplexitySeverity(complexity),
        });
      }
    }

    return complexityResults;
  }

  /**
   * Calculate cyclomatic complexity
   * @param {object} node - Function node
   * @returns {number} Complexity
   */
  static calculateCyclomaticComplexity(node) {
    let complexity = 1;

    ASTUtils.traverse(node, {
      IfStatement() {
        complexity++;
      },
      SwitchCase(path) {
        if (path.node.test) complexity++;
      },
      ForStatement() {
        complexity++;
      },
      ForInStatement() {
        complexity++;
      },
      ForOfStatement() {
        complexity++;
      },
      WhileStatement() {
        complexity++;
      },
      DoWhileStatement() {
        complexity++;
      },
      ConditionalExpression() {
        complexity++;
      },
      LogicalExpression(path) {
        if (path.node.operator === '&&' || path.node.operator === '||') {
          complexity++;
        }
      },
      CatchClause() {
        complexity++;
      },
    });

    return complexity;
  }

  /**
   * Calculate cognitive complexity
   * @param {object} node - Function node
   * @returns {number} Complexity
   */
  static calculateCognitiveComplexity(node) {
    let complexity = 0;
    let nestingLevel = 0;

    ASTUtils.traverse(node, {
      enter(path) {
        const nodeType = path.node.type;

        // Increment for control flow
        if (
          nodeType === 'IfStatement' ||
          nodeType === 'SwitchStatement' ||
          nodeType === 'ForStatement' ||
          nodeType === 'ForInStatement' ||
          nodeType === 'ForOfStatement' ||
          nodeType === 'WhileStatement' ||
          nodeType === 'DoWhileStatement' ||
          nodeType === 'ConditionalExpression'
        ) {
          complexity += 1 + nestingLevel;
          nestingLevel++;
        }

        // Increment for logical operators
        if (
          nodeType === 'LogicalExpression' &&
          (path.node.operator === '&&' || path.node.operator === '||')
        ) {
          complexity++;
        }

        // Increment for catch
        if (nodeType === 'CatchClause') {
          complexity += 1 + nestingLevel;
          nestingLevel++;
        }
      },

      exit(path) {
        const nodeType = path.node.type;

        if (
          nodeType === 'IfStatement' ||
          nodeType === 'SwitchStatement' ||
          nodeType === 'ForStatement' ||
          nodeType === 'ForInStatement' ||
          nodeType === 'ForOfStatement' ||
          nodeType === 'WhileStatement' ||
          nodeType === 'DoWhileStatement' ||
          nodeType === 'ConditionalExpression' ||
          nodeType === 'CatchClause'
        ) {
          nestingLevel--;
        }
      },
    });

    return complexity;
  }

  /**
   * Get complexity severity
   * @param {number} complexity - Complexity value
   * @returns {string} Severity
   */
  static getComplexitySeverity(complexity) {
    if (complexity > 20) return 'critical';
    if (complexity > 15) return 'high';
    if (complexity > 10) return 'medium';
    return 'low';
  }

  /**
   * Analyze code duplication
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Duplication results
   */
  static analyzeDuplication(ast) {
    const blocks = this.extractCodeBlocks(ast);
    const duplicates = [];

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const similarity = this.calculateSimilarity(blocks[i].code, blocks[j].code);

        if (similarity > 0.8) {
          duplicates.push({
            block1: blocks[i],
            block2: blocks[j],
            similarity: Math.round(similarity * 100),
            lines: blocks[i].code.split('\n').length,
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Extract code blocks from AST
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Code blocks
   */
  static extractCodeBlocks(ast) {
    const blocks = [];

    ASTUtils.traverse(ast, {
      BlockStatement(path) {
        if (path.node.body.length > 5) {
          const code = ASTUtils.generate(path.node).code;
          blocks.push({
            type: 'block',
            code,
            location: ASTUtils.getLocation(path.node),
          });
        }
      },

      FunctionDeclaration(path) {
        const code = ASTUtils.generate(path.node).code;
        blocks.push({
          type: 'function',
          name: path.node.id?.name,
          code,
          location: ASTUtils.getLocation(path.node),
        });
      },
    });

    return blocks;
  }

  /**
   * Calculate code similarity
   * @param {string} code1 - First code
   * @param {string} code2 - Second code
   * @returns {number} Similarity (0-1)
   */
  static calculateSimilarity(code1, code2) {
    const tokens1 = this.tokenize(code1);
    const tokens2 = this.tokenize(code2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const common = tokens1.filter((token) => tokens2.includes(token)).length;
    const total = Math.max(tokens1.length, tokens2.length);

    return common / total;
  }

  /**
   * Tokenize code
   * @param {string} code - Source code
   * @returns {array} Tokens
   */
  static tokenize(code) {
    return code
      .replace(/\s+/g, ' ')
      .split(/[\s;,(){}[\]]/g)
      .filter((token) => token.length > 0);
  }

  /**
   * Find dead code
   * @param {object} ast - Abstract Syntax Tree
   * @param {string} code - Source code
   * @returns {array} Dead code
   */
  static findDeadCode(ast, code) {
    const deadCode = [];

    // Find unreachable code
    ASTUtils.traverse(ast, {
      ReturnStatement(path) {
        const parent = path.parent;
        if (parent.type === 'BlockStatement') {
          const index = parent.body.indexOf(path.node);
          if (index < parent.body.length - 1) {
            deadCode.push({
              type: 'unreachable',
              message: 'Code after return statement',
              location: ASTUtils.getLocation(parent.body[index + 1]),
            });
          }
        }
      },

      ThrowStatement(path) {
        const parent = path.parent;
        if (parent.type === 'BlockStatement') {
          const index = parent.body.indexOf(path.node);
          if (index < parent.body.length - 1) {
            deadCode.push({
              type: 'unreachable',
              message: 'Code after throw statement',
              location: ASTUtils.getLocation(parent.body[index + 1]),
            });
          }
        }
      },
    });

    // Find unused variables
    const unusedVars = ScopeAnalyzer.findUnusedVariables(code);
    deadCode.push(
      ...unusedVars.map((v) => ({
        type: 'unused-variable',
        message: `Unused variable: ${v.name}`,
        location: v.loc,
      }))
    );

    return deadCode;
  }

  /**
   * Find long functions
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Long functions
   */
  static findLongFunctions(ast) {
    const functions = ASTUtils.findFunctions(ast);
    const longFunctions = [];

    for (const func of functions) {
      const loc = ASTUtils.getLocation(func.node);
      if (loc) {
        const lines = loc.end.line - loc.start.line + 1;
        if (lines > 50) {
          longFunctions.push({
            name: ASTUtils.getFunctionName(func.node),
            lines,
            location: loc,
            severity: lines > 100 ? 'high' : 'medium',
          });
        }
      }
    }

    return longFunctions;
  }

  /**
   * Find deep nesting
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Deep nesting
   */
  static findDeepNesting(ast) {
    const deepNesting = [];

    ASTUtils.traverse(ast, {
      enter(path) {
        const depth = this.getNestingDepth(path);
        if (depth > 4) {
          deepNesting.push({
            type: path.node.type,
            depth,
            location: ASTUtils.getLocation(path.node),
            severity: depth > 6 ? 'high' : 'medium',
          });
        }
      },
    });

    return deepNesting;
  }

  /**
   * Get nesting depth
   * @param {object} path - AST path
   * @returns {number} Depth
   */
  static getNestingDepth(path) {
    let depth = 0;
    let current = path;

    while (current.parent) {
      if (
        current.parent.type === 'IfStatement' ||
        current.parent.type === 'ForStatement' ||
        current.parent.type === 'WhileStatement' ||
        current.parent.type === 'SwitchStatement'
      ) {
        depth++;
      }
      current = current.parentPath;
    }

    return depth;
  }

  /**
   * Find unused imports
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Unused imports
   */
  static findUnusedImports(ast) {
    const imports = ASTUtils.findImports(ast);
    const unusedImports = [];

    for (const imp of imports) {
      for (const spec of imp.specifiers) {
        const isUsed = this.isIdentifierUsed(ast, spec.local);
        if (!isUsed) {
          unusedImports.push({
            name: spec.local,
            source: imp.source,
            location: ASTUtils.getLocation(imp.node),
          });
        }
      }
    }

    return unusedImports;
  }

  /**
   * Check if identifier is used
   * @param {object} ast - Abstract Syntax Tree
   * @param {string} name - Identifier name
   * @returns {boolean} Is used
   */
  static isIdentifierUsed(ast, name) {
    let isUsed = false;

    ASTUtils.traverse(ast, {
      Identifier(path) {
        if (path.node.name === name && path.key !== 'imported') {
          isUsed = true;
        }
      },
    });

    return isUsed;
  }

  /**
   * Calculate code metrics
   * @param {string} code - Source code
   * @param {object} ast - Abstract Syntax Tree
   * @returns {object} Metrics
   */
  static calculateMetrics(code, ast) {
    const lines = code.split('\n');
    const functions = ASTUtils.findFunctions(ast);
    const classes = ASTUtils.findClasses(ast);

    return {
      totalLines: lines.length,
      codeLines: lines.filter((line) => line.trim().length > 0).length,
      commentLines: this.countCommentLines(code),
      functions: functions.length,
      classes: classes.length,
      avgFunctionLength: this.calculateAvgFunctionLength(functions),
      maxFunctionLength: this.calculateMaxFunctionLength(functions),
    };
  }

  /**
   * Count comment lines
   * @param {string} code - Source code
   * @returns {number} Comment lines
   */
  static countCommentLines(code) {
    const singleLineComments = (code.match(/\/\/.*/g) || []).length;
    const multiLineComments = (code.match(/\/\*[\s\S]*?\*\//g) || [])
      .map((c) => c.split('\n').length)
      .reduce((a, b) => a + b, 0);

    return singleLineComments + multiLineComments;
  }

  /**
   * Calculate average function length
   * @param {array} functions - Function nodes
   * @returns {number} Average length
   */
  static calculateAvgFunctionLength(functions) {
    if (functions.length === 0) return 0;

    const totalLines = functions.reduce((sum, func) => {
      const loc = ASTUtils.getLocation(func.node);
      return sum + (loc ? loc.end.line - loc.start.line + 1 : 0);
    }, 0);

    return Math.round(totalLines / functions.length);
  }

  /**
   * Calculate max function length
   * @param {array} functions - Function nodes
   * @returns {number} Max length
   */
  static calculateMaxFunctionLength(functions) {
    if (functions.length === 0) return 0;

    return Math.max(
      ...functions.map((func) => {
        const loc = ASTUtils.getLocation(func.node);
        return loc ? loc.end.line - loc.start.line + 1 : 0;
      })
    );
  }
}

module.exports = CodeAnalyzer;
