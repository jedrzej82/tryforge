/**
 * Security Command
 * Handles all security scanning and vulnerability detection operations
 */

const path = require('path');
const chalk = require('chalk');
const SecurityScanner = require('../../security/security-scanner');
const logger = require('../../utils/logger');

class SecurityCommand {
  constructor() {
    this.scanner = new SecurityScanner();
  }

  /**
   * Execute security scan
   */
  async scan(targetPath = '.', options = {}) {
    try {
      const projectPath = path.resolve(targetPath);

      logger.info('Starting security scan...', { projectPath });

      const results = await this.scanner.scan(projectPath, {
        scanners: options.scanners || ['code', 'dependencies', 'secrets', 'auth', 'crypto'],
        analyzers: options.analyzers || ['owasp', 'permissions', 'input-validation'],
        reportFormat: options.format || 'text',
        outputPath: options.output
      });

      // Display quick report
      this.scanner.generateQuickReport(results);

      // Display OWASP analysis if available
      if (results.analysis.owasp) {
        this.displayOWASPAnalysis(results.analysis.owasp);
      }

      return results;
    } catch (error) {
      logger.error('Security scan failed:', error);
      throw error;
    }
  }

  /**
   * Scan dependencies only
   */
  async scanDependencies(targetPath = '.') {
    try {
      const projectPath = path.resolve(targetPath);

      const results = await this.scanner.scanDependencies(projectPath);

      console.log('\n╔═══════════════════════════════════════════════════════════════╗');
      console.log('║              DEPENDENCY VULNERABILITY SCAN                     ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝\n');

      console.log(`Total Issues: ${results.summary.total}`);
      console.log(`Critical: ${results.summary.critical} | High: ${results.summary.high} | Medium: ${results.summary.medium} | Low: ${results.summary.low}`);
      console.log(`Fixable: ${results.summary.fixable}\n`);

      if (results.findings.length > 0) {
        console.log('Vulnerable Packages:\n');

        results.findings.slice(0, 10).forEach((finding, i) => {
          const icon = this.getSeverityIcon(finding.severity);
          console.log(`${icon} ${finding.package}@${finding.version || finding.currentVersion || 'unknown'}`);
          console.log(`   ${finding.description}`);
          console.log(`   ${chalk.cyan('Fix:')} ${finding.remediation}`);
          console.log('');
        });

        if (results.findings.length > 10) {
          console.log(`... and ${results.findings.length - 10} more issues\n`);
        }
      } else {
        console.log(chalk.green('✓ No vulnerable dependencies found!\n'));
      }

      return results;
    } catch (error) {
      logger.error('Dependency scan failed:', error);
      throw error;
    }
  }

  /**
   * Scan for secrets
   */
  async scanSecrets(targetPath = '.') {
    try {
      const projectPath = path.resolve(targetPath);

      const results = await this.scanner.scanSecrets(projectPath);

      console.log('\n╔═══════════════════════════════════════════════════════════════╗');
      console.log('║                  SECRETS DETECTION SCAN                        ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝\n');

      if (results.findings.length > 0) {
        console.log(chalk.red(`⚠️  Found ${results.findings.length} potential secrets!\n`));

        const criticalSecrets = results.findings.filter(f => f.severity === 'CRITICAL');
        const highSecrets = results.findings.filter(f => f.severity === 'HIGH');

        if (criticalSecrets.length > 0) {
          console.log(chalk.red(`🔴 CRITICAL (${criticalSecrets.length})`));
          criticalSecrets.slice(0, 5).forEach(secret => {
            console.log(`   ${secret.name} in ${secret.file}${secret.line ? `:${secret.line}` : ''}`);
            console.log(`   ${chalk.cyan('Action:')} ${secret.remediation}`);
            console.log('');
          });
        }

        if (highSecrets.length > 0) {
          console.log(chalk.yellow(`🟠 HIGH (${highSecrets.length})`));
          highSecrets.slice(0, 5).forEach(secret => {
            console.log(`   ${secret.name} in ${secret.file}${secret.line ? `:${secret.line}` : ''}`);
          });
          console.log('');
        }

        console.log(chalk.red('⚠️  IMPORTANT: Rotate all exposed credentials immediately!\n'));
      } else {
        console.log(chalk.green('✓ No hardcoded secrets detected!\n'));
      }

      return results;
    } catch (error) {
      logger.error('Secrets scan failed:', error);
      throw error;
    }
  }

  /**
   * Run compliance audit
   */
  async audit(targetPath = '.', options = {}) {
    try {
      const projectPath = path.resolve(targetPath);
      const standards = options.standards || ['OWASP'];

      const results = await this.scanner.auditCompliance(projectPath, standards);

      console.log('\n╔═══════════════════════════════════════════════════════════════╗');
      console.log('║                  COMPLIANCE AUDIT REPORT                       ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝\n');

      console.log(`Standards Evaluated: ${results.summary.totalStandards}`);
      console.log(`Average Compliance: ${results.summary.averageScore}%`);
      console.log(`Compliant: ${results.summary.compliant} | Non-Compliant: ${results.summary.nonCompliant}\n`);

      for (const [standard, report] of Object.entries(results.standards)) {
        const statusColor = report.score >= 80 ? chalk.green : report.score >= 60 ? chalk.yellow : chalk.red;

        console.log(`${standard}: ${statusColor(report.status)}`);
        console.log(`  Score: ${report.score}%`);
        console.log(`  Passing: ${report.passing}/${report.passing + report.failing} requirements\n`);

        const failing = report.requirements.filter(r => r.status === 'FAIL');
        if (failing.length > 0 && failing.length <= 5) {
          console.log(`  Failing Requirements:`);
          failing.forEach(req => {
            console.log(`    ❌ ${req.id}: ${req.name} (${req.findings.length} issues)`);
          });
          console.log('');
        }
      }

      if (results.recommendations.length > 0) {
        console.log('Recommendations:\n');
        results.recommendations.forEach((rec, i) => {
          console.log(`${i + 1}. [${rec.priority}] ${rec.message}`);
        });
        console.log('');
      }

      return results;
    } catch (error) {
      logger.error('Compliance audit failed:', error);
      throw error;
    }
  }

  /**
   * Auto-fix security issues
   */
  async fix(targetPath = '.', options = {}) {
    try {
      const projectPath = path.resolve(targetPath);

      const results = await this.scanner.fix(projectPath, {
        dryRun: options.dryRun || false,
        autoApprove: options.auto || false,
        types: options.types || ['dependency', 'config', 'simple']
      });

      console.log('\n' + results.report);

      if (!options.dryRun && results.fixResults.summary.totalFixed > 0) {
        console.log(chalk.green(`\n✓ Fixed ${results.fixResults.summary.totalFixed} issues\n`));
      }

      return results;
    } catch (error) {
      logger.error('Auto-fix failed:', error);
      throw error;
    }
  }

  /**
   * Generate detailed security report
   */
  async report(targetPath = '.', options = {}) {
    try {
      const projectPath = path.resolve(targetPath);

      const results = await this.scanner.scan(projectPath, {
        reportFormat: options.format || 'html',
        outputPath: options.output || `security-report.${options.format || 'html'}`
      });

      console.log(chalk.green(`\n✓ Report generated: ${options.output || `security-report.${options.format || 'html'}`}\n`));

      return results;
    } catch (error) {
      logger.error('Report generation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate and display security score
   */
  async score(targetPath = '.') {
    try {
      const projectPath = path.resolve(targetPath);

      const results = await this.scanner.scan(projectPath, {
        reportFormat: 'json',
        outputPath: null
      });

      const scoreData = this.scanner.calculateSecurityScore(results.findings);

      console.log('\n╔═══════════════════════════════════════════════════════════════╗');
      console.log('║                    SECURITY SCORE                              ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝\n');

      const scoreColor = scoreData.score >= 90 ? chalk.green :
                        scoreData.score >= 75 ? chalk.yellow :
                        scoreData.score >= 60 ? chalk.yellow :
                        chalk.red;

      console.log(`  Score: ${scoreColor(scoreData.score + '/100')} (${scoreData.rating})`);
      console.log(`  Issues: ${results.findings.length} total\n`);

      console.log('  Breakdown:');
      console.log(`    ${chalk.red('Critical:')} ${scoreData.breakdown.critical}`);
      console.log(`    ${chalk.yellow('High:')} ${scoreData.breakdown.high}`);
      console.log(`    ${chalk.blue('Medium:')} ${scoreData.breakdown.medium}`);
      console.log(`    ${chalk.gray('Low:')} ${scoreData.breakdown.low}`);
      console.log('');

      return scoreData;
    } catch (error) {
      logger.error('Score calculation failed:', error);
      throw error;
    }
  }

  /**
   * Display OWASP analysis
   */
  displayOWASPAnalysis(analysis) {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    OWASP TOP 10 ANALYSIS                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const complianceColor = analysis.compliance.percentage >= 80 ? chalk.green :
                           analysis.compliance.percentage >= 60 ? chalk.yellow :
                           chalk.red;

    console.log(`Compliance: ${complianceColor(analysis.compliance.status)} (${analysis.compliance.percentage}%)`);
    console.log(`Passing: ${analysis.compliance.passing}/10 categories\n`);

    const failingCategories = Object.entries(analysis.categories)
      .filter(([_, cat]) => cat.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    if (failingCategories.length > 0) {
      console.log('Top OWASP Issues:\n');
      failingCategories.forEach(([code, category]) => {
        console.log(`  ${code}: ${category.name} (${category.count} issues)`);
      });
      console.log('');
    }
  }

  /**
   * Get severity icon
   */
  getSeverityIcon(severity) {
    const icons = {
      CRITICAL: chalk.red('🔴'),
      HIGH: chalk.yellow('🟠'),
      MEDIUM: chalk.blue('🟡'),
      LOW: chalk.gray('🔵')
    };

    return icons[severity] || icons.MEDIUM;
  }

  /**
   * Execute security command
   */
  static async execute(subcommand, targetPath, options) {
    const command = new SecurityCommand();

    switch (subcommand) {
      case 'scan':
        return await command.scan(targetPath, options);

      case 'dependencies':
        return await command.scanDependencies(targetPath);

      case 'secrets':
        return await command.scanSecrets(targetPath);

      case 'audit':
        return await command.audit(targetPath, options);

      case 'fix':
        return await command.fix(targetPath, options);

      case 'report':
        return await command.report(targetPath, options);

      case 'score':
        return await command.score(targetPath);

      default:
        throw new Error(`Unknown security subcommand: ${subcommand}`);
    }
  }
}

module.exports = SecurityCommand;
