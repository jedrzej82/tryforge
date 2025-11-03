/**
 * Security Reporter
 * Generates comprehensive security audit reports
 */

const fs = require('fs').promises;
const path = require('path');

class SecurityReporter {
  constructor() {
    this.severityEmojis = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🔵'
    };

    this.severityColors = {
      CRITICAL: '\x1b[91m',  // Bright red
      HIGH: '\x1b[93m',      // Bright yellow
      MEDIUM: '\x1b[33m',    // Yellow
      LOW: '\x1b[36m',       // Cyan
      RESET: '\x1b[0m'
    };
  }

  /**
   * Generate security report
   */
  generateReport(findings, options = {}) {
    const {
      projectName = 'TryForge Project',
      format = 'text',
      includeCode = true,
      groupBy = 'severity'
    } = options;

    const summary = this.generateSummary(findings);

    if (format === 'json') {
      return this.generateJSONReport(findings, summary, projectName);
    } else if (format === 'html') {
      return this.generateHTMLReport(findings, summary, projectName);
    } else if (format === 'markdown') {
      return this.generateMarkdownReport(findings, summary, projectName);
    } else {
      return this.generateTextReport(findings, summary, projectName, includeCode, groupBy);
    }
  }

  /**
   * Generate summary statistics
   */
  generateSummary(findings) {
    const summary = {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      byType: {},
      byFile: {},
      score: 0,
      rating: ''
    };

    // Group by type
    for (const finding of findings) {
      const type = finding.name || finding.type || 'Unknown';
      summary.byType[type] = (summary.byType[type] || 0) + 1;

      if (finding.file) {
        summary.byFile[finding.file] = (summary.byFile[finding.file] || 0) + 1;
      }
    }

    // Calculate security score
    const weights = { CRITICAL: 20, HIGH: 10, MEDIUM: 5, LOW: 2 };
    const deductions = summary.critical * weights.CRITICAL +
                       summary.high * weights.HIGH +
                       summary.medium * weights.MEDIUM +
                       summary.low * weights.LOW;

    summary.score = Math.max(0, 100 - deductions);
    summary.rating = this.getScoreRating(summary.score);

    return summary;
  }

  /**
   * Generate text report
   */
  generateTextReport(findings, summary, projectName, includeCode, groupBy) {
    const lines = [];
    const date = new Date().toISOString().split('T')[0];

    // Header
    lines.push('╔═══════════════════════════════════════════════════════════════╗');
    lines.push('║                    SECURITY AUDIT REPORT                       ║');
    lines.push(`║                      ${projectName.padEnd(39)} ║`);
    lines.push(`║                    Generated: ${date}                       ║`);
    lines.push('╚═══════════════════════════════════════════════════════════════╝');
    lines.push('');

    // Executive Summary
    lines.push('Executive Summary');
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push(`Security Score: ${summary.score}/100 (${summary.rating})`);
    lines.push(`Risk Level: ${this.getRiskLevel(summary)}`);
    lines.push(`Total Vulnerabilities: ${summary.total} (Critical: ${summary.critical}, High: ${summary.high}, Medium: ${summary.medium}, Low: ${summary.low})`);
    lines.push('');

    // Severity breakdown
    if (summary.critical > 0) {
      lines.push(`${this.severityEmojis.CRITICAL} CRITICAL: ${summary.critical} issues - Immediate action required!`);
    }
    if (summary.high > 0) {
      lines.push(`${this.severityEmojis.HIGH} HIGH: ${summary.high} issues - Should be fixed soon`);
    }
    if (summary.medium > 0) {
      lines.push(`${this.severityEmojis.MEDIUM} MEDIUM: ${summary.medium} issues - Should be addressed`);
    }
    if (summary.low > 0) {
      lines.push(`${this.severityEmojis.LOW} LOW: ${summary.low} issues - Minor improvements`);
    }
    lines.push('');

    // Findings by severity
    if (groupBy === 'severity') {
      const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

      for (const severity of severities) {
        const severityFindings = findings.filter(f => f.severity === severity);

        if (severityFindings.length > 0) {
          lines.push(`${severity} Issues (${severityFindings.length})`);
          lines.push('─────────────────────────────────────────────────────────────────');

          severityFindings.forEach((finding, index) => {
            lines.push(`${index + 1}. ${finding.name}`);
            lines.push(`   File: ${finding.file}${finding.line ? `:${finding.line}` : ''}`);
            lines.push(`   Description: ${finding.description}`);

            if (finding.cwe) {
              lines.push(`   CWE: ${finding.cwe}`);
            }

            if (finding.cvss) {
              lines.push(`   CVSS: ${finding.cvss}`);
            }

            if (includeCode && finding.code) {
              lines.push(`   Code: ${finding.code.substring(0, 100)}${finding.code.length > 100 ? '...' : ''}`);
            }

            lines.push(`   Remediation: ${finding.remediation}`);
            lines.push('');
          });
        }
      }
    }

    // Most affected files
    lines.push('Most Affected Files');
    lines.push('─────────────────────────────────────────────────────────────────');
    const topFiles = Object.entries(summary.byFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    topFiles.forEach(([file, count]) => {
      lines.push(`  ${count.toString().padStart(3)} issues - ${file}`);
    });
    lines.push('');

    // Recommendations
    lines.push('Recommendations');
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push(...this.getRecommendations(summary));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   */
  generateJSONReport(findings, summary, projectName) {
    return JSON.stringify({
      project: projectName,
      generatedAt: new Date().toISOString(),
      summary: summary,
      findings: findings.map(f => ({
        severity: f.severity,
        name: f.name,
        description: f.description,
        file: f.file,
        line: f.line,
        code: f.code,
        cwe: f.cwe,
        cvss: f.cvss,
        remediation: f.remediation
      }))
    }, null, 2);
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(findings, summary, projectName) {
    const date = new Date().toISOString().split('T')[0];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Security Audit Report - ${projectName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
    }
    .summary {
      background: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .score {
      font-size: 48px;
      font-weight: bold;
      color: ${this.getScoreColor(summary.score)};
    }
    .severity-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 5px;
      margin: 5px;
      font-weight: bold;
      color: white;
    }
    .critical { background: #dc3545; }
    .high { background: #fd7e14; }
    .medium { background: #ffc107; color: #000; }
    .low { background: #17a2b8; }
    .finding {
      background: white;
      padding: 20px;
      border-left: 4px solid;
      margin-bottom: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .finding.critical { border-color: #dc3545; }
    .finding.high { border-color: #fd7e14; }
    .finding.medium { border-color: #ffc107; }
    .finding.low { border-color: #17a2b8; }
    code {
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .remediation {
      background: #e7f3ff;
      padding: 10px;
      border-radius: 5px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔒 Security Audit Report</h1>
    <h2>${projectName}</h2>
    <p>Generated: ${date}</p>
  </div>

  <div class="summary">
    <h2>Executive Summary</h2>
    <div class="score">${summary.score}/100</div>
    <p><strong>Rating:</strong> ${summary.rating}</p>
    <p><strong>Risk Level:</strong> ${this.getRiskLevel(summary)}</p>
    <p><strong>Total Vulnerabilities:</strong> ${summary.total}</p>

    <div>
      ${summary.critical > 0 ? `<span class="severity-badge critical">CRITICAL: ${summary.critical}</span>` : ''}
      ${summary.high > 0 ? `<span class="severity-badge high">HIGH: ${summary.high}</span>` : ''}
      ${summary.medium > 0 ? `<span class="severity-badge medium">MEDIUM: ${summary.medium}</span>` : ''}
      ${summary.low > 0 ? `<span class="severity-badge low">LOW: ${summary.low}</span>` : ''}
    </div>
  </div>

  <h2>Findings</h2>
  ${findings.map((finding, index) => `
    <div class="finding ${finding.severity.toLowerCase()}">
      <h3>${index + 1}. ${finding.name}</h3>
      <p><strong>Severity:</strong> ${finding.severity}</p>
      <p><strong>File:</strong> <code>${finding.file}${finding.line ? `:${finding.line}` : ''}</code></p>
      <p><strong>Description:</strong> ${finding.description}</p>
      ${finding.cwe ? `<p><strong>CWE:</strong> ${finding.cwe}</p>` : ''}
      ${finding.cvss ? `<p><strong>CVSS:</strong> ${finding.cvss}</p>` : ''}
      ${finding.code ? `<p><strong>Code:</strong> <code>${this.escapeHtml(finding.code.substring(0, 200))}</code></p>` : ''}
      <div class="remediation">
        <strong>💡 Remediation:</strong> ${finding.remediation}
      </div>
    </div>
  `).join('')}

  <div class="summary">
    <h2>Recommendations</h2>
    <ol>
      ${this.getRecommendations(summary).map(rec => `<li>${rec}</li>`).join('')}
    </ol>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport(findings, summary, projectName) {
    const date = new Date().toISOString().split('T')[0];
    const lines = [];

    lines.push(`# 🔒 Security Audit Report`);
    lines.push(`## ${projectName}`);
    lines.push(`**Generated:** ${date}\n`);

    lines.push(`## Executive Summary\n`);
    lines.push(`- **Security Score:** ${summary.score}/100 (${summary.rating})`);
    lines.push(`- **Risk Level:** ${this.getRiskLevel(summary)}`);
    lines.push(`- **Total Vulnerabilities:** ${summary.total}`);
    lines.push(`- **Critical:** ${summary.critical}`);
    lines.push(`- **High:** ${summary.high}`);
    lines.push(`- **Medium:** ${summary.medium}`);
    lines.push(`- **Low:** ${summary.low}\n`);

    lines.push(`## Findings\n`);

    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    for (const severity of severities) {
      const severityFindings = findings.filter(f => f.severity === severity);

      if (severityFindings.length > 0) {
        lines.push(`### ${this.severityEmojis[severity]} ${severity} (${severityFindings.length})\n`);

        severityFindings.forEach((finding, index) => {
          lines.push(`#### ${index + 1}. ${finding.name}\n`);
          lines.push(`- **File:** \`${finding.file}${finding.line ? `:${finding.line}` : ''}\``);
          lines.push(`- **Description:** ${finding.description}`);
          if (finding.cwe) lines.push(`- **CWE:** ${finding.cwe}`);
          if (finding.cvss) lines.push(`- **CVSS:** ${finding.cvss}`);
          if (finding.code) lines.push(`- **Code:** \`${finding.code.substring(0, 100)}\``);
          lines.push(`- **Remediation:** ${finding.remediation}\n`);
        });
      }
    }

    lines.push(`## Recommendations\n`);
    this.getRecommendations(summary).forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`);
    });

    return lines.join('\n');
  }

  /**
   * Get score rating
   */
  getScoreRating(score) {
    if (score >= 90) return '✅ Excellent';
    if (score >= 75) return '✓ Good';
    if (score >= 60) return '⚠️ Needs Improvement';
    if (score >= 40) return '⚠️ Poor';
    return '❌ Critical';
  }

  /**
   * Get score color
   */
  getScoreColor(score) {
    if (score >= 90) return '#28a745';
    if (score >= 75) return '#5cb85c';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#fd7e14';
    return '#dc3545';
  }

  /**
   * Get risk level
   */
  getRiskLevel(summary) {
    if (summary.critical > 0) return '🔴 CRITICAL';
    if (summary.high > 5) return '🟠 HIGH';
    if (summary.high > 0 || summary.medium > 10) return '🟡 MEDIUM';
    return '🟢 LOW';
  }

  /**
   * Get recommendations
   */
  getRecommendations(summary) {
    const recommendations = [];

    if (summary.critical > 0) {
      recommendations.push(`Immediately fix ${summary.critical} CRITICAL vulnerabilities - these pose severe security risks`);
    }

    if (summary.high > 0) {
      recommendations.push(`Address ${summary.high} HIGH severity issues as soon as possible`);
    }

    if (summary.byType['SQL Injection'] || summary.byType['sql-injection']) {
      recommendations.push('Implement parameterized queries for all database operations');
    }

    if (summary.byType['Vulnerable npm Package'] || summary.byType['dependency']) {
      recommendations.push('Run "npm audit fix" or "npm update" to fix vulnerable dependencies');
    }

    if (summary.byType['Hardcoded Password'] || summary.byType['Hardcoded API Key']) {
      recommendations.push('Move all secrets to environment variables immediately and rotate exposed credentials');
    }

    if (summary.byType['Missing Authentication Check']) {
      recommendations.push('Add authentication middleware to all protected routes');
    }

    recommendations.push('Implement regular security scans in CI/CD pipeline');
    recommendations.push('Enable security headers (CSP, HSTS, X-Frame-Options)');
    recommendations.push('Implement comprehensive logging and monitoring');

    return recommendations;
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Save report to file
   */
  async saveReport(report, outputPath, format = 'text') {
    const extension = format === 'json' ? '.json' : format === 'html' ? '.html' : format === 'markdown' ? '.md' : '.txt';
    const finalPath = outputPath.endsWith(extension) ? outputPath : `${outputPath}${extension}`;

    await fs.writeFile(finalPath, report, 'utf-8');
    return finalPath;
  }
}

module.exports = SecurityReporter;
