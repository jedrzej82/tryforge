/**
 * OWASP Top 10 Security Analyzer
 * Analyzes findings against OWASP Top 10 2021 categories
 */

class OWASPAnalyzer {
  constructor() {
    this.owaspCategories = {
      A01: {
        name: 'Broken Access Control',
        description: 'Restrictions on what authenticated users are allowed to do are often not properly enforced',
        relatedCWEs: ['CWE-200', 'CWE-201', 'CWE-352', 'CWE-284', 'CWE-285', 'CWE-639'],
        severity: 'HIGH'
      },
      A02: {
        name: 'Cryptographic Failures',
        description: 'Failures related to cryptography which often leads to sensitive data exposure',
        relatedCWEs: ['CWE-259', 'CWE-327', 'CWE-331', 'CWE-798', 'CWE-321', 'CWE-326'],
        severity: 'HIGH'
      },
      A03: {
        name: 'Injection',
        description: 'Application is vulnerable to injection flaws such as SQL, NoSQL, OS command injection',
        relatedCWEs: ['CWE-79', 'CWE-89', 'CWE-73', 'CWE-94', 'CWE-78'],
        severity: 'CRITICAL'
      },
      A04: {
        name: 'Insecure Design',
        description: 'Missing or ineffective control design',
        relatedCWEs: ['CWE-209', 'CWE-256', 'CWE-501', 'CWE-522'],
        severity: 'MEDIUM'
      },
      A05: {
        name: 'Security Misconfiguration',
        description: 'Security misconfiguration is the most commonly seen issue',
        relatedCWEs: ['CWE-16', 'CWE-209', 'CWE-319', 'CWE-614'],
        severity: 'HIGH'
      },
      A06: {
        name: 'Vulnerable and Outdated Components',
        description: 'Using components with known vulnerabilities',
        relatedCWEs: ['CWE-1035', 'CWE-1104'],
        severity: 'HIGH'
      },
      A07: {
        name: 'Identification and Authentication Failures',
        description: 'Confirmation of user identity, authentication, and session management',
        relatedCWEs: ['CWE-287', 'CWE-288', 'CWE-290', 'CWE-306', 'CWE-307', 'CWE-521', 'CWE-798'],
        severity: 'HIGH'
      },
      A08: {
        name: 'Software and Data Integrity Failures',
        description: 'Code and infrastructure that does not protect against integrity violations',
        relatedCWEs: ['CWE-829', 'CWE-494', 'CWE-502'],
        severity: 'HIGH'
      },
      A09: {
        name: 'Security Logging and Monitoring Failures',
        description: 'Without logging and monitoring, breaches cannot be detected',
        relatedCWEs: ['CWE-778', 'CWE-117', 'CWE-223', 'CWE-532'],
        severity: 'MEDIUM'
      },
      A10: {
        name: 'Server-Side Request Forgery (SSRF)',
        description: 'SSRF flaws occur when web application fetches remote resource without validating URL',
        relatedCWEs: ['CWE-918'],
        severity: 'HIGH'
      }
    };
  }

  /**
   * Analyze findings against OWASP Top 10
   */
  analyze(findings) {
    const owaspMapping = {};
    const unmapped = [];

    // Initialize categories
    for (const [code, category] of Object.entries(this.owaspCategories)) {
      owaspMapping[code] = {
        ...category,
        findings: [],
        count: 0
      };
    }

    // Map findings to OWASP categories
    for (const finding of findings) {
      const category = this.mapToOWASP(finding);

      if (category) {
        owaspMapping[category].findings.push(finding);
        owaspMapping[category].count++;
      } else {
        unmapped.push(finding);
      }
    }

    return {
      categories: owaspMapping,
      unmapped: unmapped,
      compliance: this.calculateCompliance(owaspMapping),
      summary: this.getSummary(owaspMapping)
    };
  }

  /**
   * Map finding to OWASP category
   */
  mapToOWASP(finding) {
    const cwe = finding.cwe ? finding.cwe.replace('CWE-', '') : null;

    // Check by CWE
    if (cwe) {
      for (const [code, category] of Object.entries(this.owaspCategories)) {
        if (category.relatedCWEs.some(c => c.includes(cwe))) {
          return code;
        }
      }
    }

    // Check by vulnerability type
    const type = finding.name ? finding.name.toLowerCase() : '';

    if (type.includes('sql') || type.includes('injection') || type.includes('xss')) {
      return 'A03';
    }

    if (type.includes('auth') || type.includes('password') || type.includes('session')) {
      return 'A07';
    }

    if (type.includes('crypto') || type.includes('encryption') || type.includes('hash')) {
      return 'A02';
    }

    if (type.includes('dependency') || type.includes('outdated') || type.includes('vulnerable')) {
      return 'A06';
    }

    if (type.includes('access') || type.includes('permission') || type.includes('authorization')) {
      return 'A01';
    }

    if (type.includes('config') || type.includes('cors') || type.includes('cookie')) {
      return 'A05';
    }

    if (type.includes('deserialization')) {
      return 'A08';
    }

    if (type.includes('ssrf') || type.includes('request forgery')) {
      return 'A10';
    }

    if (type.includes('logging') || type.includes('monitoring')) {
      return 'A09';
    }

    return null;
  }

  /**
   * Calculate OWASP compliance
   */
  calculateCompliance(owaspMapping) {
    const categoriesWithIssues = Object.values(owaspMapping).filter(c => c.count > 0).length;
    const totalCategories = Object.keys(this.owaspCategories).length;
    const categoriesPassing = totalCategories - categoriesWithIssues;
    const compliancePercent = Math.round((categoriesPassing / totalCategories) * 100);

    return {
      passing: categoriesPassing,
      failing: categoriesWithIssues,
      total: totalCategories,
      percentage: compliancePercent,
      status: this.getComplianceStatus(compliancePercent)
    };
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(percentage) {
    if (percentage >= 90) return 'EXCELLENT';
    if (percentage >= 70) return 'GOOD';
    if (percentage >= 50) return 'FAIR';
    return 'POOR';
  }

  /**
   * Get summary statistics
   */
  getSummary(owaspMapping) {
    const summary = {
      totalIssues: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      byCategory: {}
    };

    for (const [code, category] of Object.entries(owaspMapping)) {
      summary.totalIssues += category.count;
      summary.byCategory[code] = {
        name: category.name,
        count: category.count,
        severity: category.severity
      };

      // Count by severity
      for (const finding of category.findings) {
        const severity = finding.severity || 'MEDIUM';
        if (severity === 'CRITICAL') summary.critical++;
        else if (severity === 'HIGH') summary.high++;
        else if (severity === 'MEDIUM') summary.medium++;
        else if (severity === 'LOW') summary.low++;
      }
    }

    return summary;
  }

  /**
   * Generate detailed OWASP report
   */
  generateReport(analysis) {
    const report = {
      title: 'OWASP Top 10 Security Analysis',
      compliance: analysis.compliance,
      summary: analysis.summary,
      categories: []
    };

    for (const [code, category] of Object.entries(analysis.categories)) {
      if (category.count > 0) {
        report.categories.push({
          code: code,
          name: category.name,
          description: category.description,
          severity: category.severity,
          issueCount: category.count,
          findings: category.findings.map(f => ({
            name: f.name,
            file: f.file,
            line: f.line,
            severity: f.severity,
            remediation: f.remediation
          }))
        });
      }
    }

    return report;
  }

  /**
   * Get recommendations based on OWASP findings
   */
  getRecommendations(analysis) {
    const recommendations = [];

    for (const [code, category] of Object.entries(analysis.categories)) {
      if (category.count > 0) {
        recommendations.push({
          category: `${code}: ${category.name}`,
          priority: category.severity,
          issueCount: category.count,
          recommendation: this.getCategoryRecommendation(code)
        });
      }
    }

    // Sort by priority and issue count
    recommendations.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return priorityDiff !== 0 ? priorityDiff : b.issueCount - a.issueCount;
    });

    return recommendations;
  }

  /**
   * Get category-specific recommendation
   */
  getCategoryRecommendation(code) {
    const recommendations = {
      A01: 'Implement proper access control checks. Use role-based access control (RBAC) or attribute-based access control (ABAC). Deny by default.',
      A02: 'Use strong, modern encryption algorithms. Store sensitive data encrypted at rest and in transit. Use proper key management.',
      A03: 'Use parameterized queries, ORMs, or prepared statements. Validate and sanitize all user input. Implement input validation.',
      A04: 'Design security into the application from the start. Use threat modeling. Implement security requirements.',
      A05: 'Implement security hardening. Remove unnecessary features. Keep software updated. Use security headers.',
      A06: 'Keep all dependencies up to date. Monitor for security advisories. Remove unused dependencies. Use dependency scanning.',
      A07: 'Implement multi-factor authentication. Use secure session management. Implement account lockout. Use strong password policies.',
      A08: 'Verify digital signatures. Use integrity checks. Avoid deserializing untrusted data. Implement CI/CD security.',
      A09: 'Implement comprehensive logging. Monitor security events. Set up alerts. Implement audit trails.',
      A10: 'Validate and sanitize all URLs. Implement allowlist of allowed destinations. Disable HTTP redirections.'
    };

    return recommendations[code] || 'Review and address security issues in this category';
  }

  /**
   * Get OWASP compliance score
   */
  getComplianceScore(analysis) {
    const weights = {
      CRITICAL: 10,
      HIGH: 5,
      MEDIUM: 2,
      LOW: 1
    };

    let totalWeight = 0;
    let issueWeight = 0;

    for (const category of Object.values(analysis.categories)) {
      for (const finding of category.findings) {
        const weight = weights[finding.severity] || weights.MEDIUM;
        issueWeight += weight;
      }
    }

    // Maximum possible score
    const maxScore = 100;

    // Calculate score (100 - weighted issues, minimum 0)
    const score = Math.max(0, maxScore - issueWeight);

    return {
      score: score,
      rating: this.getScoreRating(score),
      totalIssues: analysis.summary.totalIssues,
      criticalIssues: analysis.summary.critical,
      highIssues: analysis.summary.high
    };
  }

  /**
   * Get score rating
   */
  getScoreRating(score) {
    if (score >= 90) return 'A (Excellent)';
    if (score >= 80) return 'B (Good)';
    if (score >= 70) return 'C (Fair)';
    if (score >= 60) return 'D (Poor)';
    return 'F (Critical)';
  }
}

module.exports = OWASPAnalyzer;
