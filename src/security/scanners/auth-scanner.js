/**
 * Authentication Security Scanner
 * Scans for authentication and authorization vulnerabilities
 */

const fs = require('fs').promises;
const path = require('path');

class AuthScanner {
  constructor() {
    this.patterns = {
      weakPasswordValidation: {
        pattern: /password.*length.*<\s*[1-7](?!\d)/gi,
        severity: 'HIGH',
        name: 'Weak Password Policy',
        cwe: 'CWE-521',
        cvss: 7.5
      },
      missingRateLimit: {
        pattern: /(?:app|router)\.post\s*\(['"]\/(login|signin|auth|register)['"]\)(?!.*(?:rateLimit|limiter))/gi,
        severity: 'HIGH',
        name: 'Missing Rate Limiting',
        cwe: 'CWE-307',
        cvss: 7.5
      },
      insecureSessionConfig: {
        pattern: /session\s*\(\s*\{[^}]*secure\s*:\s*false/gi,
        severity: 'HIGH',
        name: 'Insecure Session Configuration',
        cwe: 'CWE-614',
        cvss: 7.5
      },
      jwtNoExpiry: {
        pattern: /jwt\.sign\s*\([^)]*\)(?!.*expiresIn)/gi,
        severity: 'MEDIUM',
        name: 'JWT Without Expiration',
        cwe: 'CWE-613',
        cvss: 6.5
      },
      weakJwtSecret: {
        pattern: /jwt\.sign\s*\([^)]*['"](?:secret|test|dev|123)['"]/gi,
        severity: 'CRITICAL',
        name: 'Weak JWT Secret',
        cwe: 'CWE-798',
        cvss: 9.0
      },
      passwordInUrl: {
        pattern: /\?.*password=/gi,
        severity: 'HIGH',
        name: 'Password in URL',
        cwe: 'CWE-598',
        cvss: 7.5
      },
      missingAuthCheck: {
        pattern: /(?:app|router)\.(get|post|put|delete)\s*\(['"]\/(admin|api|dashboard)[^'"]*['"]\s*,\s*(?!.*(?:auth|isAuth|requireAuth|authenticate))/gi,
        severity: 'HIGH',
        name: 'Missing Authentication Check',
        cwe: 'CWE-306',
        cvss: 8.0
      },
      insecureCookie: {
        pattern: /cookie\s*\([^)]*\)(?!.*httpOnly.*secure)/gi,
        severity: 'MEDIUM',
        name: 'Insecure Cookie Configuration',
        cwe: 'CWE-614',
        cvss: 6.0
      },
      oauthInsecureState: {
        pattern: /oauth.*authorize(?!.*state)/gi,
        severity: 'HIGH',
        name: 'OAuth Missing State Parameter',
        cwe: 'CWE-352',
        cvss: 7.5
      },
      bruteForceVulnerable: {
        pattern: /login|signin|authenticate(?!.*(?:delay|sleep|attempt|lockout))/gi,
        severity: 'MEDIUM',
        name: 'No Brute Force Protection',
        cwe: 'CWE-307',
        cvss: 6.5
      }
    };
  }

  /**
   * Scan file for authentication vulnerabilities
   */
  async scanFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf-8');
      return this.scanCode(code, filePath);
    } catch (error) {
      return [];
    }
  }

  /**
   * Scan code for auth vulnerabilities
   */
  scanCode(code, filePath) {
    const findings = [];

    for (const [type, config] of Object.entries(this.patterns)) {
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

    // Additional checks
    findings.push(...this.checkPasswordHashing(code, filePath));
    findings.push(...this.checkSessionManagement(code, filePath));

    return findings;
  }

  /**
   * Check password hashing methods
   */
  checkPasswordHashing(code, filePath) {
    const findings = [];

    // Weak hashing algorithms
    const weakAlgorithms = [
      { pattern: /createHash\s*\(\s*['"]md5['"]/gi, name: 'MD5' },
      { pattern: /createHash\s*\(\s*['"]sha1['"]/gi, name: 'SHA1' },
      { pattern: /CryptoJS\.MD5/gi, name: 'MD5' }
    ];

    for (const algo of weakAlgorithms) {
      const matches = [...code.matchAll(algo.pattern)];

      for (const match of matches) {
        // Check if it's being used for passwords
        const context = this.getContext(code, match.index, 10);

        if (/password|passwd|pwd/i.test(context)) {
          const lineNumber = this.getLineNumber(code, match.index);

          findings.push({
            rule: 'weak-password-hashing',
            name: `Weak Password Hashing (${algo.name})`,
            severity: 'HIGH',
            description: `Using ${algo.name} for password hashing`,
            file: filePath,
            line: lineNumber,
            code: match[0],
            context: context,
            cwe: 'CWE-327',
            cvss: 7.5,
            remediation: 'Use bcrypt, scrypt, or argon2 for password hashing'
          });
        }
      }
    }

    return findings;
  }

  /**
   * Check session management
   */
  checkSessionManagement(code, filePath) {
    const findings = [];

    // Check for missing session regeneration after login
    const loginPattern = /(?:login|signin|authenticate)[\s\S]{0,200}(?!.*regenerate|destroy)/gi;
    const matches = [...code.matchAll(loginPattern)];

    for (const match of matches) {
      const lineNumber = this.getLineNumber(code, match.index);
      const context = this.getContext(code, match.index, 10);

      // Only flag if this looks like a login function
      if (/function|async|=>/.test(context) && /password|credentials/i.test(context)) {
        findings.push({
          rule: 'missing-session-regeneration',
          name: 'Missing Session Regeneration',
          severity: 'MEDIUM',
          description: 'Session not regenerated after login',
          file: filePath,
          line: lineNumber,
          code: match[0].substring(0, 50),
          context: context,
          cwe: 'CWE-384',
          cvss: 6.5,
          remediation: 'Call req.session.regenerate() after successful login'
        });
      }
    }

    return findings;
  }

  /**
   * Scan directory recursively
   */
  async scanDirectory(dirPath) {
    const findings = [];
    const files = await this.getFiles(dirPath);

    for (const file of files) {
      const fileFindings = await this.scanFile(file);
      findings.push(...fileFindings);
    }

    return findings;
  }

  /**
   * Get all files recursively
   */
  async getFiles(dir, extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.php']) {
    const files = [];
    const exclude = ['node_modules', 'dist', 'build', '.git'];

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
      console.error(`Error reading directory ${dir}:`, error.message);
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
      weakPasswordValidation: 'Password policy allows weak passwords',
      missingRateLimit: 'Authentication endpoint missing rate limiting',
      insecureSessionConfig: 'Session cookie not configured with secure flag',
      jwtNoExpiry: 'JWT token issued without expiration time',
      weakJwtSecret: 'JWT secret is weak or hardcoded',
      passwordInUrl: 'Password transmitted in URL parameters',
      missingAuthCheck: 'Protected endpoint missing authentication middleware',
      insecureCookie: 'Cookie missing httpOnly or secure flags',
      oauthInsecureState: 'OAuth flow missing state parameter (CSRF protection)',
      bruteForceVulnerable: 'Login function vulnerable to brute force attacks'
    };

    return descriptions[type] || 'Authentication security issue detected';
  }

  /**
   * Get remediation for vulnerability type
   */
  getRemediation(type) {
    const remediations = {
      weakPasswordValidation: 'Enforce strong password policy: minimum 8 characters, mixed case, numbers, and special characters',
      missingRateLimit: 'Add rate limiting middleware (e.g., express-rate-limit) to login endpoints',
      insecureSessionConfig: 'Set secure: true, httpOnly: true, and sameSite: "strict" in session configuration',
      jwtNoExpiry: 'Add expiresIn option to JWT tokens: jwt.sign(payload, secret, { expiresIn: "1h" })',
      weakJwtSecret: 'Use a strong, randomly generated secret stored in environment variables',
      passwordInUrl: 'Send passwords in request body, never in URL parameters',
      missingAuthCheck: 'Add authentication middleware before route handler',
      insecureCookie: 'Set cookie with { httpOnly: true, secure: true, sameSite: "strict" }',
      oauthInsecureState: 'Include and validate state parameter in OAuth flow to prevent CSRF',
      bruteForceVulnerable: 'Implement account lockout, CAPTCHA, or exponential backoff after failed attempts'
    };

    return remediations[type] || 'Review and fix authentication security issue';
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
      low: findings.filter(f => f.severity === 'LOW').length
    };
  }
}

module.exports = AuthScanner;
