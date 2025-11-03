/**
 * SQL Injection Detection Rules
 * Detects potential SQL injection vulnerabilities in code
 */

class SQLInjectionRules {
  constructor() {
    this.rules = [
      {
        id: 'sql-concat',
        name: 'SQL String Concatenation',
        severity: 'CRITICAL',
        description: 'SQL query uses string concatenation with user input',
        pattern: /(?:query|sql|select|insert|update|delete)\s*=\s*["'`].*?["'`]\s*\+/gi,
        cwe: 'CWE-89',
        cvss: 9.8
      },
      {
        id: 'sql-template-literal',
        name: 'SQL Template Literal Injection',
        severity: 'CRITICAL',
        description: 'SQL query uses template literals with variables',
        pattern: /(?:query|sql|select|insert|update|delete)\s*=\s*`.*?\$\{.*?\}.*?`/gi,
        cwe: 'CWE-89',
        cvss: 9.8
      },
      {
        id: 'raw-sql-execution',
        name: 'Raw SQL Execution',
        severity: 'HIGH',
        description: 'Executing raw SQL without parameterization',
        pattern: /\.(?:query|execute|raw|run)\s*\(\s*["'`](?:SELECT|INSERT|UPDATE|DELETE)/gi,
        cwe: 'CWE-89',
        cvss: 8.5
      },
      {
        id: 'orm-raw-query',
        name: 'ORM Raw Query',
        severity: 'HIGH',
        description: 'Using raw queries in ORM without parameters',
        pattern: /\.(?:rawQuery|raw|sequelize\.query)\s*\(/gi,
        cwe: 'CWE-89',
        cvss: 8.0
      },
      {
        id: 'dynamic-query-building',
        name: 'Dynamic Query Building',
        severity: 'HIGH',
        description: 'Building SQL queries dynamically without sanitization',
        pattern: /["'`](?:SELECT|INSERT|UPDATE|DELETE).*?["'`]\s*\+\s*\w+/gi,
        cwe: 'CWE-89',
        cvss: 8.5
      }
    ];
  }

  /**
   * Scan code for SQL injection vulnerabilities
   */
  scan(code, filePath) {
    const findings = [];

    for (const rule of this.rules) {
      const matches = [...code.matchAll(rule.pattern)];

      for (const match of matches) {
        const lineNumber = this.getLineNumber(code, match.index);
        const context = this.getContext(code, match.index);

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
   * Get remediation steps for specific rule
   */
  getRemediation(ruleId) {
    const remediations = {
      'sql-concat': 'Use parameterized queries or prepared statements. Example: db.query("SELECT * FROM users WHERE id = ?", [userId])',
      'sql-template-literal': 'Never use template literals for SQL queries with user input. Use parameterized queries instead.',
      'raw-sql-execution': 'Use ORM query builders or parameterized queries. Example: db.query("SELECT * FROM users WHERE name = $1", [name])',
      'orm-raw-query': 'Use ORM query builders instead of raw queries. If raw queries are necessary, use parameter binding.',
      'dynamic-query-building': 'Use query builders or ORMs. If dynamic queries are needed, whitelist allowed columns and use parameterization.'
    };

    return remediations[ruleId] || 'Use parameterized queries and input validation';
  }

  /**
   * Check if code contains proper parameterization
   */
  hasParameterization(code) {
    const paramPatterns = [
      /\?\s*,\s*\[/,  // ? with array
      /\$\d+/,        // $1, $2, etc.
      /:\w+/,         // :param
      /\.bind\(/,     // .bind(params)
      /\.prepare\(/   // .prepare()
    ];

    return paramPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Suggest safe alternatives
   */
  getSafeAlternative(vulnerableCode) {
    // Try to suggest a safe version
    if (vulnerableCode.includes('+')) {
      return vulnerableCode.replace(/\+\s*\w+/g, '?') + '\n// Add parameters: [value]';
    }

    if (vulnerableCode.includes('${')) {
      return vulnerableCode.replace(/\$\{[^}]+\}/g, '?') + '\n// Add parameters: [value]';
    }

    return 'Use parameterized queries with your database library';
  }
}

module.exports = SQLInjectionRules;
