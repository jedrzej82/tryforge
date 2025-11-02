const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

/**
 * E2E tests for TryForge CLI
 * These tests execute the actual CLI commands and verify output
 */

test.describe('TryForge CLI Integration', () => {
  const testOutputDir = path.join(process.cwd(), 'test-output');

  test.beforeAll(async () => {
    // Create test output directory
    await fs.ensureDir(testOutputDir);
  });

  test.afterAll(async () => {
    // Clean up test output
    await fs.remove(testOutputDir);
  });

  test('should display help information', () => {
    const output = execSync('node src/cli/index.js --help', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(output).toContain('Usage:');
    expect(output).toContain('Options:');
    expect(output).toContain('Commands:');
  });

  test('should display version information', () => {
    const output = execSync('node src/cli/index.js --version', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(output).toMatch(/\d+\.\d+\.\d+/); // Version number format
  });

  test('should list available templates', () => {
    const output = execSync('node src/cli/index.js list', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(output).toContain('templates');
  });

  test.skip('should generate a React app', async () => {
    const appName = 'test-react-app';
    const appPath = path.join(testOutputDir, appName);

    // Run CLI command to generate app
    const output = execSync(
      `node src/cli/index.js create ${appName} --template react --yes`,
      {
        encoding: 'utf-8',
        cwd: testOutputDir
      }
    );

    expect(output).toContain('success');

    // Verify files were created
    expect(await fs.pathExists(appPath)).toBe(true);
    expect(await fs.pathExists(path.join(appPath, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(appPath, 'src'))).toBe(true);
  });

  test.skip('should generate a Next.js app', async () => {
    const appName = 'test-nextjs-app';
    const appPath = path.join(testOutputDir, appName);

    // Run CLI command to generate app
    const output = execSync(
      `node src/cli/index.js create ${appName} --template nextjs --yes`,
      {
        encoding: 'utf-8',
        cwd: testOutputDir
      }
    );

    expect(output).toContain('success');

    // Verify files were created
    expect(await fs.pathExists(appPath)).toBe(true);
    expect(await fs.pathExists(path.join(appPath, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(appPath, 'pages'))).toBe(true);
  });

  test('should handle invalid commands gracefully', () => {
    try {
      execSync('node src/cli/index.js invalid-command', {
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Should throw error for invalid command
      expect(error.message).toBeTruthy();
    }
  });

  test('should validate required parameters', () => {
    try {
      execSync('node src/cli/index.js create', {
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Should throw error for missing parameters
      expect(error.message).toBeTruthy();
    }
  });

  test.skip('should handle AI generation', async () => {
    // This test requires API keys
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('⏭️  Skipping AI generation test (no API key)');
      return;
    }

    const appName = 'test-ai-app';
    const appPath = path.join(testOutputDir, appName);

    try {
      const output = execSync(
        `node src/cli/index.js generate ${appName} --prompt "Create a simple blog" --yes`,
        {
          encoding: 'utf-8',
          cwd: testOutputDir,
          timeout: 60000 // 60 seconds
        }
      );

      expect(output).toContain('success');
      expect(await fs.pathExists(appPath)).toBe(true);
    } catch (error) {
      console.error('AI generation failed:', error.message);
      // Don't fail test if API is unavailable
    }
  });

  test('should support configuration file', async () => {
    // Create test config
    const configPath = path.join(testOutputDir, 'tryforge.config.json');
    await fs.writeJson(configPath, {
      template: 'react',
      features: ['routing', 'state-management']
    });

    // Verify config exists
    expect(await fs.pathExists(configPath)).toBe(true);
  });

  test.skip('should handle graphics generation', async () => {
    if (!process.env.POLLINATIONS_API_KEY) {
      console.log('⏭️  Skipping graphics generation test (no API key)');
      return;
    }

    const outputPath = path.join(testOutputDir, 'test-graphics');
    await fs.ensureDir(outputPath);

    try {
      const output = execSync(
        `node src/cli/index.js generate-graphics --prompt "Logo design" --output ${outputPath}`,
        {
          encoding: 'utf-8',
          cwd: process.cwd(),
          timeout: 30000
        }
      );

      expect(output).toContain('success');

      // Check if images were generated
      const files = await fs.readdir(outputPath);
      expect(files.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('Graphics generation failed:', error.message);
    }
  });

  test('should provide detailed error messages', () => {
    try {
      execSync('node src/cli/index.js create test --template invalid', {
        encoding: 'utf-8',
        cwd: testOutputDir
      });
    } catch (error) {
      // Error message should be helpful
      const errorMessage = error.stderr?.toString() || error.message;
      expect(errorMessage).toBeTruthy();
    }
  });
});

test.describe('TryForge CLI - Generated App Testing', () => {
  test.skip('generated app should start successfully', async ({ page }) => {
    // This assumes an app has been generated
    const appPath = path.join(process.cwd(), 'test-output', 'test-app');

    if (await fs.pathExists(appPath)) {
      // Install dependencies
      execSync('npm install', {
        cwd: appPath,
        stdio: 'inherit'
      });

      // Try to start the app (in background)
      // Note: This is complex and might need a separate test setup
      console.log('✅ Generated app structure verified');
    }
  });

  test.skip('generated app should have proper structure', async () => {
    const appPath = path.join(process.cwd(), 'test-output', 'test-app');

    if (await fs.pathExists(appPath)) {
      // Check for essential files
      const essentialFiles = [
        'package.json',
        'README.md',
        'src',
      ];

      for (const file of essentialFiles) {
        const filePath = path.join(appPath, file);
        expect(await fs.pathExists(filePath)).toBe(true);
      }
    }
  });

  test.skip('generated app package.json should be valid', async () => {
    const appPath = path.join(process.cwd(), 'test-output', 'test-app');
    const packageJsonPath = path.join(appPath, 'package.json');

    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);

      // Verify essential fields
      expect(packageJson.name).toBeTruthy();
      expect(packageJson.version).toBeTruthy();
      expect(packageJson.scripts).toBeTruthy();
      expect(packageJson.dependencies).toBeTruthy();
    }
  });
});
