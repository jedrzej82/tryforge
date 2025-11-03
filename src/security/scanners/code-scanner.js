/**
 * Code Security Scanner
 * Scans code for various security vulnerabilities including SQL injection, XSS, etc.
 */

const fs = require('fs').promises;
const path = require('path');
const SQLInjectionRules = require('../rules/sql-injection');
const XSSRules = require('../rules/xss-rules');

class CodeScanner {
  constructor() {
    this.sqlInjectionRules = new SQLInjectionRules();
    this.xssRules = new XSSRules();

    this.vulnerabilityPatterns = {
      commandInjection: {
        pattern: /(?:exec|spawn|execFile|execSync|spawnSync)\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
        severity: 'CRITICAL',
        name: 'Command Injection',
        cwe: 'CWE-78',
        cvss: 9.0
      },
      pathTraversal: {
        pattern: /(?:readFile|writeFile|unlink|rmdir|mkdir)\s*\([^)]*(?:req\.|params\.|query\.|body\.)(?:.*?\.\.\/)*/gi,
        severity: 'HIGH',
        name: 'Path Traversal',
        cwe: 'CWE-22',
        cvss: 7.5
      },
      insecureDeserialization: {
        pattern: /(?:JSON\.parse|deserialize|unserialize|pickle\.loads)\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
        severity: 'HIGH',
        name: 'Insecure Deserialization',
        cwe: 'CWE-502',
        cvss: 8.0
      },
      regexDoS: {
        pattern: /new RegExp\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
        severity: 'MEDIUM',
        name: 'Regular Expression Denial of Service (ReDoS)',
        cwe: 'CWE-1333',
        cvss: 5.5
      },
      xxe: {
        pattern: /(?:parseXmlString|parseFromString|DOMParser|xml2js\.parseString)\s*\([^)]*(?:req\.|params\.|query\.|body\.)(?!.*{[^}]*(?:noent|dtd).*false)/gi,
        severity: 'HIGH',
        name: 'XML External Entity (XXE)',
        cwe: 'CWE-611',
        cvss: 7.5
      },
      csrfMissing: {
        pattern: /(?:app\.post|router\.post|app\.put|router\.put|app\.delete|router\.delete)\s*\([^)]*\)\s*(?!.*csrf)/gi,
        severity: 'MEDIUM',
        name: 'Missing CSRF Protection',
        cwe: 'CWE-352',
        cvss: 6.5
      },
      unsafeRandomness: {
        pattern: /Math\.random\(\).*(?:token|secret|key|password|session)/gi,
        severity: 'HIGH',
        name: 'Insecure Randomness for Security',
        cwe: 'CWE-338',
        cvss: 7.5
      }
    };
  }

  /**
   * Scan a file for security vulnerabilities
   */
  async scanFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf-8');
      return this.scanCode(code, filePath);
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Scan code content for vulnerabilities
   */
  scanCode(code, filePath) {
    const findings = [];

    // SQL Injection
    findings.push(...this.sqlInjectionRules.scan(code, filePath));

    // XSS
    findings.push(...this.xssRules.scan(code, filePath));

    // Other vulnerabilities
    for (const [type, config] of Object.entries(this.vulnerabilityPatterns)) {
      const matches = [...code.matchAll(config.pattern)];

      for (const match of matches) {
        const lineNumber = this.getLineNumber(code, match.index);
        const context = this.getContext(code, match.index);

        findings.push({
          rule: type,
          name: config.name,
          severity: config.severity,
          description: this.getDescription(type),
          file: filePath,
          line: lineNumber,
          code: match[0],
          context: context,
          cwe: config.cwe,
          cvss: config.cvss,
          remediation: this.getRemediation(type)
        });
      }
    }

    return findings;
  }

  /**
   * Scan a directory recursively
   */
  async scanDirectory(dirPath, options = {}) {
    const {
      extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.php', '.py'],
      exclude = ['node_modules', 'dist', 'build', '.git', 'coverage']
    } = options;

    const findings = [];
    const files = await this.getFiles(dirPath, extensions, exclude);

    for (const file of files) {
      const fileFindings = await this.scanFile(file);
      findings.push(...fileFindings);
    }

    return findings;
  }

  /**
   * Get all files recursively
   */
  async getFiles(dir, extensions, exclude) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!exclude.includes(entry.name)) {
          const subFiles = await this.getFiles(fullPath, extensions, exclude);
          files.push(...subFiles);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
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
   * Get code context around the match
   */
  getContext(code, index, contextLines = 3) {
    const lines = code.split('\n');
    const lineNumber = this.getLineNumber(code, index);
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);

    return lines.slice(start, end).join('\n');
  }

  /**
   * Get description for vulnerability type
   */
  getDescription(type) {
    const descriptions = {
      commandInjection: 'User input passed to command execution function without sanitization',
      pathTraversal: 'User-controlled file path could allow directory traversal attacks',
      insecureDeserialization: 'Deserializing untrusted data can lead to remote code execution',
      regexDoS: 'User-controlled regular expression can cause denial of service',
      xxe: 'XML parsing without disabling external entities',
      csrfMissing: 'State-changing endpoint missing CSRF protection',
      unsafeRandomness: 'Math.random() is not cryptographically secure for sensitive values'
    };

    return descriptions[type] || 'Security vulnerability detected';
  }

  /**
   * Get remediation for vulnerability type
   */
  getRemediation(type) {
    const remediations = {
      commandInjection: 'Validate and sanitize all user input. Use execFile with array of arguments instead of string commands. Consider using safer alternatives.',
      pathTraversal: 'Validate file paths against a whitelist. Use path.resolve() and check if result is within allowed directory. Never trust user input for file paths.',
      insecureDeserialization: 'Validate data before deserialization. Use JSON schema validation. Avoid deserializing untrusted data when possible.',
      regexDoS: 'Never use user input directly in RegExp constructor. Use pre-compiled regexes or validate input against safe patterns.',
      xxe: 'Disable external entity processing: { noent: false, dtdload: false, dtdvalid: false }',
      csrfMissing: 'Add CSRF protection middleware (e.g., csurf). Use CSRF tokens for all state-changing operations.',
      unsafeRandomness: 'Use crypto.randomBytes() or crypto.randomUUID() for security-sensitive random values'
    };

    return remediations[type] || 'Review and fix the security issue';
  }

  /**
   * Get summary statistics
   */
  getSummary(findings) {
    const summary = {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      byType: {}
    };

    for (const finding of findings) {
      summary.byType[finding.name] = (summary.byType[finding.name] || 0) + 1;
    }

    return summary;
  }
}

module.exports = CodeScanner;
