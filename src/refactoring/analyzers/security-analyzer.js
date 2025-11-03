/**
 * Security Analyzer
 * Analyzes code for security vulnerabilities
 */

const fs = require('fs-extra');
const ASTUtils = require('../utils/ast-utils');

class SecurityAnalyzer {
  /**
   * Analyze file for security issues
   * @param {string} filePath - File path
   * @returns {object} Security analysis
   */
  static async analyzeFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf8');

      return {
        success: true,
        filePath,
        vulnerabilities: this.findVulnerabilities(code),
        hardcodedSecrets: this.findHardcodedSecrets(code),
        sqlInjection: this.findSQLInjectionRisks(code),
        xss: this.findXSSVulnerabilities(code),
        insecurePatterns: this.findInsecurePatterns(code),
        severity: this.calculateSeverity(code),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find security vulnerabilities
   * @param {string} code - Source code
   * @returns {array} Vulnerabilities
   */
  static findVulnerabilities(code) {
    const vulnerabilities = [];

    try {
      const ast = ASTUtils.parse(code);

      // Check for eval usage
      ASTUtils.traverse(ast, {
        CallExpression(path) {
          const callee = path.node.callee;

          // eval() usage
          if (callee.name === 'eval') {
            vulnerabilities.push({
              type: 'dangerous-function',
              severity: 'high',
              message: 'Use of eval() is dangerous and should be avoided',
              function: 'eval',
              location: ASTUtils.getLocation(path.node),
            });
          }

          // Function() constructor
          if (callee.name === 'Function') {
            vulnerabilities.push({
              type: 'dangerous-function',
              severity: 'high',
              message: 'Function constructor can execute arbitrary code',
              function: 'Function',
              location: ASTUtils.getLocation(path.node),
            });
          }

          // setTimeout/setInterval with string
          if (
            (callee.name === 'setTimeout' || callee.name === 'setInterval') &&
            path.node.arguments[0]?.type === 'StringLiteral'
          ) {
            vulnerabilities.push({
              type: 'dangerous-function',
              severity: 'medium',
              message: `${callee.name} with string argument can execute arbitrary code`,
              function: callee.name,
              location: ASTUtils.getLocation(path.node),
            });
          }

          // exec without sanitization
          if (
            callee.property?.name === 'exec' ||
            callee.name === 'exec' ||
            callee.name === 'execSync'
          ) {
            vulnerabilities.push({
              type: 'command-injection',
              severity: 'high',
              message: 'Command execution without sanitization can lead to injection',
              function: 'exec',
              location: ASTUtils.getLocation(path.node),
            });
          }

          // innerHTML usage
          if (callee.property?.name === 'innerHTML') {
            vulnerabilities.push({
              type: 'xss',
              severity: 'high',
              message: 'Using innerHTML can lead to XSS vulnerabilities',
              property: 'innerHTML',
              location: ASTUtils.getLocation(path.node),
            });
          }
        },

        MemberExpression(path) {
          // document.write
          if (
            path.node.object.name === 'document' &&
            path.node.property.name === 'write'
          ) {
            vulnerabilities.push({
              type: 'xss',
              severity: 'medium',
              message: 'document.write can lead to XSS vulnerabilities',
              property: 'document.write',
              location: ASTUtils.getLocation(path.node),
            });
          }
        },
      });
    } catch (error) {
      // Ignore parsing errors
    }

    return vulnerabilities;
  }

  /**
   * Find hardcoded secrets
   * @param {string} code - Source code
   * @returns {array} Hardcoded secrets
   */
  static findHardcodedSecrets(code) {
    const secrets = [];

    // Regex patterns for common secrets
    const patterns = [
      {
        name: 'API Key',
        regex: /api[_-]?key\s*[=:]\s*['"]([^'"]{20,})['"]|apikey\s*[=:]\s*['"]([^'"]{20,})['"]/gi,
        severity: 'critical',
      },
      {
        name: 'Password',
        regex: /password\s*[=:]\s*['"]([^'"]+)['"]|pwd\s*[=:]\s*['"]([^'"]+)['"]/gi,
        severity: 'critical',
      },
      {
        name: 'Secret Key',
        regex: /secret[_-]?key\s*[=:]\s*['"]([^'"]{20,})['"]|secretkey\s*[=:]\s*['"]([^'"]{20,})['"]/gi,
        severity: 'critical',
      },
      {
        name: 'AWS Access Key',
        regex: /AKIA[0-9A-Z]{16}/g,
        severity: 'critical',
      },
      {
        name: 'Private Key',
        regex: /-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----/g,
        severity: 'critical',
      },
      {
        name: 'JWT Token',
        regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
        severity: 'high',
      },
      {
        name: 'Database URL',
        regex: /(mongodb|mysql|postgresql):\/\/[^\s'"]+/gi,
        severity: 'high',
      },
    ];

    const lines = code.split('\n');
    patterns.forEach((pattern) => {
      lines.forEach((line, index) => {
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          return;
        }

        const matches = line.matchAll(pattern.regex);
        for (const match of matches) {
          secrets.push({
            type: 'hardcoded-secret',
            name: pattern.name,
            severity: pattern.severity,
            message: `Possible hardcoded ${pattern.name} detected`,
            line: index + 1,
            preview: this.maskSecret(match[0]),
          });
        }
      });
    });

    return secrets;
  }

  /**
   * Mask secret for display
   * @param {string} secret - Secret string
   * @returns {string} Masked secret
   */
  static maskSecret(secret) {
    if (secret.length <= 8) return '***';
    return secret.substring(0, 4) + '***' + secret.substring(secret.length - 4);
  }

  /**
   * Find SQL injection risks
   * @param {string} code - Source code
   * @returns {array} SQL injection risks
   */
  static findSQLInjectionRisks(code) {
    const risks = [];

    try {
      const ast = ASTUtils.parse(code);

      ASTUtils.traverse(ast, {
        CallExpression(path) {
          const callee = path.node.callee;

          // Check for query() or execute() calls
          if (
            (callee.property?.name === 'query' ||
              callee.property?.name === 'execute') &&
            path.node.arguments.length > 0
          ) {
            const firstArg = path.node.arguments[0];

            // Check if query is built with string concatenation
            if (
              firstArg.type === 'BinaryExpression' ||
              firstArg.type === 'TemplateLiteral'
            ) {
              risks.push({
                type: 'sql-injection',
                severity: 'high',
                message: 'SQL query built with string concatenation/template',
                location: ASTUtils.getLocation(path.node),
                recommendation: 'Use parameterized queries instead',
              });
            }
          }
        },

        TemplateLiteral(path) {
          const code = ASTUtils.generate(path.node).code.toLowerCase();
          if (
            code.includes('select ') ||
            code.includes('insert ') ||
            code.includes('update ') ||
            code.includes('delete ')
          ) {
            risks.push({
              type: 'sql-injection',
              severity: 'high',
              message: 'SQL query in template literal may be vulnerable',
              location: ASTUtils.getLocation(path.node),
              recommendation: 'Use parameterized queries instead',
            });
          }
        },
      });
    } catch (error) {
      // Ignore parsing errors
    }

    return risks;
  }

  /**
   * Find XSS vulnerabilities
   * @param {string} code - Source code
   * @returns {array} XSS vulnerabilities
   */
  static findXSSVulnerabilities(code) {
    const vulnerabilities = [];

    try {
      const ast = ASTUtils.parse(code);

      ASTUtils.traverse(ast, {
        MemberExpression(path) {
          // innerHTML
          if (path.node.property.name === 'innerHTML') {
            vulnerabilities.push({
              type: 'xss',
              severity: 'high',
              message: 'innerHTML usage can lead to XSS',
              property: 'innerHTML',
              location: ASTUtils.getLocation(path.node),
              recommendation: 'Use textContent or sanitize input',
            });
          }

          // outerHTML
          if (path.node.property.name === 'outerHTML') {
            vulnerabilities.push({
              type: 'xss',
              severity: 'high',
              message: 'outerHTML usage can lead to XSS',
              property: 'outerHTML',
              location: ASTUtils.getLocation(path.node),
              recommendation: 'Sanitize input before using outerHTML',
            });
          }
        },

        CallExpression(path) {
          const callee = path.node.callee;

          // document.write
          if (
            callee.object?.name === 'document' &&
            callee.property?.name === 'write'
          ) {
            vulnerabilities.push({
              type: 'xss',
              severity: 'medium',
              message: 'document.write can lead to XSS',
              function: 'document.write',
              location: ASTUtils.getLocation(path.node),
              recommendation: 'Use safer DOM manipulation methods',
            });
          }

          // dangerouslySetInnerHTML (React)
          if (
            callee.property?.name === 'createElement' &&
            path.node.arguments.length > 1
          ) {
            const props = path.node.arguments[1];
            if (
              props?.type === 'ObjectExpression' &&
              props.properties.some(
                (prop) => prop.key?.name === 'dangerouslySetInnerHTML'
              )
            ) {
              vulnerabilities.push({
                type: 'xss',
                severity: 'high',
                message: 'dangerouslySetInnerHTML can lead to XSS',
                property: 'dangerouslySetInnerHTML',
                location: ASTUtils.getLocation(path.node),
                recommendation: 'Sanitize HTML before using',
              });
            }
          }
        },
      });
    } catch (error) {
      // Ignore parsing errors
    }

    return vulnerabilities;
  }

  /**
   * Find insecure patterns
   * @param {string} code - Source code
   * @returns {array} Insecure patterns
   */
  static findInsecurePatterns(code) {
    const patterns = [];

    try {
      const ast = ASTUtils.parse(code);

      ASTUtils.traverse(ast, {
        // Weak crypto
        CallExpression(path) {
          const callee = path.node.callee;

          // MD5/SHA1 usage
          if (
            callee.property?.name === 'createHash' &&
            path.node.arguments[0]?.value
          ) {
            const algorithm = path.node.arguments[0].value.toLowerCase();
            if (algorithm === 'md5' || algorithm === 'sha1') {
              patterns.push({
                type: 'weak-crypto',
                severity: 'medium',
                message: `${algorithm.toUpperCase()} is cryptographically weak`,
                algorithm,
                location: ASTUtils.getLocation(path.node),
                recommendation: 'Use SHA-256 or stronger',
              });
            }
          }

          // Math.random() for security
          if (callee.property?.name === 'random' && callee.object?.name === 'Math') {
            patterns.push({
              type: 'weak-random',
              severity: 'medium',
              message: 'Math.random() is not cryptographically secure',
              location: ASTUtils.getLocation(path.node),
              recommendation: 'Use crypto.randomBytes() for security purposes',
            });
          }
        },

        // CORS wildcard
        ObjectExpression(path) {
          path.node.properties.forEach((prop) => {
            if (
              prop.key?.name === 'origin' &&
              prop.value?.value === '*'
            ) {
              patterns.push({
                type: 'cors-wildcard',
                severity: 'medium',
                message: 'CORS configured with wildcard origin',
                location: ASTUtils.getLocation(prop),
                recommendation: 'Specify allowed origins explicitly',
              });
            }
          });
        },
      });
    } catch (error) {
      // Ignore parsing errors
    }

    return patterns;
  }

  /**
   * Calculate overall severity
   * @param {string} code - Source code
   * @returns {object} Severity calculation
   */
  static calculateSeverity(code) {
    const vulnerabilities = this.findVulnerabilities(code);
    const secrets = this.findHardcodedSecrets(code);
    const sql = this.findSQLInjectionRisks(code);
    const xss = this.findXSSVulnerabilities(code);
    const patterns = this.findInsecurePatterns(code);

    const allIssues = [
      ...vulnerabilities,
      ...secrets,
      ...sql,
      ...xss,
      ...patterns,
    ];

    const counts = {
      critical: allIssues.filter((i) => i.severity === 'critical').length,
      high: allIssues.filter((i) => i.severity === 'high').length,
      medium: allIssues.filter((i) => i.severity === 'medium').length,
      low: allIssues.filter((i) => i.severity === 'low').length,
    };

    let overallSeverity = 'safe';
    if (counts.critical > 0) overallSeverity = 'critical';
    else if (counts.high > 0) overallSeverity = 'high';
    else if (counts.medium > 0) overallSeverity = 'medium';
    else if (counts.low > 0) overallSeverity = 'low';

    return {
      overall: overallSeverity,
      counts,
      total: allIssues.length,
    };
  }

  /**
   * Get security score
   * @param {string} code - Source code
   * @returns {number} Score (0-100)
   */
  static getSecurityScore(code) {
    const severity = this.calculateSeverity(code);

    let score = 100;
    score -= severity.counts.critical * 20;
    score -= severity.counts.high * 10;
    score -= severity.counts.medium * 5;
    score -= severity.counts.low * 2;

    return Math.max(0, score);
  }
}

module.exports = SecurityAnalyzer;
