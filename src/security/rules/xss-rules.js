/**
 * Cross-Site Scripting (XSS) Detection Rules
 * Detects potential XSS vulnerabilities in code
 */

class XSSRules {
  constructor() {
    this.rules = [
      {
        id: 'innerhtml-injection',
        name: 'innerHTML Injection',
        severity: 'HIGH',
        description: 'Unsanitized user input assigned to innerHTML',
        pattern: /\.innerHTML\s*=\s*(?!["'`])[^;]+/gi,
        cwe: 'CWE-79',
        cvss: 7.5
      },
      {
        id: 'document-write',
        name: 'document.write() with User Input',
        severity: 'HIGH',
        description: 'document.write() used with potentially unsafe content',
        pattern: /document\.write\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
        cwe: 'CWE-79',
        cvss: 7.5
      },
      {
        id: 'eval-injection',
        name: 'eval() with User Input',
        severity: 'CRITICAL',
        description: 'eval() used with user-controllable data',
        pattern: /eval\s*\([^)]*(?:req\.|params\.|query\.|body\.|input)/gi,
        cwe: 'CWE-94',
        cvss: 9.0
      },
      {
        id: 'dangerously-set-html',
        name: 'dangerouslySetInnerHTML in React',
        severity: 'HIGH',
        description: 'React dangerouslySetInnerHTML used without sanitization',
        pattern: /dangerouslySetInnerHTML\s*=\s*\{\{/gi,
        cwe: 'CWE-79',
        cvss: 7.5
      },
      {
        id: 'jquery-html',
        name: 'jQuery .html() with User Input',
        severity: 'HIGH',
        description: 'jQuery .html() method used with unsanitized input',
        pattern: /\$\([^)]+\)\.html\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
        cwe: 'CWE-79',
        cvss: 7.5
      },
      {
        id: 'v-html-directive',
        name: 'Vue v-html Directive',
        severity: 'HIGH',
        description: 'Vue v-html directive with potentially unsafe content',
        pattern: /v-html\s*=\s*["'](?!.*sanitize)[^"']+["']/gi,
        cwe: 'CWE-79',
        cvss: 7.5
      },
      {
        id: 'url-redirect',
        name: 'Unvalidated URL Redirect',
        severity: 'MEDIUM',
        description: 'Redirect to user-controlled URL',
        pattern: /(?:location\.href|window\.location|redirect)\s*=\s*(?:req\.|params\.|query\.)/gi,
        cwe: 'CWE-601',
        cvss: 6.5
      },
      {
        id: 'postmessage-origin',
        name: 'postMessage without Origin Check',
        severity: 'MEDIUM',
        description: 'postMessage used without validating origin',
        pattern: /postMessage\s*\([^)]+\)\s*(?!.*if\s*\(.*origin)/gi,
        cwe: 'CWE-942',
        cvss: 6.0
      }
    ];

    this.safePatterns = [
      /textContent\s*=/,
      /innerText\s*=/,
      /\.text\s*\(/,
      /DOMPurify\.sanitize/,
      /sanitizeHtml\(/,
      /escape\(/,
      /escapeHtml\(/
    ];
  }

  /**
   * Scan code for XSS vulnerabilities
   */
  scan(code, filePath) {
    const findings = [];

    for (const rule of this.rules) {
      const matches = [...code.matchAll(rule.pattern)];

      for (const match of matches) {
        const lineNumber = this.getLineNumber(code, match.index);
        const context = this.getContext(code, match.index);

        // Skip if safe sanitization is detected nearby
        if (this.hasSanitization(context)) {
          continue;
        }

        findings.push({
          rule: rule.id,
          name: rule.name,
          severity: rule.severity,
          description: rule.description,
          file: filePath,
          line: lineNumber,
          code: match[0],
          context: context,
          cwe: rule.cwe,
          cvss: rule.cvss,
          remediation: this.getRemediation(rule.id)
        });
      }
    }

    return findings;
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
   * Check if sanitization is present
   */
  hasSanitization(context) {
    return this.safePatterns.some(pattern => pattern.test(context));
  }

  /**
   * Get remediation steps for specific rule
   */
  getRemediation(ruleId) {
    const remediations = {
      'innerhtml-injection': 'Use textContent instead of innerHTML, or sanitize with DOMPurify before setting innerHTML',
      'document-write': 'Avoid document.write(). Use DOM manipulation methods like createElement and appendChild instead',
      'eval-injection': 'Never use eval() with user input. Use JSON.parse() for JSON data or safer alternatives',
      'dangerously-set-html': 'Sanitize HTML with DOMPurify before using dangerouslySetInnerHTML. Example: dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(content)}}',
      'jquery-html': 'Use .text() instead of .html(), or sanitize content before using .html()',
      'v-html-directive': 'Sanitize content before using v-html, or use text interpolation {{ }} instead',
      'url-redirect': 'Validate redirect URLs against a whitelist before redirecting',
      'postmessage-origin': 'Always validate the origin in message event handler: if (event.origin !== "https://trusted.com") return;'
    };

    return remediations[ruleId] || 'Sanitize user input before rendering in HTML';
  }

  /**
   * Suggest safe alternatives
   */
  getSafeAlternative(vulnerableCode) {
    if (vulnerableCode.includes('innerHTML')) {
      return vulnerableCode.replace('innerHTML', 'textContent') + '\n// Or use: DOMPurify.sanitize(content)';
    }

    if (vulnerableCode.includes('.html(')) {
      return vulnerableCode.replace('.html(', '.text(');
    }

    if (vulnerableCode.includes('dangerouslySetInnerHTML')) {
      return 'dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(content)}}';
    }

    return 'Use safe DOM methods or sanitize user input';
  }
}

module.exports = XSSRules;
