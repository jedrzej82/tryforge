/**
 * Cryptography Security Scanner
 * Scans for cryptographic vulnerabilities and weak implementations
 */

const fs = require('fs').promises;
const path = require('path');

class CryptoScanner {
  constructor() {
    this.patterns = {
      weakCipher: {
        pattern: /createCipher(?:iv)?\s*\(\s*['"](?:des|rc2|rc4|blowfish)['"]/gi,
        severity: 'CRITICAL',
        name: 'Weak Cipher Algorithm',
        cwe: 'CWE-327',
        cvss: 8.5
      },
      weakHash: {
        pattern: /createHash\s*\(\s*['"](?:md5|sha1)['"]/gi,
        severity: 'MEDIUM',
        name: 'Weak Hash Algorithm',
        cwe: 'CWE-327',
        cvss: 5.5
      },
      hardcodedKey: {
        pattern: /(?:createCipher|createHmac|createSign)[\s\S]{0,100}['"][a-zA-Z0-9+/=]{16,}['"]/gi,
        severity: 'CRITICAL',
        name: 'Hardcoded Encryption Key',
        cwe: 'CWE-321',
        cvss: 9.0
      },
      insecureRandom: {
        pattern: /Math\.random\(\).*(?:key|token|secret|nonce|salt|iv)/gi,
        severity: 'HIGH',
        name: 'Insecure Random Number Generation',
        cwe: 'CWE-338',
        cvss: 7.5
      },
      staticIV: {
        pattern: /createCipheriv[\s\S]{0,100}['"][a-zA-Z0-9+/=]{16,}['"]/gi,
        severity: 'HIGH',
        name: 'Static Initialization Vector',
        cwe: 'CWE-329',
        cvss: 7.5
      },
      ecbMode: {
        pattern: /(?:aes|des)-\d+-ecb/gi,
        severity: 'HIGH',
        name: 'ECB Mode Encryption',
        cwe: 'CWE-327',
        cvss: 7.5
      },
      noSalt: {
        pattern: /pbkdf2(?:Sync)?\s*\([^)]*\)(?!.*salt)/gi,
        severity: 'MEDIUM',
        name: 'Key Derivation Without Salt',
        cwe: 'CWE-760',
        cvss: 6.0
      },
      insecureProtocol: {
        pattern: /(?:minVersion|maxVersion)\s*:\s*['"](?:TLSv1|SSLv3|SSLv2)['"]/gi,
        severity: 'HIGH',
        name: 'Insecure TLS/SSL Version',
        cwe: 'CWE-327',
        cvss: 7.5
      },
      weakRSA: {
        pattern: /generateKeyPair(?:Sync)?\s*\(\s*['"]rsa['"][^)]*modulusLength\s*:\s*(?:512|1024)/gi,
        severity: 'HIGH',
        name: 'Weak RSA Key Length',
        cwe: 'CWE-326',
        cvss: 7.5
      },
      nullCipher: {
        pattern: /['"](?:NULL|ANULL|eNULL)['"].*cipher/gi,
        severity: 'CRITICAL',
        name: 'Null Cipher Configuration',
        cwe: 'CWE-327',
        cvss: 9.0
      }
    };
  }

  /**
   * Scan file for cryptographic vulnerabilities
   */
  async scanFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf-8');
      return this.scanCode(code, filePath);
    } catch (error) {
      return [];
    }
  }

  /**
   * Scan code for crypto vulnerabilities
   */
  scanCode(code, filePath) {
    const findings = [];

    for (const [type, config] of Object.entries(this.patterns)) {
      const matches = [...code.matchAll(config.pattern)];

      for (const match of matches) {
        const lineNumber = this.getLineNumber(code, match.index);
        const context = this.getContext(code, match.index);

        findings.push({
          rule: type,
          name: config.name,
          severity: config.severity,
          description: this.getDescription(type),
          file: filePath,
          line: lineNumber,
          code: match[0],
          context: context,
          cwe: config.cwe,
          cvss: config.cvss,
          remediation: this.getRemediation(type)
        });
      }
    }

    // Additional specific checks
    findings.push(...this.checkCertificateValidation(code, filePath));
    findings.push(...this.checkKeyStorage(code, filePath));

    return findings;
  }

  /**
   * Check certificate validation
   */
  checkCertificateValidation(code, filePath) {
    const findings = [];

    // Check for disabled certificate validation
    const patterns = [
      /rejectUnauthorized\s*:\s*false/gi,
      /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]0['"]/gi,
      /checkServerIdentity\s*:\s*\(\s*\)\s*=>\s*\{\s*\}/gi
    ];

    for (const pattern of patterns) {
      const matches = [...code.matchAll(pattern)];

      for (const match of matches) {
        const lineNumber = this.getLineNumber(code, match.index);
        const context = this.getContext(code, match.index);

        findings.push({
          rule: 'disabled-cert-validation',
          name: 'Disabled Certificate Validation',
          severity: 'CRITICAL',
          description: 'SSL/TLS certificate validation is disabled',
          file: filePath,
          line: lineNumber,
          code: match[0],
          context: context,
          cwe: 'CWE-295',
          cvss: 9.0,
          remediation: 'Never disable certificate validation in production. Use proper CA certificates.'
        });
      }
    }

    return findings;
  }

  /**
   * Check key storage practices
   */
  checkKeyStorage(code, filePath) {
    const findings = [];

    // Check for keys stored in code
    const keyPatterns = [
      /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
      /-----BEGIN CERTIFICATE-----/g
    ];

    for (const pattern of keyPatterns) {
      const matches = [...code.matchAll(pattern)];

      for (const match of matches) {
        const lineNumber = this.getLineNumber(code, match.index);
        const context = this.getContext(code, match.index, 2);

        findings.push({
          rule: 'embedded-private-key',
          name: 'Embedded Private Key',
          severity: 'CRITICAL',
          description: 'Private key embedded in source code',
          file: filePath,
          line: lineNumber,
          code: '***PRIVATE KEY***',
          context: '***PRIVATE KEY REDACTED***',
          cwe: 'CWE-321',
          cvss: 9.5,
          remediation: 'Store private keys in secure key management systems or environment variables with proper file permissions'
        });
      }
    }

    return findings;
  }

  /**
   * Scan directory recursively
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
   * Get all files recursively
   */
  async getFiles(dir, extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.php', '.go', '.java']) {
    const files = [];
    const exclude = ['node_modules', 'dist', 'build', '.git', 'coverage'];

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
      console.error(`Error reading directory ${dir}:`, error.message);
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
   * Get description for vulnerability type
   */
  getDescription(type) {
    const descriptions = {
      weakCipher: 'Using weak or deprecated cipher algorithm',
      weakHash: 'Using weak hash algorithm (MD5/SHA1) for security-sensitive operations',
      hardcodedKey: 'Encryption key hardcoded in source code',
      insecureRandom: 'Using Math.random() for security-sensitive random values',
      staticIV: 'Using static initialization vector for encryption',
      ecbMode: 'Using ECB mode which is not semantically secure',
      noSalt: 'Key derivation function used without salt',
      insecureProtocol: 'Using insecure TLS/SSL protocol version',
      weakRSA: 'RSA key length less than 2048 bits',
      nullCipher: 'Null cipher allows unencrypted communication'
    };

    return descriptions[type] || 'Cryptographic security issue detected';
  }

  /**
   * Get remediation for vulnerability type
   */
  getRemediation(type) {
    const remediations = {
      weakCipher: 'Use AES-256-GCM or ChaCha20-Poly1305 for encryption',
      weakHash: 'Use SHA-256 or SHA-3 for hashing. For passwords, use bcrypt, scrypt, or argon2',
      hardcodedKey: 'Store encryption keys in environment variables or key management services (AWS KMS, Azure Key Vault, etc.)',
      insecureRandom: 'Use crypto.randomBytes() or crypto.randomUUID() for security-sensitive random values',
      staticIV: 'Generate a new random IV for each encryption operation using crypto.randomBytes()',
      ecbMode: 'Use CBC, CTR, or GCM mode instead of ECB. Prefer authenticated encryption like AES-GCM',
      noSalt: 'Always use a unique random salt for key derivation',
      insecureProtocol: 'Use TLS 1.2 or higher. Set minVersion: "TLSv1.2"',
      weakRSA: 'Use at least 2048-bit RSA keys, prefer 4096-bit for long-term security',
      nullCipher: 'Remove null ciphers from configuration. Use strong cipher suites only'
    };

    return remediations[type] || 'Review and fix cryptographic security issue';
  }

  /**
   * Get recommendations for secure crypto practices
   */
  getSecureRecommendations() {
    return {
      encryption: 'Use AES-256-GCM for symmetric encryption',
      hashing: 'Use SHA-256 or SHA-3 for general hashing, bcrypt/argon2 for passwords',
      randomness: 'Use crypto.randomBytes() for all security-sensitive random values',
      keyDerivation: 'Use PBKDF2, bcrypt, scrypt, or argon2 with proper iterations and salt',
      tls: 'Use TLS 1.2+ with strong cipher suites',
      rsa: 'Use 2048-bit or 4096-bit RSA keys',
      certificates: 'Always validate SSL/TLS certificates',
      keyManagement: 'Use key management services (KMS) for production keys'
    };
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
      low: findings.filter(f => f.severity === 'LOW').length
    };
  }
}

module.exports = CryptoScanner;
