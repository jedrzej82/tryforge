/**
 * Permission and Access Control Analyzer
 * Analyzes file permissions, CORS, and access control issues
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class PermissionAnalyzer {
  constructor() {
    this.sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'credentials.json',
      'config.json',
      'secrets.json',
      'private.key',
      'id_rsa',
      '.npmrc',
      '.pypirc',
      'docker-compose.yml'
    ];

    this.executableExtensions = ['.sh', '.bat', '.exe', '.bin'];
  }

  /**
   * Analyze permissions for a project
   */
  async analyze(projectPath) {
    const findings = [];

    // Check file permissions
    const permissionFindings = await this.checkFilePermissions(projectPath);
    findings.push(...permissionFindings);

    // Check CORS configuration
    const corsFindings = await this.checkCORSConfiguration(projectPath);
    findings.push(...corsFindings);

    // Check access control implementation
    const accessFindings = await this.checkAccessControl(projectPath);
    findings.push(...accessFindings);

    // Check directory permissions
    const dirFindings = await this.checkDirectoryPermissions(projectPath);
    findings.push(...dirFindings);

    return findings;
  }

  /**
   * Check file permissions
   */
  async checkFilePermissions(projectPath) {
    const findings = [];

    for (const fileName of this.sensitiveFiles) {
      const filePath = path.join(projectPath, fileName);

      try {
        const stats = await fs.stat(filePath);
        const mode = stats.mode.toString(8).slice(-3);

        // Check if file is world-readable or world-writable
        if (mode[2] !== '0') {
          findings.push({
            type: 'file-permission',
            name: 'Insecure File Permissions',
            severity: 'HIGH',
            description: `${fileName} has insecure permissions (${mode})`,
            file: filePath,
            permissions: mode,
            remediation: `Change permissions to 600 or 640: chmod 600 ${fileName}`,
            cwe: 'CWE-732',
            cvss: 7.5
          });
        }

        // Check if sensitive file is world-executable
        if (mode[2] === '1' || mode[2] === '3' || mode[2] === '5' || mode[2] === '7') {
          findings.push({
            type: 'executable-sensitive-file',
            name: 'Sensitive File is Executable',
            severity: 'MEDIUM',
            description: `${fileName} should not be executable`,
            file: filePath,
            permissions: mode,
            remediation: `Remove execute permission: chmod -x ${fileName}`,
            cwe: 'CWE-732',
            cvss: 6.0
          });
        }
      } catch (error) {
        // File doesn't exist, which is fine
      }
    }

    return findings;
  }

  /**
   * Check directory permissions
   */
  async checkDirectoryPermissions(projectPath) {
    const findings = [];
    const sensitiveDirectories = ['.git', '.ssh', 'keys', 'secrets', 'credentials'];

    for (const dirName of sensitiveDirectories) {
      const dirPath = path.join(projectPath, dirName);

      try {
        const stats = await fs.stat(dirPath);

        if (stats.isDirectory()) {
          const mode = stats.mode.toString(8).slice(-3);

          // Check if directory is world-writable
          if (mode[2] === '2' || mode[2] === '3' || mode[2] === '6' || mode[2] === '7') {
            findings.push({
              type: 'directory-permission',
              name: 'Insecure Directory Permissions',
              severity: 'HIGH',
              description: `${dirName} directory is world-writable (${mode})`,
              file: dirPath,
              permissions: mode,
              remediation: `Change permissions to 700 or 750: chmod 700 ${dirName}`,
              cwe: 'CWE-732',
              cvss: 7.5
            });
          }
        }
      } catch (error) {
        // Directory doesn't exist
      }
    }

    return findings;
  }

  /**
   * Check CORS configuration
   */
  async checkCORSConfiguration(projectPath) {
    const findings = [];
    const files = await this.getFiles(projectPath, ['.js', '.ts', '.py', '.php']);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Check for wildcard CORS
        const wildcardCORS = /Access-Control-Allow-Origin\s*[:'"\s]*\*|cors\(\s*\{[^}]*origin\s*:\s*['"]\*['"]|origin\s*:\s*true/gi;
        const matches = [...content.matchAll(wildcardCORS)];

        for (const match of matches) {
          const lineNumber = this.getLineNumber(content, match.index);

          findings.push({
            type: 'cors-wildcard',
            name: 'Permissive CORS Policy',
            severity: 'MEDIUM',
            description: 'CORS allows all origins (*)',
            file: file,
            line: lineNumber,
            code: match[0],
            remediation: 'Restrict CORS to specific trusted origins',
            cwe: 'CWE-942',
            cvss: 6.5
          });
        }

        // Check for credentials with wildcard origin
        const unsafeCreds = /Access-Control-Allow-Credentials\s*[:'"\s]*true[\s\S]{0,200}Access-Control-Allow-Origin\s*[:'"\s]*\*/gi;
        const credMatches = [...content.matchAll(unsafeCreds)];

        for (const match of credMatches) {
          const lineNumber = this.getLineNumber(content, match.index);

          findings.push({
            type: 'cors-credentials-wildcard',
            name: 'Dangerous CORS Configuration',
            severity: 'HIGH',
            description: 'CORS allows credentials with wildcard origin',
            file: file,
            line: lineNumber,
            remediation: 'Never use wildcard origin with credentials. Specify exact origins.',
            cwe: 'CWE-942',
            cvss: 7.5
          });
        }
      } catch (error) {
        // Skip file
      }
    }

    return findings;
  }

  /**
   * Check access control implementation
   */
  async checkAccessControl(projectPath) {
    const findings = [];
    const files = await this.getFiles(projectPath, ['.js', '.ts', '.jsx', '.tsx']);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Check for missing authorization checks
        const protectedRoutes = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]\/(?:admin|api|dashboard|users|account)[^'"]*['"]\s*,\s*(?:async\s*)?\([^)]*\)\s*=>/gi;
        const matches = [...content.matchAll(protectedRoutes)];

        for (const match of matches) {
          const context = this.getContext(content, match.index, 10);

          // Check if there's an auth check nearby
          if (!this.hasAuthCheck(context)) {
            const lineNumber = this.getLineNumber(content, match.index);

            findings.push({
              type: 'missing-auth',
              name: 'Missing Authorization Check',
              severity: 'HIGH',
              description: 'Protected route missing authorization middleware',
              file: file,
              line: lineNumber,
              code: match[0].substring(0, 80),
              remediation: 'Add authentication and authorization middleware to protected routes',
              cwe: 'CWE-306',
              cvss: 8.0
            });
          }
        }

        // Check for role-based access control issues
        const rbacIssues = /if\s*\(\s*user\.role\s*===?\s*['"]admin['"]\s*\)(?!.*else)/gi;
        const rbacMatches = [...content.matchAll(rbacIssues)];

        for (const match of rbacMatches) {
          const lineNumber = this.getLineNumber(content, match.index);
          const context = this.getContext(content, match.index, 5);

          if (!/else|throw|return.*error/i.test(context)) {
            findings.push({
              type: 'incomplete-rbac',
              name: 'Incomplete Role-Based Access Control',
              severity: 'MEDIUM',
              description: 'RBAC check missing else clause or error handling',
              file: file,
              line: lineNumber,
              code: match[0],
              remediation: 'Add proper error handling for unauthorized access attempts',
              cwe: 'CWE-285',
              cvss: 6.5
            });
          }
        }
      } catch (error) {
        // Skip file
      }
    }

    return findings;
  }

  /**
   * Check if auth middleware is present
   */
  hasAuthCheck(context) {
    const authPatterns = [
      /auth(?:enticate)?/i,
      /isAuth/i,
      /requireAuth/i,
      /checkAuth/i,
      /verifyToken/i,
      /middleware/i,
      /protect/i,
      /authorize/i
    ];

    return authPatterns.some(pattern => pattern.test(context));
  }

  /**
   * Get files recursively
   */
  async getFiles(dir, extensions = ['.js', '.ts']) {
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
   * Get summary statistics
   */
  getSummary(findings) {
    return {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      byType: this.groupByType(findings)
    };
  }

  /**
   * Group findings by type
   */
  groupByType(findings) {
    const grouped = {};

    for (const finding of findings) {
      const type = finding.type || 'other';
      grouped[type] = (grouped[type] || 0) + 1;
    }

    return grouped;
  }
}

module.exports = PermissionAnalyzer;
