/**
 * Input Validation Analyzer
 * Analyzes input validation and sanitization practices
 */

const fs = require('fs').promises;
const path = require('path');

class InputValidationAnalyzer {
  constructor() {
    this.userInputSources = [
      'req.body',
      'req.query',
      'req.params',
      'req.headers',
      'req.cookies',
      'request.body',
      'request.query',
      'request.params',
      'body',
      'query',
      'params'
    ];

    this.validationLibraries = [
      'joi',
      'yup',
      'validator',
      'express-validator',
      'class-validator',
      'ajv',
      'zod'
    ];
  }

  /**
   * Analyze input validation in project
   */
  async analyze(projectPath) {
    const findings = [];

    // Scan files for input validation issues
    const files = await this.getFiles(projectPath);

    for (const file of files) {
      const fileFindings = await this.analyzeFile(file);
      findings.push(...fileFindings);
    }

    return findings;
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath) {
    const findings = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for missing input validation
      findings.push(...this.checkMissingValidation(content, filePath));

      // Check for type coercion issues
      findings.push(...this.checkTypeCoercion(content, filePath));

      // Check for mass assignment vulnerabilities
      findings.push(...this.checkMassAssignment(content, filePath));

      // Check for unsafe input handling
      findings.push(...this.checkUnsafeInputHandling(content, filePath));

      // Check for missing sanitization
      findings.push(...this.checkMissingSanitization(content, filePath));
    } catch (error) {
      // Skip file
    }

    return findings;
  }

  /**
   * Check for missing input validation
   */
  checkMissingValidation(content, filePath) {
    const findings = [];

    // Look for route handlers that accept user input
    const routePattern = /(?:app|router)\.(post|put|patch)\s*\([^)]+\)\s*,?\s*(?:async\s*)?\([^)]*(?:req|request)[^)]*\)\s*(?:=>|{)/gi;
    const matches = [...content.matchAll(routePattern)];

    for (const match of matches) {
      const context = this.getContext(content, match.index, 15);

      // Check if validation is present
      const hasValidation = this.hasValidation(context);

      if (!hasValidation) {
        const lineNumber = this.getLineNumber(content, match.index);

        findings.push({
          type: 'missing-validation',
          name: 'Missing Input Validation',
          severity: 'HIGH',
          description: 'Route handler accepts user input without validation',
          file: filePath,
          line: lineNumber,
          code: match[0],
          remediation: 'Add input validation using a validation library (joi, yup, express-validator, etc.)',
          cwe: 'CWE-20',
          cvss: 7.5
        });
      }
    }

    return findings;
  }

  /**
   * Check if validation is present in context
   */
  hasValidation(context) {
    // Check for validation library usage
    for (const lib of this.validationLibraries) {
      if (context.includes(lib)) {
        return true;
      }
    }

    // Check for manual validation
    const validationPatterns = [
      /validate/i,
      /schema\.parse/i,
      /\.check\(/,
      /\.isValid/,
      /if\s*\(!.*\)/,  // Simple checks
      /typeof\s+\w+\s*===?/,
      /instanceof/,
      /Array\.isArray/
    ];

    return validationPatterns.some(pattern => pattern.test(context));
  }

  /**
   * Check for type coercion issues
   */
  checkTypeCoercion(content, filePath) {
    const findings = [];

    // Check for == comparisons (should use ===)
    const coercionPattern = /(?:if|while)\s*\([^)]*(?:req\.|body\.|query\.|params\.)[^)]*==(?!=)[^)]*\)/gi;
    const matches = [...content.matchAll(coercionPattern)];

    for (const match of matches) {
      const lineNumber = this.getLineNumber(content, match.index);

      findings.push({
        type: 'type-coercion',
        name: 'Type Coercion Vulnerability',
        severity: 'MEDIUM',
        description: 'Using == instead of === with user input can lead to type coercion issues',
        file: filePath,
        line: lineNumber,
        code: match[0],
        remediation: 'Use strict equality (===) instead of == to avoid type coercion',
        cwe: 'CWE-1286',
        cvss: 5.5
      });
    }

    return findings;
  }

  /**
   * Check for mass assignment vulnerabilities
   */
  checkMassAssignment(content, filePath) {
    const findings = [];

    // Check for direct assignment of req.body to model
    const massAssignPattern = /(?:User|Model|Entity)\.(create|update|save|insert)\s*\(\s*req\.body\s*\)/gi;
    const matches = [...content.matchAll(massAssignPattern)];

    for (const match of matches) {
      const lineNumber = this.getLineNumber(content, match.index);

      findings.push({
        type: 'mass-assignment',
        name: 'Mass Assignment Vulnerability',
        severity: 'HIGH',
        description: 'Directly assigning req.body to model allows users to set any field',
        file: filePath,
        line: lineNumber,
        code: match[0],
        remediation: 'Explicitly whitelist allowed fields or use DTO (Data Transfer Objects)',
        cwe: 'CWE-915',
        cvss: 7.5
      });
    }

    return findings;
  }

  /**
   * Check for unsafe input handling
   */
  checkUnsafeInputHandling(content, filePath) {
    const findings = [];

    // Check for parseInt/parseFloat without validation
    const parsePattern = /parse(?:Int|Float)\s*\(\s*(?:req\.|body\.|query\.|params\.)[^)]+\)(?!\s*(?:===?|!==?|>|<|\|\||&&))/gi;
    const matches = [...content.matchAll(parsePattern)];

    for (const match of matches) {
      const lineNumber = this.getLineNumber(content, match.index);
      const context = this.getContext(content, match.index, 5);

      // Check if there's a NaN check nearby
      if (!/isNaN|Number\.isNaN/.test(context)) {
        findings.push({
          type: 'unsafe-parse',
          name: 'Unsafe Number Parsing',
          severity: 'MEDIUM',
          description: 'parseInt/parseFloat used without checking for NaN',
          file: filePath,
          line: lineNumber,
          code: match[0],
          remediation: 'Check for NaN after parsing: if (isNaN(value)) { throw error }',
          cwe: 'CWE-20',
          cvss: 5.5
        });
      }
    }

    return findings;
  }

  /**
   * Check for missing sanitization
   */
  checkMissingSanitization(content, filePath) {
    const findings = [];

    // Check for direct use of user input in responses
    const unsanitizedPattern = /(?:res\.send|res\.json|response\.send|response\.json)\s*\([^)]*(?:req\.|body\.|query\.|params\.)[^)]*\)/gi;
    const matches = [...content.matchAll(unsanitizedPattern)];

    for (const match of matches) {
      const lineNumber = this.getLineNumber(content, match.index);
      const context = this.getContext(content, match.index, 5);

      // Check if sanitization is present
      if (!this.hasSanitization(context)) {
        findings.push({
          type: 'missing-sanitization',
          name: 'Missing Output Sanitization',
          severity: 'MEDIUM',
          description: 'User input returned in response without sanitization',
          file: filePath,
          line: lineNumber,
          code: match[0],
          remediation: 'Sanitize user input before including in responses',
          cwe: 'CWE-79',
          cvss: 6.0
        });
      }
    }

    return findings;
  }

  /**
   * Check if sanitization is present
   */
  hasSanitization(context) {
    const sanitizationPatterns = [
      /sanitize/i,
      /escape/i,
      /DOMPurify/,
      /xss\(/,
      /validator\.escape/,
      /\.trim\(\)/,
      /\.toLowerCase\(\)/
    ];

    return sanitizationPatterns.some(pattern => pattern.test(context));
  }

  /**
   * Get files recursively
   */
  async getFiles(dir, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
    const files = [];
    const exclude = ['node_modules', 'dist', 'build', '.git', 'coverage'];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !exclude.includes(entry.name)) {
          const subFiles = await this.getFiles(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return files;
  }

  /**
   * Get line number from string index
   */
  getLineNumber(code, index) {
    return code.substring(0, index).split('\n').length;
  }

  /**
   * Get code context
   */
  getContext(code, index, contextLines = 5) {
    const lines = code.split('\n');
    const lineNumber = this.getLineNumber(code, index);
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);

    return lines.slice(start, end).join('\n');
  }

  /**
   * Get recommendations
   */
  getRecommendations(findings) {
    const recommendations = [];

    const byType = findings.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {});

    if (byType['missing-validation']) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Input Validation',
        recommendation: `Add input validation to ${byType['missing-validation']} endpoints. Use a validation library like joi, yup, or express-validator.`,
        libraries: this.validationLibraries
      });
    }

    if (byType['mass-assignment']) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Mass Assignment',
        recommendation: 'Use DTOs or explicitly whitelist allowed fields. Never directly assign req.body to models.',
        example: 'const { name, email } = req.body; await User.create({ name, email });'
      });
    }

    if (byType['type-coercion']) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Type Safety',
        recommendation: 'Use strict equality (===) and validate input types explicitly.',
        example: 'if (typeof id === "string" && id === expectedId) { ... }'
      });
    }

    return recommendations;
  }

  /**
   * Get summary statistics
   */
  getSummary(findings) {
    return {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      byType: findings.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = InputValidationAnalyzer;
