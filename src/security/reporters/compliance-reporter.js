/**
 * Compliance Reporter
 * Generates compliance reports for various security standards
 */

class ComplianceReporter {
  constructor() {
    this.standards = {
      OWASP: this.getOWASPStandard(),
      'PCI-DSS': this.getPCIDSSStandard(),
      GDPR: this.getGDPRStandard(),
      HIPAA: this.getHIPAAStandard(),
      SOC2: this.getSOC2Standard()
    };
  }

  /**
   * Generate compliance report
   */
  generateReport(findings, standards = ['OWASP']) {
    const reports = {};

    for (const standard of standards) {
      if (this.standards[standard]) {
        reports[standard] = this.checkCompliance(findings, standard);
      }
    }

    return {
      standards: reports,
      summary: this.generateSummary(reports),
      recommendations: this.generateRecommendations(reports)
    };
  }

  /**
   * Check compliance against standard
   */
  checkCompliance(findings, standardName) {
    const standard = this.standards[standardName];
    const compliance = {
      standard: standardName,
      version: standard.version,
      requirements: [],
      passing: 0,
      failing: 0,
      notApplicable: 0,
      score: 0,
      status: ''
    };

    for (const requirement of standard.requirements) {
      const status = this.checkRequirement(findings, requirement);

      compliance.requirements.push({
        id: requirement.id,
        name: requirement.name,
        description: requirement.description,
        status: status.compliant ? 'PASS' : 'FAIL',
        findings: status.violations,
        remediation: requirement.remediation
      });

      if (status.compliant) {
        compliance.passing++;
      } else {
        compliance.failing++;
      }
    }

    const total = compliance.passing + compliance.failing;
    compliance.score = total > 0 ? Math.round((compliance.passing / total) * 100) : 0;
    compliance.status = this.getComplianceStatus(compliance.score);

    return compliance;
  }

  /**
   * Check if requirement is met
   */
  checkRequirement(findings, requirement) {
    const violations = [];

    for (const finding of findings) {
      if (this.matchesRequirement(finding, requirement)) {
        violations.push({
          severity: finding.severity,
          name: finding.name,
          file: finding.file,
          description: finding.description
        });
      }
    }

    return {
      compliant: violations.length === 0,
      violations: violations
    };
  }

  /**
   * Check if finding matches requirement
   */
  matchesRequirement(finding, requirement) {
    // Match by CWE
    if (requirement.cwes && finding.cwe) {
      const cweNumber = finding.cwe.replace('CWE-', '');
      if (requirement.cwes.includes(cweNumber) || requirement.cwes.includes(finding.cwe)) {
        return true;
      }
    }

    // Match by keywords
    if (requirement.keywords) {
      const findingText = `${finding.name} ${finding.description}`.toLowerCase();
      for (const keyword of requirement.keywords) {
        if (findingText.includes(keyword.toLowerCase())) {
          return true;
        }
      }
    }

    // Match by vulnerability type
    if (requirement.types && finding.type) {
      if (requirement.types.includes(finding.type)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get OWASP Top 10 standard
   */
  getOWASPStandard() {
    return {
      name: 'OWASP Top 10',
      version: '2021',
      requirements: [
        {
          id: 'A01',
          name: 'Broken Access Control',
          description: 'Restrictions on what authenticated users are allowed to do are not properly enforced',
          cwes: ['284', '285', '352', '639'],
          keywords: ['access control', 'authorization', 'permission'],
          remediation: 'Implement proper access control checks on all resources'
        },
        {
          id: 'A02',
          name: 'Cryptographic Failures',
          description: 'Failures related to cryptography which often leads to sensitive data exposure',
          cwes: ['259', '327', '331', '321', '326'],
          keywords: ['encryption', 'crypto', 'hash', 'secret', 'key'],
          remediation: 'Use strong encryption and protect sensitive data'
        },
        {
          id: 'A03',
          name: 'Injection',
          description: 'Injection flaws such as SQL, NoSQL, OS, and LDAP injection',
          cwes: ['79', '89', '73', '94', '78'],
          keywords: ['injection', 'sql', 'xss', 'command'],
          remediation: 'Use parameterized queries and input validation'
        },
        {
          id: 'A04',
          name: 'Insecure Design',
          description: 'Missing or ineffective control design',
          cwes: ['209', '256', '501', '522'],
          keywords: ['design', 'architecture'],
          remediation: 'Implement security by design principles'
        },
        {
          id: 'A05',
          name: 'Security Misconfiguration',
          description: 'Security misconfiguration is the most commonly seen issue',
          cwes: ['16', '209', '319', '614'],
          keywords: ['config', 'cors', 'header', 'debug'],
          remediation: 'Implement secure configuration and hardening'
        },
        {
          id: 'A06',
          name: 'Vulnerable and Outdated Components',
          description: 'Using components with known vulnerabilities',
          cwes: ['1035', '1104'],
          keywords: ['dependency', 'outdated', 'vulnerable package'],
          remediation: 'Keep all dependencies up to date'
        },
        {
          id: 'A07',
          name: 'Identification and Authentication Failures',
          description: 'Authentication and session management issues',
          cwes: ['287', '288', '290', '306', '307', '521'],
          keywords: ['auth', 'session', 'password', 'login'],
          remediation: 'Implement strong authentication and session management'
        },
        {
          id: 'A08',
          name: 'Software and Data Integrity Failures',
          description: 'Code and infrastructure that does not protect against integrity violations',
          cwes: ['829', '494', '502'],
          keywords: ['deserialization', 'integrity'],
          remediation: 'Verify integrity of all data and code'
        },
        {
          id: 'A09',
          name: 'Security Logging and Monitoring Failures',
          description: 'Without logging and monitoring, breaches cannot be detected',
          cwes: ['778', '117', '223', '532'],
          keywords: ['logging', 'monitoring', 'audit'],
          remediation: 'Implement comprehensive logging and monitoring'
        },
        {
          id: 'A10',
          name: 'Server-Side Request Forgery',
          description: 'SSRF flaws occur when fetching remote resource without validating URL',
          cwes: ['918'],
          keywords: ['ssrf', 'request forgery'],
          remediation: 'Validate and whitelist all URLs'
        }
      ]
    };
  }

  /**
   * Get PCI-DSS standard requirements
   */
  getPCIDSSStandard() {
    return {
      name: 'PCI-DSS',
      version: '4.0',
      requirements: [
        {
          id: 'REQ-2',
          name: 'Secure System Configuration',
          description: 'Apply secure configurations to all system components',
          keywords: ['config', 'default password', 'hardcoded'],
          remediation: 'Remove default credentials and secure all configurations'
        },
        {
          id: 'REQ-4',
          name: 'Protect Cardholder Data',
          description: 'Protect stored cardholder data',
          keywords: ['encryption', 'sensitive data', 'credit card'],
          remediation: 'Encrypt all sensitive cardholder data'
        },
        {
          id: 'REQ-6',
          name: 'Develop Secure Software',
          description: 'Develop and maintain secure systems and software',
          cwes: ['79', '89', '78', '352'],
          keywords: ['injection', 'xss', 'csrf'],
          remediation: 'Follow secure coding practices'
        },
        {
          id: 'REQ-8',
          name: 'Identify Users and Authenticate Access',
          description: 'Identify users and authenticate access to system components',
          keywords: ['authentication', 'password', 'mfa'],
          remediation: 'Implement strong authentication mechanisms'
        },
        {
          id: 'REQ-10',
          name: 'Log and Monitor Access',
          description: 'Log and monitor all access to system components and cardholder data',
          keywords: ['logging', 'monitoring', 'audit trail'],
          remediation: 'Implement comprehensive logging'
        }
      ]
    };
  }

  /**
   * Get GDPR requirements
   */
  getGDPRStandard() {
    return {
      name: 'GDPR',
      version: '2018',
      requirements: [
        {
          id: 'ART-5',
          name: 'Data Protection Principles',
          description: 'Personal data shall be processed lawfully, fairly and transparently',
          keywords: ['data protection', 'privacy'],
          remediation: 'Implement data protection measures'
        },
        {
          id: 'ART-25',
          name: 'Data Protection by Design',
          description: 'Implement appropriate technical and organisational measures',
          keywords: ['encryption', 'anonymization', 'pseudonymization'],
          remediation: 'Implement privacy by design'
        },
        {
          id: 'ART-32',
          name: 'Security of Processing',
          description: 'Implement appropriate security measures',
          keywords: ['security', 'encryption', 'access control'],
          remediation: 'Implement appropriate security measures'
        },
        {
          id: 'ART-33',
          name: 'Data Breach Notification',
          description: 'Notify supervisory authority of data breaches',
          keywords: ['logging', 'monitoring', 'breach detection'],
          remediation: 'Implement breach detection and notification'
        }
      ]
    };
  }

  /**
   * Get HIPAA requirements
   */
  getHIPAAStandard() {
    return {
      name: 'HIPAA',
      version: '2013',
      requirements: [
        {
          id: 'SEC-164.308',
          name: 'Administrative Safeguards',
          description: 'Implement administrative safeguards',
          keywords: ['access control', 'authentication', 'authorization'],
          remediation: 'Implement administrative safeguards'
        },
        {
          id: 'SEC-164.310',
          name: 'Physical Safeguards',
          description: 'Implement physical safeguards',
          keywords: ['physical security'],
          remediation: 'Implement physical safeguards'
        },
        {
          id: 'SEC-164.312',
          name: 'Technical Safeguards',
          description: 'Implement technical safeguards to protect ePHI',
          keywords: ['encryption', 'access control', 'audit'],
          remediation: 'Implement technical safeguards'
        },
        {
          id: 'SEC-164.314',
          name: 'Organizational Requirements',
          description: 'Implement organizational safeguards',
          keywords: ['policy', 'procedure'],
          remediation: 'Implement organizational safeguards'
        }
      ]
    };
  }

  /**
   * Get SOC 2 requirements
   */
  getSOC2Standard() {
    return {
      name: 'SOC 2',
      version: 'Type II',
      requirements: [
        {
          id: 'CC6.1',
          name: 'Logical and Physical Access Controls',
          description: 'Implement logical and physical access controls',
          keywords: ['access control', 'authentication'],
          remediation: 'Implement access controls'
        },
        {
          id: 'CC6.6',
          name: 'Encryption',
          description: 'Encrypt sensitive data',
          keywords: ['encryption', 'crypto'],
          remediation: 'Implement encryption for sensitive data'
        },
        {
          id: 'CC7.2',
          name: 'Security Monitoring',
          description: 'Monitor system components',
          keywords: ['monitoring', 'logging'],
          remediation: 'Implement security monitoring'
        }
      ]
    };
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(score) {
    if (score >= 95) return '✅ COMPLIANT';
    if (score >= 80) return '⚠️ MOSTLY COMPLIANT';
    if (score >= 60) return '⚠️ PARTIALLY COMPLIANT';
    return '❌ NON-COMPLIANT';
  }

  /**
   * Generate summary
   */
  generateSummary(reports) {
    const summary = {
      totalStandards: Object.keys(reports).length,
      compliant: 0,
      nonCompliant: 0,
      averageScore: 0
    };

    let totalScore = 0;

    for (const report of Object.values(reports)) {
      if (report.score >= 80) {
        summary.compliant++;
      } else {
        summary.nonCompliant++;
      }
      totalScore += report.score;
    }

    summary.averageScore = summary.totalStandards > 0
      ? Math.round(totalScore / summary.totalStandards)
      : 0;

    return summary;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(reports) {
    const recommendations = [];

    for (const [standard, report] of Object.entries(reports)) {
      if (report.score < 80) {
        const failing = report.requirements.filter(r => r.status === 'FAIL');

        recommendations.push({
          standard: standard,
          priority: report.score < 50 ? 'HIGH' : 'MEDIUM',
          message: `${standard} compliance at ${report.score}%. Focus on: ${failing.slice(0, 3).map(r => r.name).join(', ')}`,
          requirements: failing.map(r => ({
            id: r.id,
            name: r.name,
            remediation: r.remediation
          }))
        });
      }
    }

    return recommendations;
  }

  /**
   * Format compliance report as text
   */
  formatTextReport(complianceReport) {
    const lines = [];

    lines.push('╔═══════════════════════════════════════════════════════════════╗');
    lines.push('║                   COMPLIANCE AUDIT REPORT                      ║');
    lines.push('╚═══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('Overall Compliance Summary');
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push(`Standards Evaluated: ${complianceReport.summary.totalStandards}`);
    lines.push(`Average Compliance Score: ${complianceReport.summary.averageScore}%`);
    lines.push(`Compliant Standards: ${complianceReport.summary.compliant}`);
    lines.push(`Non-Compliant Standards: ${complianceReport.summary.nonCompliant}`);
    lines.push('');

    for (const [standard, report] of Object.entries(complianceReport.standards)) {
      lines.push(`${standard} Compliance`);
      lines.push('─────────────────────────────────────────────────────────────────');
      lines.push(`Status: ${report.status}`);
      lines.push(`Score: ${report.score}%`);
      lines.push(`Passing: ${report.passing}/${report.passing + report.failing} requirements`);
      lines.push('');

      const failing = report.requirements.filter(r => r.status === 'FAIL');
      if (failing.length > 0) {
        lines.push(`Failing Requirements:`);
        failing.forEach(req => {
          lines.push(`  ❌ ${req.id}: ${req.name}`);
          lines.push(`     ${req.description}`);
          lines.push(`     Issues: ${req.findings.length}`);
          lines.push(`     Remediation: ${req.remediation}`);
          lines.push('');
        });
      }
    }

    if (complianceReport.recommendations.length > 0) {
      lines.push('Recommendations');
      lines.push('─────────────────────────────────────────────────────────────────');
      complianceReport.recommendations.forEach((rec, i) => {
        lines.push(`${i + 1}. [${rec.priority}] ${rec.message}`);
      });
    }

    return lines.join('\n');
  }
}

module.exports = ComplianceReporter;
