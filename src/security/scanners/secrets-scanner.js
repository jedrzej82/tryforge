/**
 * Secrets Scanner
 * Detects hardcoded secrets, API keys, passwords, and credentials
 */

const fs = require('fs').promises;
const path = require('path');
const SecretsRules = require('../rules/secrets-rules');

class SecretsScanner {
  constructor() {
    this.secretsRules = new SecretsRules();
    this.excludedDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.next',
      'out',
      'vendor'
    ];
    this.excludedFiles = [
      '.env.example',
      '.env.template',
      '.env.sample',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml'
    ];
  }

  /**
   * Scan directory for secrets
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
   * Scan a single file
   */
  async scanFile(filePath) {
    try {
      // Skip binary files
      if (this.isBinaryFile(filePath)) {
        return [];
      }

      const content = await fs.readFile(filePath, 'utf-8');
      return this.secretsRules.scan(content, filePath);
    } catch (error) {
      // File might be binary or unreadable
      return [];
    }
  }

  /**
   * Get all files recursively
   */
  async getFiles(dir) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!this.excludedDirs.includes(entry.name) && !entry.name.startsWith('.')) {
            const subFiles = await this.getFiles(fullPath);
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          if (!this.excludedFiles.includes(entry.name)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }

    return files;
  }

  /**
   * Check if file is binary
   */
  isBinaryFile(filePath) {
    const binaryExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
      '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
      '.exe', '.dll', '.so', '.dylib',
      '.mp3', '.mp4', '.avi', '.mov',
      '.ttf', '.woff', '.woff2', '.eot',
      '.class', '.jar', '.war'
    ];

    const ext = path.extname(filePath).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  /**
   * Scan environment files
   */
  async scanEnvFiles(dirPath) {
    const findings = [];
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];

    for (const envFile of envFiles) {
      const envPath = path.join(dirPath, envFile);

      try {
        await fs.access(envPath);

        findings.push({
          type: 'env-file',
          name: 'Environment File Found',
          severity: 'MEDIUM',
          description: `Environment file ${envFile} should not be committed`,
          file: envPath,
          remediation: `Add ${envFile} to .gitignore and use .env.example as template`
        });

        // Scan contents for actual secrets
        const secrets = await this.scanFile(envPath);
        findings.push(...secrets);
      } catch {
        // File doesn't exist, which is fine
      }
    }

    return findings;
  }

  /**
   * Check if secrets are in git history
   */
  async scanGitHistory(repoPath) {
    const findings = [];

    try {
      const { execSync } = require('child_process');

      // Check if directory is a git repo
      try {
        execSync('git rev-parse --git-dir', { cwd: repoPath, stdio: 'ignore' });
      } catch {
        return findings; // Not a git repo
      }

      // Get list of all tracked files ever
      const trackedFiles = execSync('git log --all --pretty=format: --name-only --diff-filter=A', {
        cwd: repoPath,
        encoding: 'utf-8'
      }).split('\n').filter(Boolean);

      const secretFiles = trackedFiles.filter(f =>
        f.includes('.env') &&
        !f.includes('.env.example') &&
        !f.includes('.env.template')
      );

      for (const file of secretFiles) {
        findings.push({
          type: 'git-history',
          name: 'Secrets in Git History',
          severity: 'HIGH',
          description: `${file} was committed to git history`,
          file: file,
          remediation: 'Use git-filter-branch or BFG Repo-Cleaner to remove sensitive files from history'
        });
      }
    } catch (error) {
      // Git not available or error checking history
    }

    return findings;
  }

  /**
   * Scan for common secret patterns in file names
   */
  async scanFileNames(dirPath) {
    const findings = [];
    const suspiciousPatterns = [
      /private.*key/i,
      /secret/i,
      /credential/i,
      /password/i,
      /auth.*token/i,
      /api.*key/i
    ];

    const files = await this.getFiles(dirPath);

    for (const file of files) {
      const basename = path.basename(file);

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(basename)) {
          findings.push({
            type: 'suspicious-filename',
            name: 'Suspicious Filename',
            severity: 'LOW',
            description: `File name suggests it may contain secrets: ${basename}`,
            file: file,
            remediation: 'Review file contents and move secrets to environment variables if needed'
          });
          break;
        }
      }
    }

    return findings;
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
      const type = finding.name;
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    }

    return summary;
  }
}

module.exports = SecretsScanner;
