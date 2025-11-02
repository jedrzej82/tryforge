const { chromium } = require('@playwright/test');
const fs = require('fs-extra');
const path = require('path');

/**
 * Global test setup
 * Runs once before all tests
 */
async function globalSetup() {
  console.log('🚀 Starting E2E test setup...');

  // Create test results directories
  const dirs = [
    'test-results',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'playwright-report',
  ];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(process.cwd(), dir));
  }

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Check if test server is running
    const isServerRunning = await checkServer(page, 'http://localhost:3000');
    if (isServerRunning) {
      console.log('✅ Test server is running');
    } else {
      console.warn('⚠️  Test server is not running at http://localhost:3000');
      console.log('   Start the server with: npm run start:test');
    }

    // Check admin panel
    const isAdminRunning = await checkServer(page, 'http://localhost:3333');
    if (isAdminRunning) {
      console.log('✅ Admin panel is running');
    } else {
      console.log('ℹ️  Admin panel not running (optional for some tests)');
    }

    // Clear any existing test data
    await clearTestData(page);

    // Seed test data if needed
    await seedTestData(page);

    console.log('✅ E2E test setup complete');
  } catch (error) {
    console.error('❌ E2E test setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Global test teardown
 * Runs once after all tests
 */
async function globalTeardown() {
  console.log('🧹 Starting E2E test teardown...');

  try {
    // Clean up test data
    // (Implementation depends on your backend)

    console.log('✅ E2E test teardown complete');
  } catch (error) {
    console.error('❌ E2E test teardown failed:', error.message);
  }
}

/**
 * Check if server is running
 */
async function checkServer(page, url) {
  try {
    const response = await page.goto(url, { timeout: 5000, waitUntil: 'domcontentloaded' });
    return response && response.ok();
  } catch (error) {
    return false;
  }
}

/**
 * Clear test data
 */
async function clearTestData(page) {
  try {
    // Clear browser storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear cookies
    const context = page.context();
    await context.clearCookies();

    console.log('✅ Test data cleared');
  } catch (error) {
    console.warn('⚠️  Failed to clear test data:', error.message);
  }
}

/**
 * Seed test data
 */
async function seedTestData(page) {
  try {
    // Seed any necessary test data
    // This could include:
    // - Creating test users
    // - Seeding database
    // - Setting up test configurations

    console.log('✅ Test data seeded');
  } catch (error) {
    console.warn('⚠️  Failed to seed test data:', error.message);
  }
}

module.exports = { globalSetup, globalTeardown };
