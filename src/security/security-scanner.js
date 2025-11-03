/**
 * Main Security Scanner
 * Orchestrates all security checks and generates comprehensive reports
 */

const CodeScanner = require('./scanners/code-scanner');
const DependencyScanner = require('./scanners/dependency-scanner');
const SecretsScanner = require('./scanners/secrets-scanner');
const AuthScanner = require('./scanners/auth-scanner');
const CryptoScanner = require('./scanners/crypto-scanner');

const OWASPAnalyzer = require('./analyzers/owasp-analyzer');
const PermissionAnalyzer = require('./analyzers/permission-analyzer');
const InputValidationAnalyzer = require('./analyzers/input-validation-analyzer');

const SecurityReporter = require('./reporters/security-reporter');
const ComplianceReporter = require('./reporters/compliance-reporter');

const AutoFixer = require('./fixers/auto-fixer');

const CVEDatabase = require('./databases/cve-database');
const VulnerabilityDatabase = require('./databases/vulnerability-db');

class SecurityScanner {
  constructor() {
    // Initialize scanners
    this.codeScanner = new CodeScanner();
    this.dependencyScanner = new DependencyScanner();
    this.secretsScanner = new SecretsScanner();
    this.authScanner = new AuthScanner();
    this.cryptoScanner = new CryptoScanner();

    // Initialize analyzers
    this.owaspAnalyzer = new OWASPAnalyzer();
    this.permissionAnalyzer = new PermissionAnalyzer();
    this.inputValidationAnalyzer = new InputValidationAnalyzer();

    // Initialize reporters
    this.securityReporter = new SecurityReporter();
    this.complianceReporter = new ComplianceReporter();

    // Initialize fixer
    this.autoFixer = new AutoFixer();

    // Initialize databases
    this.cveDatabase = new CVEDatabase();
    this.vulnerabilityDatabase = new VulnerabilityDatabase();
  }

  /**
   * Run comprehensive security scan
   */
  async scan(projectPath, options = {}) {
    const {
      scanners = ['code', 'dependencies', 'secrets', 'auth', 'crypto'],
      analyzers = ['owasp', 'permissions', 'input-validation'],
      reportFormat = 'text',
      outputPath = null
    } = options;

    console.log('🔍 Starting security scan...\n');

    const results = {
      projectPath: projectPath,
      timestamp: new Date().toISOString(),
      findings: [],
      analysis: {},
      summary: {}
    };

    // Run scanners
    if (scanners.includes('code')) {
      console.log('📝 Scanning code for vulnerabilities...');
      const codeFindings = await this.codeScanner.scanDirectory(projectPath);
      results.findings.push(...codeFindings);
      console.log(`   Found ${codeFindings.length} code vulnerabilities\n`);
    }

    if (scanners.includes('dependencies')) {
      console.log('📦 Scanning dependencies...');
      const depFindings = await this.dependencyScanner.scan(projectPath);
      results.findings.push(...depFindings);
      console.log(`   Found ${depFindings.length} dependency issues\n`);
    }

    if (scanners.includes('secrets')) {
      console.log('🔐 Scanning for secrets...');
      const secretFindings = await this.secretsScanner.scanDirectory(projectPath);
      results.findings.push(...secretFindings);
      console.log(`   Found ${secretFindings.length} potential secrets\n`);
    }

    if (scanners.includes('auth')) {
      console.log('🔑 Scanning authentication...');
      const authFindings = await this.authScanner.scanDirectory(projectPath);
      results.findings.push(...authFindings);
      console.log(`   Found ${authFindings.length} authentication issues\n`);
    }

    if (scanners.includes('crypto')) {
      console.log('🔒 Scanning cryptography...');
      const cryptoFindings = await this.cryptoScanner.scanDirectory(projectPath);
      results.findings.push(...cryptoFindings);
      console.log(`   Found ${cryptoFindings.length} cryptography issues\n`);
    }

    // Run analyzers
    console.log('📊 Running security analysis...\n');

    if (analyzers.includes('owasp')) {
      console.log('   Analyzing OWASP Top 10 compliance...');
      results.analysis.owasp = this.owaspAnalyzer.analyze(results.findings);
    }

    if (analyzers.includes('permissions')) {
      console.log('   Analyzing permissions and access control...');
      const permFindings = await this.permissionAnalyzer.analyze(projectPath);
      results.findings.push(...permFindings);
    }

    if (analyzers.includes('input-validation')) {
      console.log('   Analyzing input validation...');
      const validationFindings = await this.inputValidationAnalyzer.analyze(projectPath);
      results.findings.push(...validationFindings);
    }

    // Generate summary
    results.summary = this.generateSummary(results.findings);

    // Generate report
    console.log('\n📄 Generating report...\n');
    const report = this.securityReporter.generateReport(results.findings, {
      projectName: projectPath,
      format: reportFormat
    });

    results.report = report;

    // Save report if output path specified
    if (outputPath) {
      await this.securityReporter.saveReport(report, outputPath, reportFormat);
      console.log(`   Report saved to: ${outputPath}\n`);
    }

    return results;
  }

  /**
   * Run dependency scan only
   */
  async scanDependencies(projectPath) {
    console.log('📦 Scanning dependencies for vulnerabilities...\n');

    const findings = await this.dependencyScanner.scan(projectPath);
    const summary = this.dependencyScanner.getSummary(findings);

    return {
      findings: findings,
      summary: summary
    };
  }

  /**
   * Run secrets scan only
   */
  async scanSecrets(projectPath) {
    console.log('🔐 Scanning for hardcoded secrets...\n');

    const findings = await this.secretsScanner.scanDirectory(projectPath);

    // Also check environment files and git history
    const envFindings = await this.secretsScanner.scanEnvFiles(projectPath);
    const gitFindings = await this.secretsScanner.scanGitHistory(projectPath);

    findings.push(...envFindings, ...gitFindings);

    const summary = this.secretsScanner.getSummary(findings);

    return {
      findings: findings,
      summary: summary
    };
  }

  /**
   * Run compliance audit
   */
  async auditCompliance(projectPath, standards = ['OWASP']) {
    console.log('📋 Running compliance audit...\n');

    // First, run a full scan
    const scanResults = await this.scan(projectPath, {
      reportFormat: 'json',
      outputPath: null
    });

    // Generate compliance report
    const complianceReport = this.complianceReporter.generateReport(
      scanResults.findings,
      standards
    );

    return complianceReport;
  }

  /**
   * Auto-fix security issues
   */
  async fix(projectPath, options = {}) {
    console.log('🔧 Auto-fixing security issues...\n');

    // First, scan to find issues
    const scanResults = await this.scan(projectPath, {
      reportFormat: 'json',
      outputPath: null
    });

    // Run auto-fixer
    const fixResults = await this.autoFixer.fix(scanResults.findings, options);

    // Generate fix report
    const report = this.autoFixer.generateReport();

    return {
      fixResults: fixResults,
      report: report
    };
  }

  /**
   * Generate security score
   */
  calculateSecurityScore(findings) {
    const weights = {
      CRITICAL: 20,
      HIGH: 10,
      MEDIUM: 5,
      LOW: 2
    };

    let deductions = 0;

    for (const finding of findings) {
      const severity = finding.severity || 'MEDIUM';
      deductions += weights[severity] || weights.MEDIUM;
    }

    const score = Math.max(0, 100 - deductions);

    return {
      score: score,
      rating: this.getScoreRating(score),
      deductions: deductions,
      breakdown: {
        critical: findings.filter(f => f.severity === 'CRITICAL').length,
        high: findings.filter(f => f.severity === 'HIGH').length,
        medium: findings.filter(f => f.severity === 'MEDIUM').length,
        low: findings.filter(f => f.severity === 'LOW').length
      }
    };
  }

  /**
   * Get score rating
   */
  getScoreRating(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Needs Improvement';
    if (score >= 40) return 'Poor';
    return 'Critical';
  }

  /**
   * Generate summary
   */
  generateSummary(findings) {
    const summary = {
      total: findings.length,
      bySeverity: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      byCategory: {},
      topIssues: [],
      mostAffectedFiles: {},
      score: 0,
      rating: ''
    };

    // Count by severity
    for (const finding of findings) {
      const severity = finding.severity || 'MEDIUM';
      summary.bySeverity[severity]++;

      // Count by category
      const category = finding.name || finding.type || 'Unknown';
      summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;

      // Track affected files
      if (finding.file) {
        summary.mostAffectedFiles[finding.file] = (summary.mostAffectedFiles[finding.file] || 0) + 1;
      }
    }

    // Get top issues
    summary.topIssues = Object.entries(summary.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Calculate score
    const scoreData = this.calculateSecurityScore(findings);
    summary.score = scoreData.score;
    summary.rating = scoreData.rating;

    return summary;
  }

  /**
   * Generate quick report (console output)
   */
  generateQuickReport(results) {
    const { findings, summary } = results;

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    SECURITY SCAN REPORT                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Security score
    console.log(`Security Score: ${summary.score}/100 (${summary.rating})`);
    console.log(`Total Issues: ${summary.total}\n`);

    // Severity breakdown
    if (summary.bySeverity.CRITICAL > 0) {
      console.log(`🔴 CRITICAL (${summary.bySeverity.CRITICAL})`);
      const criticalFindings = findings.filter(f => f.severity === 'CRITICAL').slice(0, 3);
      criticalFindings.forEach(f => {
        console.log(`   - ${f.name} in ${f.file || 'unknown'}${f.line ? `:${f.line}` : ''}`);
        console.log(`     ${f.description}`);
        console.log(`     Fix: ${f.remediation}\n`);
      });
    }

    if (summary.bySeverity.HIGH > 0) {
      console.log(`🟠 HIGH (${summary.bySeverity.HIGH})`);
      const highFindings = findings.filter(f => f.severity === 'HIGH').slice(0, 3);
      highFindings.forEach(f => {
        console.log(`   - ${f.name} in ${f.file || 'unknown'}${f.line ? `:${f.line}` : ''}`);
      });
      console.log('');
    }

    if (summary.bySeverity.MEDIUM > 0) {
      console.log(`🟡 MEDIUM (${summary.bySeverity.MEDIUM})`);
    }

    if (summary.bySeverity.LOW > 0) {
      console.log(`🔵 LOW (${summary.bySeverity.LOW})`);
    }

    console.log('\n─────────────────────────────────────────────────────────────────\n');

    // Top issues
    if (summary.topIssues.length > 0) {
      console.log('Top Security Issues:');
      summary.topIssues.slice(0, 5).forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue.name} (${issue.count} occurrences)`);
      });
      console.log('');
    }

    // Recommendations
    console.log('Recommendations:');
    if (summary.bySeverity.CRITICAL > 0) {
      console.log('  ⚠️  Fix CRITICAL issues immediately!');
    }
    if (summary.bySeverity.HIGH > 0) {
      console.log('  ⚠️  Address HIGH severity issues as soon as possible');
    }
    console.log('  💡 Run "tryforge security fix --auto" to auto-fix some issues');
    console.log('  📄 Generate detailed report: "tryforge security report --format html"');
    console.log('');
  }

  /**
   * Look up CVE information
   */
  async lookupCVE(cveId) {
    return await this.cveDatabase.lookupCVE(cveId);
  }

  /**
   * Get vulnerability information
   */
  getVulnerabilityInfo(vulnerabilityId) {
    return this.vulnerabilityDatabase.getVulnerability(vulnerabilityId);
  }
}

module.exports = SecurityScanner;
