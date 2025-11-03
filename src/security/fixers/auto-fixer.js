/**
 * Auto-Fixer for Security Issues
 * Automatically fixes common security vulnerabilities
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class AutoFixer {
  constructor() {
    this.fixedIssues = [];
    this.failedFixes = [];
    this.dryRun = false;
  }

  /**
   * Auto-fix security issues
   */
  async fix(findings, options = {}) {
    const {
      dryRun = false,
      autoApprove = false,
      types = ['dependency', 'config', 'simple']
    } = options;

    this.dryRun = dryRun;
    this.fixedIssues = [];
    this.failedFixes = [];

    // Fix dependencies
    if (types.includes('dependency')) {
      await this.fixDependencies(findings);
    }

    // Fix configuration issues
    if (types.includes('config')) {
      await this.fixConfigurationIssues(findings);
    }

    // Fix simple code issues
    if (types.includes('simple')) {
      await this.fixSimpleCodeIssues(findings);
    }

    return {
      fixed: this.fixedIssues,
      failed: this.failedFixes,
      summary: this.getSummary()
    };
  }

  /**
   * Fix dependency vulnerabilities
   */
  async fixDependencies(findings) {
    const dependencyFindings = findings.filter(f =>
      f.type === 'dependency' || f.name?.includes('Package')
    );

    if (dependencyFindings.length === 0) {
      return;
    }

    try {
      if (!this.dryRun) {
        console.log('Running npm audit fix...');
        execSync('npm audit fix', { stdio: 'inherit' });

        this.fixedIssues.push({
          type: 'dependency',
          action: 'npm audit fix',
          description: 'Updated vulnerable dependencies',
          count: dependencyFindings.length
        });
      } else {
        console.log('[DRY RUN] Would run: npm audit fix');
        this.fixedIssues.push({
          type: 'dependency',
          action: 'npm audit fix (dry run)',
          description: 'Would update vulnerable dependencies',
          count: dependencyFindings.length
        });
      }
    } catch (error) {
      this.failedFixes.push({
        type: 'dependency',
        error: error.message,
        description: 'Failed to fix dependencies automatically'
      });
    }
  }

  /**
   * Fix configuration issues
   */
  async fixConfigurationIssues(findings) {
    for (const finding of findings) {
      try {
        // Fix CORS issues
        if (finding.type === 'cors-wildcard') {
          await this.fixCORS(finding);
        }

        // Fix insecure session configuration
        if (finding.rule === 'insecureSessionConfig') {
          await this.fixSessionConfig(finding);
        }

        // Fix missing security headers
        if (finding.name?.includes('Security Headers')) {
          await this.addSecurityHeaders(finding);
        }
      } catch (error) {
        this.failedFixes.push({
          type: finding.type,
          file: finding.file,
          error: error.message
        });
      }
    }
  }

  /**
   * Fix CORS configuration
   */
  async fixCORS(finding) {
    const filePath = finding.file;
    let content = await fs.readFile(filePath, 'utf-8');

    // Replace wildcard CORS with example whitelist
    const oldPattern = /cors\(\s*\{[^}]*origin\s*:\s*['"]\*['"]/g;
    const newConfig = `cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true`;

    if (oldPattern.test(content)) {
      if (!this.dryRun) {
        content = content.replace(oldPattern, newConfig);
        await fs.writeFile(filePath, content, 'utf-8');

        this.fixedIssues.push({
          type: 'cors',
          file: filePath,
          action: 'Restricted CORS to whitelist',
          description: 'Changed wildcard CORS to whitelist of origins'
        });
      } else {
        console.log(`[DRY RUN] Would fix CORS in ${filePath}`);
        this.fixedIssues.push({
          type: 'cors',
          file: filePath,
          action: 'Would restrict CORS (dry run)'
        });
      }
    }
  }

  /**
   * Fix session configuration
   */
  async fixSessionConfig(finding) {
    const filePath = finding.file;
    let content = await fs.readFile(filePath, 'utf-8');

    // Fix insecure session config
    const insecurePattern = /session\s*\(\s*\{[^}]*\}/g;
    const secureConfig = `session({
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 3600000, // 1 hour
    sameSite: 'strict'
  }
})`;

    if (!this.dryRun) {
      // This is a simplified fix - in reality, we'd need more sophisticated parsing
      console.log(`⚠️  Manual review needed for session config in ${filePath}`);

      this.fixedIssues.push({
        type: 'session',
        file: filePath,
        action: 'Manual review required',
        description: 'Session configuration needs manual review and update'
      });
    }
  }

  /**
   * Add security headers
   */
  async addSecurityHeaders(finding) {
    const filePath = finding.file;

    if (!this.dryRun) {
      console.log(`⚠️  Add helmet middleware to ${filePath}`);
      console.log('   npm install helmet');
      console.log('   app.use(helmet());');

      this.fixedIssues.push({
        type: 'security-headers',
        file: filePath,
        action: 'Manual action required',
        description: 'Install and configure helmet middleware for security headers'
      });
    }
  }

  /**
   * Fix simple code issues
   */
  async fixSimpleCodeIssues(findings) {
    for (const finding of findings) {
      try {
        // Fix weak comparisons
        if (finding.type === 'type-coercion') {
          await this.fixTypeCoercion(finding);
        }

        // Fix insecure random
        if (finding.rule === 'insecureRandom') {
          await this.fixInsecureRandom(finding);
        }

        // Add simple validation
        if (finding.type === 'missing-validation' && finding.file) {
          await this.addBasicValidation(finding);
        }
      } catch (error) {
        this.failedFixes.push({
          type: finding.type,
          file: finding.file,
          error: error.message
        });
      }
    }
  }

  /**
   * Fix type coercion issues
   */
  async fixTypeCoercion(finding) {
    const filePath = finding.file;
    let content = await fs.readFile(filePath, 'utf-8');

    // Replace == with ===
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      if (i + 1 === finding.line) {
        const line = lines[i];
        // Simple replacement (in reality, need proper AST parsing)
        if (line.includes('==') && !line.includes('===') && !line.includes('!==')) {
          lines[i] = line.replace(/([^=!])={2}([^=])/g, '$1===$2');
          modified = true;
        }
      }
    }

    if (modified && !this.dryRun) {
      await fs.writeFile(filePath, lines.join('\n'), 'utf-8');

      this.fixedIssues.push({
        type: 'type-coercion',
        file: filePath,
        line: finding.line,
        action: 'Changed == to ===',
        description: 'Fixed type coercion by using strict equality'
      });
    } else if (modified) {
      console.log(`[DRY RUN] Would fix type coercion in ${filePath}:${finding.line}`);
      this.fixedIssues.push({
        type: 'type-coercion',
        file: filePath,
        action: 'Would fix type coercion (dry run)'
      });
    }
  }

  /**
   * Fix insecure random number generation
   */
  async fixInsecureRandom(finding) {
    const filePath = finding.file;
    let content = await fs.readFile(filePath, 'utf-8');

    // Check if crypto is already imported
    const hasCrypto = /require\s*\(\s*['"]crypto['"]\s*\)/g.test(content);

    if (!hasCrypto) {
      // Add crypto import at the top
      const lines = content.split('\n');
      let insertIndex = 0;

      // Find last require/import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('require(') || lines[i].includes('import ')) {
          insertIndex = i + 1;
        }
      }

      lines.splice(insertIndex, 0, "const crypto = require('crypto');");
      content = lines.join('\n');
    }

    // Replace Math.random() with crypto.randomBytes()
    content = content.replace(
      /Math\.random\(\)/g,
      'crypto.randomInt(0, Number.MAX_SAFE_INTEGER) / Number.MAX_SAFE_INTEGER'
    );

    if (!this.dryRun) {
      await fs.writeFile(filePath, content, 'utf-8');

      this.fixedIssues.push({
        type: 'insecure-random',
        file: filePath,
        action: 'Replaced Math.random() with crypto.randomInt()',
        description: 'Fixed insecure random number generation'
      });
    } else {
      console.log(`[DRY RUN] Would fix insecure random in ${filePath}`);
    }
  }

  /**
   * Add basic validation
   */
  async addBasicValidation(finding) {
    // This would require sophisticated AST manipulation
    // For now, just log that manual intervention is needed

    this.fixedIssues.push({
      type: 'validation',
      file: finding.file,
      action: 'Manual action required',
      description: 'Add input validation using joi, yup, or express-validator',
      example: `
// Install: npm install joi
const Joi = require('joi');

const schema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required()
});

// In route handler:
const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
      `.trim()
    });
  }

  /**
   * Generate package.json scripts for security
   */
  async addSecurityScripts(packageJsonPath) {
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      // Add security scripts
      const securityScripts = {
        'security:scan': 'tryforge security scan',
        'security:audit': 'tryforge security audit',
        'security:fix': 'npm audit fix',
        'presecurity:scan': 'npm audit'
      };

      let added = false;
      for (const [name, command] of Object.entries(securityScripts)) {
        if (!packageJson.scripts[name]) {
          packageJson.scripts[name] = command;
          added = true;
        }
      }

      if (added && !this.dryRun) {
        await fs.writeFile(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2) + '\n',
          'utf-8'
        );

        this.fixedIssues.push({
          type: 'scripts',
          file: packageJsonPath,
          action: 'Added security scripts to package.json',
          description: 'Added npm scripts for security scanning'
        });
      }
    } catch (error) {
      this.failedFixes.push({
        type: 'scripts',
        error: error.message
      });
    }
  }

  /**
   * Create .env.example file
   */
  async createEnvExample(projectPath, findings) {
    const secretFindings = findings.filter(f =>
      f.type === 'hardcoded-secret' ||
      f.name?.includes('Secret') ||
      f.name?.includes('API Key')
    );

    if (secretFindings.length === 0) {
      return;
    }

    const envExamplePath = path.join(projectPath, '.env.example');
    const envExamples = [
      '# Environment Variables',
      '# Copy this file to .env and fill in your values',
      '',
      'NODE_ENV=development',
      'PORT=3000',
      '',
      '# Security',
      'SESSION_SECRET=your-secure-random-secret-here',
      'JWT_SECRET=your-jwt-secret-here',
      '',
      '# Database',
      'DATABASE_URL=your-database-url',
      '',
      '# API Keys (if needed)',
      '# API_KEY=your-api-key',
      '# AWS_ACCESS_KEY_ID=your-key',
      '# AWS_SECRET_ACCESS_KEY=your-secret'
    ];

    if (!this.dryRun) {
      await fs.writeFile(envExamplePath, envExamples.join('\n') + '\n', 'utf-8');

      this.fixedIssues.push({
        type: 'env-example',
        file: envExamplePath,
        action: 'Created .env.example file',
        description: 'Created template for environment variables'
      });
    }
  }

  /**
   * Get summary of fixes
   */
  getSummary() {
    return {
      totalFixed: this.fixedIssues.length,
      totalFailed: this.failedFixes.length,
      byType: this.groupByType(this.fixedIssues),
      dryRun: this.dryRun
    };
  }

  /**
   * Group fixes by type
   */
  groupByType(fixes) {
    const grouped = {};

    for (const fix of fixes) {
      const type = fix.type || 'other';
      grouped[type] = (grouped[type] || 0) + 1;
    }

    return grouped;
  }

  /**
   * Generate fix report
   */
  generateReport() {
    const lines = [];

    lines.push('╔═══════════════════════════════════════════════════════════════╗');
    lines.push('║                    AUTO-FIX REPORT                             ║');
    lines.push('╚═══════════════════════════════════════════════════════════════╝');
    lines.push('');

    if (this.dryRun) {
      lines.push('⚠️  DRY RUN MODE - No changes were made');
      lines.push('');
    }

    lines.push(`✅ Fixed: ${this.fixedIssues.length} issues`);
    lines.push(`❌ Failed: ${this.failedFixes.length} issues`);
    lines.push('');

    if (this.fixedIssues.length > 0) {
      lines.push('Fixed Issues:');
      lines.push('─────────────────────────────────────────────────────────────────');

      for (const fix of this.fixedIssues) {
        lines.push(`✓ ${fix.type}: ${fix.action}`);
        if (fix.file) {
          lines.push(`  File: ${fix.file}`);
        }
        if (fix.description) {
          lines.push(`  ${fix.description}`);
        }
        if (fix.example) {
          lines.push(`  Example:\n${fix.example}`);
        }
        lines.push('');
      }
    }

    if (this.failedFixes.length > 0) {
      lines.push('Failed Fixes (Manual Intervention Required):');
      lines.push('─────────────────────────────────────────────────────────────────');

      for (const failed of this.failedFixes) {
        lines.push(`✗ ${failed.type}`);
        if (failed.file) {
          lines.push(`  File: ${failed.file}`);
        }
        if (failed.error) {
          lines.push(`  Error: ${failed.error}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}

module.exports = AutoFixer;
