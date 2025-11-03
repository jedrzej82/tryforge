/**
 * Dependency Security Scanner
 * Scans project dependencies for known vulnerabilities
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DependencyScanner {
  constructor() {
    this.vulnerabilityCache = new Map();
  }

  /**
   * Scan project dependencies
   */
  async scan(projectPath) {
    const findings = [];

    // Check for package.json (Node.js)
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await this.fileExists(packageJsonPath)) {
      const npmFindings = await this.scanNpmDependencies(projectPath);
      findings.push(...npmFindings);
    }

    // Check for requirements.txt (Python)
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    if (await this.fileExists(requirementsPath)) {
      const pipFindings = await this.scanPipDependencies(projectPath);
      findings.push(...pipFindings);
    }

    // Check for composer.json (PHP)
    const composerPath = path.join(projectPath, 'composer.json');
    if (await this.fileExists(composerPath)) {
      const composerFindings = await this.scanComposerDependencies(projectPath);
      findings.push(...composerFindings);
    }

    // Check for Gemfile (Ruby)
    const gemfilePath = path.join(projectPath, 'Gemfile');
    if (await this.fileExists(gemfilePath)) {
      const gemFindings = await this.scanGemDependencies(projectPath);
      findings.push(...gemFindings);
    }

    return findings;
  }

  /**
   * Scan npm dependencies
   */
  async scanNpmDependencies(projectPath) {
    const findings = [];

    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const audit = JSON.parse(auditResult);

      if (audit.vulnerabilities) {
        for (const [pkgName, vulnData] of Object.entries(audit.vulnerabilities)) {
          findings.push({
            type: 'dependency',
            name: 'Vulnerable npm Package',
            severity: this.normalizeSeverity(vulnData.severity),
            description: `${pkgName} has known vulnerabilities`,
            package: pkgName,
            version: vulnData.range || 'unknown',
            vulnerabilities: vulnData.via || [],
            fixAvailable: vulnData.fixAvailable || false,
            remediation: this.getNpmRemediation(pkgName, vulnData),
            cwe: 'CWE-1035',
            cvss: this.severityToCVSS(vulnData.severity)
          });
        }
      }
    } catch (error) {
      // npm audit returns non-zero exit code if vulnerabilities found
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          if (audit.vulnerabilities) {
            for (const [pkgName, vulnData] of Object.entries(audit.vulnerabilities)) {
              findings.push({
                type: 'dependency',
                name: 'Vulnerable npm Package',
                severity: this.normalizeSeverity(vulnData.severity),
                description: `${pkgName} has known vulnerabilities`,
                package: pkgName,
                version: vulnData.range || 'unknown',
                vulnerabilities: vulnData.via || [],
                fixAvailable: vulnData.fixAvailable || false,
                remediation: this.getNpmRemediation(pkgName, vulnData),
                cwe: 'CWE-1035',
                cvss: this.severityToCVSS(vulnData.severity)
              });
            }
          }
        } catch (parseError) {
          console.error('Error parsing npm audit output:', parseError.message);
        }
      }
    }

    // Check for outdated packages
    const outdatedFindings = await this.checkOutdatedNpm(projectPath);
    findings.push(...outdatedFindings);

    return findings;
  }

  /**
   * Check for outdated npm packages
   */
  async checkOutdatedNpm(projectPath) {
    const findings = [];

    try {
      const outdatedResult = execSync('npm outdated --json', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const outdated = JSON.parse(outdatedResult || '{}');

      for (const [pkgName, info] of Object.entries(outdated)) {
        findings.push({
          type: 'outdated-dependency',
          name: 'Outdated Package',
          severity: 'LOW',
          description: `${pkgName} is outdated`,
          package: pkgName,
          currentVersion: info.current,
          latestVersion: info.latest,
          remediation: `Update ${pkgName} from ${info.current} to ${info.latest}`,
          cvss: 2.0
        });
      }
    } catch (error) {
      // npm outdated returns non-zero if outdated packages found
      if (error.stdout) {
        try {
          const outdated = JSON.parse(error.stdout || '{}');
          for (const [pkgName, info] of Object.entries(outdated)) {
            findings.push({
              type: 'outdated-dependency',
              name: 'Outdated Package',
              severity: 'LOW',
              description: `${pkgName} is outdated`,
              package: pkgName,
              currentVersion: info.current,
              latestVersion: info.latest,
              remediation: `Update ${pkgName} from ${info.current} to ${info.latest}`,
              cvss: 2.0
            });
          }
        } catch (parseError) {
          // Ignore parse errors for outdated check
        }
      }
    }

    return findings;
  }

  /**
   * Scan pip dependencies
   */
  async scanPipDependencies(projectPath) {
    const findings = [];

    try {
      // Check if safety is installed
      execSync('which safety', { stdio: 'ignore' });

      // Run safety check
      const safetyResult = execSync('safety check --json', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const vulnerabilities = JSON.parse(safetyResult);

      for (const vuln of vulnerabilities) {
        findings.push({
          type: 'dependency',
          name: 'Vulnerable Python Package',
          severity: 'HIGH',
          description: vuln.advisory,
          package: vuln.package,
          version: vuln.installed_version,
          cve: vuln.cve || 'N/A',
          remediation: `Update ${vuln.package} to version ${vuln.safe_version || 'latest'}`,
          cvss: 7.5
        });
      }
    } catch (error) {
      // Safety not installed or no vulnerabilities found
    }

    return findings;
  }

  /**
   * Scan composer dependencies
   */
  async scanComposerDependencies(projectPath) {
    const findings = [];

    try {
      // Run composer audit
      const auditResult = execSync('composer audit --format=json', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const audit = JSON.parse(auditResult);

      if (audit.advisories) {
        for (const advisory of audit.advisories) {
          findings.push({
            type: 'dependency',
            name: 'Vulnerable PHP Package',
            severity: 'HIGH',
            description: advisory.title,
            package: advisory.package,
            version: advisory.version,
            cve: advisory.cve || 'N/A',
            remediation: `Update ${advisory.package} to a patched version`,
            cvss: 7.5
          });
        }
      }
    } catch (error) {
      // Composer not available or no vulnerabilities
    }

    return findings;
  }

  /**
   * Scan gem dependencies
   */
  async scanGemDependencies(projectPath) {
    const findings = [];

    try {
      // Run bundle audit
      const auditResult = execSync('bundle audit check --format=json', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const audit = JSON.parse(auditResult);

      if (audit.vulnerabilities) {
        for (const vuln of audit.vulnerabilities) {
          findings.push({
            type: 'dependency',
            name: 'Vulnerable Ruby Gem',
            severity: 'HIGH',
            description: vuln.title,
            package: vuln.gem,
            version: vuln.version,
            cve: vuln.cve || 'N/A',
            remediation: `Update ${vuln.gem} to a patched version`,
            cvss: 7.5
          });
        }
      }
    } catch (error) {
      // Bundle audit not available or no vulnerabilities
    }

    return findings;
  }

  /**
   * Check license compliance
   */
  async checkLicenses(projectPath) {
    const findings = [];
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (await this.fileExists(packageJsonPath)) {
      try {
        const result = execSync('npm ls --json --all', {
          cwd: projectPath,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024
        });

        const dependencies = JSON.parse(result);
        const restrictedLicenses = ['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0'];

        this.checkDependencyLicenses(dependencies, restrictedLicenses, findings);
      } catch (error) {
        // Ignore errors
      }
    }

    return findings;
  }

  /**
   * Check dependency licenses recursively
   */
  checkDependencyLicenses(dep, restrictedLicenses, findings) {
    if (dep.license && restrictedLicenses.includes(dep.license)) {
      findings.push({
        type: 'license',
        name: 'Restricted License',
        severity: 'MEDIUM',
        description: `Package uses restricted license: ${dep.license}`,
        package: dep.name,
        license: dep.license,
        remediation: 'Review license compatibility with your project'
      });
    }

    if (dep.dependencies) {
      for (const childDep of Object.values(dep.dependencies)) {
        this.checkDependencyLicenses(childDep, restrictedLicenses, findings);
      }
    }
  }

  /**
   * Normalize severity levels
   */
  normalizeSeverity(severity) {
    const normalized = (severity || '').toLowerCase();
    if (normalized === 'critical') return 'CRITICAL';
    if (normalized === 'high') return 'HIGH';
    if (normalized === 'moderate' || normalized === 'medium') return 'MEDIUM';
    if (normalized === 'low') return 'LOW';
    return 'MEDIUM';
  }

  /**
   * Convert severity to CVSS score
   */
  severityToCVSS(severity) {
    const normalized = this.normalizeSeverity(severity);
    const scores = {
      CRITICAL: 9.5,
      HIGH: 7.5,
      MEDIUM: 5.5,
      LOW: 3.0
    };
    return scores[normalized] || 5.0;
  }

  /**
   * Get npm remediation advice
   */
  getNpmRemediation(pkgName, vulnData) {
    if (vulnData.fixAvailable) {
      if (vulnData.fixAvailable === true) {
        return `Run 'npm audit fix' to update ${pkgName}`;
      } else if (vulnData.fixAvailable.name) {
        return `Update ${vulnData.fixAvailable.name} to fix ${pkgName}`;
      }
    }
    return `Review and update ${pkgName} to a secure version`;
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
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
      fixable: findings.filter(f => f.fixAvailable).length
    };
  }
}

module.exports = DependencyScanner;
