/**
 * Secrets and Credentials Detection Rules
 * Detects hardcoded secrets, API keys, passwords, and credentials
 */

class SecretsRules {
  constructor() {
    this.rules = [
      {
        id: 'aws-access-key',
        name: 'AWS Access Key',
        severity: 'CRITICAL',
        description: 'Hardcoded AWS Access Key ID',
        pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
        cwe: 'CWE-798',
        cvss: 9.1
      },
      {
        id: 'aws-secret-key',
        name: 'AWS Secret Access Key',
        severity: 'CRITICAL',
        description: 'Hardcoded AWS Secret Access Key',
        pattern: /aws_secret_access_key\s*=\s*['"][A-Za-z0-9/+=]{40}['"]/gi,
        cwe: 'CWE-798',
        cvss: 9.1
      },
      {
        id: 'api-key',
        name: 'API Key',
        severity: 'CRITICAL',
        description: 'Hardcoded API key',
        pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi,
        cwe: 'CWE-798',
        cvss: 8.5
      },
      {
        id: 'github-token',
        name: 'GitHub Token',
        severity: 'CRITICAL',
        description: 'Hardcoded GitHub personal access token',
        pattern: /gh[pousr]_[A-Za-z0-9_]{36,255}/g,
        cwe: 'CWE-798',
        cvss: 9.0
      },
      {
        id: 'private-key',
        name: 'Private Key',
        severity: 'CRITICAL',
        description: 'Hardcoded private key',
        pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
        cwe: 'CWE-798',
        cvss: 9.5
      },
      {
        id: 'password',
        name: 'Hardcoded Password',
        severity: 'HIGH',
        description: 'Hardcoded password',
        pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
        cwe: 'CWE-798',
        cvss: 7.5
      },
      {
        id: 'jwt-secret',
        name: 'JWT Secret',
        severity: 'HIGH',
        description: 'Hardcoded JWT secret',
        pattern: /(?:jwt[_-]?secret|token[_-]?secret)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
        cwe: 'CWE-798',
        cvss: 8.0
      },
      {
        id: 'database-url',
        name: 'Database Connection String',
        severity: 'CRITICAL',
        description: 'Hardcoded database connection string with credentials',
        pattern: /(?:mongodb|postgresql|mysql|postgres):\/\/[^:]+:[^@]+@[^\/]+/gi,
        cwe: 'CWE-798',
        cvss: 9.0
      },
      {
        id: 'slack-token',
        name: 'Slack Token',
        severity: 'HIGH',
        description: 'Hardcoded Slack token',
        pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32}/g,
        cwe: 'CWE-798',
        cvss: 7.5
      },
      {
        id: 'stripe-key',
        name: 'Stripe API Key',
        severity: 'CRITICAL',
        description: 'Hardcoded Stripe API key',
        pattern: /(?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,99}/g,
        cwe: 'CWE-798',
        cvss: 8.5
      },
      {
        id: 'google-api-key',
        name: 'Google API Key',
        severity: 'HIGH',
        description: 'Hardcoded Google API key',
        pattern: /AIza[0-9A-Za-z_\-]{35}/g,
        cwe: 'CWE-798',
        cvss: 7.5
      },
      {
        id: 'azure-key',
        name: 'Azure Key',
        severity: 'CRITICAL',
        description: 'Hardcoded Azure key or connection string',
        pattern: /(?:DefaultEndpointsProtocol|AccountKey|SharedAccessSignature)=[^;]+/gi,
        cwe: 'CWE-798',
        cvss: 8.5
      },
      {
        id: 'high-entropy-string',
        name: 'High Entropy String',
        severity: 'MEDIUM',
        description: 'String with high entropy, possibly a secret',
        pattern: null, // Handled by entropy calculation
        cwe: 'CWE-798',
        cvss: 6.0
      }
    ];

    this.ignoredPatterns = [
      /\.env/,
      /\.example/,
      /\.test/,
      /\.spec/,
      /\/test\//,
      /\/tests\//,
      /\/examples\//,
      /\/docs\//,
      /README/,
      /PLACEHOLDER/,
      /YOUR_KEY_HERE/,
      /example\.com/,
      /localhost/
    ];
  }

  /**
   * Scan code for secrets and credentials
   */
  scan(code, filePath) {
    const findings = [];

    // Skip files that are typically safe
    if (this.shouldIgnoreFile(filePath)) {
      return findings;
    }

    for (const rule of this.rules) {
      if (!rule.pattern) continue; // Skip entropy check for now

      const matches = [...code.matchAll(rule.pattern)];

      for (const match of matches) {
        const lineNumber = this.getLineNumber(code, match.index);
        const context = this.getContext(code, match.index);

        // Skip if it looks like an example or placeholder
        if (this.isPlaceholder(match[0])) {
          continue;
        }

        findings.push({
          rule: rule.id,
          name: rule.name,
          severity: rule.severity,
          description: rule.description,
          file: filePath,
          line: lineNumber,
          code: this.maskSecret(match[0]),
          context: this.maskSecret(context),
          cwe: rule.cwe,
          cvss: rule.cvss,
          remediation: this.getRemediation(rule.id)
        });
      }
    }

    // Check for high entropy strings
    const entropyFindings = this.scanHighEntropy(code, filePath);
    findings.push(...entropyFindings);

    return findings;
  }

  /**
   * Scan for high entropy strings that might be secrets
   */
  scanHighEntropy(code, filePath) {
    const findings = [];
    const stringPattern = /['"]([a-zA-Z0-9+/=_\-]{32,})['"](?!\s*[;,}\)])/g;
    const matches = [...code.matchAll(stringPattern)];

    for (const match of matches) {
      const str = match[1];
      const entropy = this.calculateEntropy(str);

      // High entropy threshold
      if (entropy > 4.5 && str.length >= 32) {
        const lineNumber = this.getLineNumber(code, match.index);
        const context = this.getContext(code, match.index);

        // Skip if it's in a comment
        if (this.isInComment(code, match.index)) {
          continue;
        }

        findings.push({
          rule: 'high-entropy-string',
          name: 'High Entropy String',
          severity: 'MEDIUM',
          description: `String with high entropy (${entropy.toFixed(2)}), possibly a secret`,
          file: filePath,
          line: lineNumber,
          code: this.maskSecret(match[0]),
          context: this.maskSecret(context),
          cwe: 'CWE-798',
          cvss: 6.0,
          remediation: 'If this is a secret, move it to environment variables or a secure vault'
        });
      }
    }

    return findings;
  }

  /**
   * Calculate Shannon entropy of a string
   */
  calculateEntropy(str) {
    const len = str.length;
    const frequencies = {};

    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const freq of Object.values(frequencies)) {
      const p = freq / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Check if position is in a comment
   */
  isInComment(code, index) {
    const lineStart = code.lastIndexOf('\n', index);
    const line = code.substring(lineStart, index);
    return /\/\//.test(line) || /\/\*/.test(line);
  }

  /**
   * Check if file should be ignored
   */
  shouldIgnoreFile(filePath) {
    return this.ignoredPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if value is a placeholder
   */
  isPlaceholder(value) {
    const placeholders = [
      /example/i,
      /test/i,
      /demo/i,
      /sample/i,
      /placeholder/i,
      /your[_-]key/i,
      /insert[_-]key/i,
      /xxx+/i,
      /000+/i,
      /123+/i,
      /abc+/i
    ];

    return placeholders.some(pattern => pattern.test(value));
  }

  /**
   * Mask secret for display
   */
  maskSecret(text) {
    // Replace potential secrets with asterisks
    return text.replace(/['"]([a-zA-Z0-9+/=_\-]{8,})['"]/, (match, secret) => {
      if (secret.length <= 8) return match;
      return `"${secret.substring(0, 4)}${'*'.repeat(secret.length - 8)}${secret.substring(secret.length - 4)}"`;
    });
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
  getContext(code, index, contextLines = 2) {
    const lines = code.split('\n');
    const lineNumber = this.getLineNumber(code, index);
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);

    return lines.slice(start, end).join('\n');
  }

  /**
   * Get remediation steps for specific rule
   */
  getRemediation(ruleId) {
    const remediations = {
      'aws-access-key': 'Move AWS credentials to environment variables or AWS IAM roles. Rotate exposed credentials immediately.',
      'aws-secret-key': 'Move AWS credentials to environment variables or AWS IAM roles. Rotate exposed credentials immediately.',
      'api-key': 'Move API keys to environment variables. Use a secrets management service like AWS Secrets Manager or HashiCorp Vault.',
      'github-token': 'Revoke the exposed token immediately. Use GitHub secrets for CI/CD or environment variables.',
      'private-key': 'Remove private key from code. Store in secure location with proper file permissions. Regenerate if exposed.',
      'password': 'Never hardcode passwords. Use environment variables or a secrets management service.',
      'jwt-secret': 'Move JWT secret to environment variables. Rotate secret if exposed.',
      'database-url': 'Move database connection strings to environment variables. Never commit credentials.',
      'slack-token': 'Revoke the exposed token immediately. Use environment variables for tokens.',
      'stripe-key': 'Rotate the exposed Stripe key immediately. Use environment variables.',
      'google-api-key': 'Rotate the exposed API key. Use environment variables and restrict API key usage.',
      'azure-key': 'Rotate Azure credentials immediately. Use Azure Key Vault for secrets management.',
      'high-entropy-string': 'If this is a secret, move it to environment variables or a secure vault'
    };

    return remediations[ruleId] || 'Move secrets to environment variables or a secure secrets management service';
  }
}

module.exports = SecretsRules;
