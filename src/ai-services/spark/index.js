/**
 * GitHub Spark Automation
 * Automates GitHub Spark using Playwright based on Claude's detailed component descriptions
 */

const { chromium } = require('playwright');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

class SparkAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.sessionPath = path.join(process.env.HOME, '.tryforge', '.github-session');
  }

  /**
   * Initialize Playwright and open GitHub Spark
   */
  async initialize() {
    // Launch browser (headless can be configured)
    this.browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
    });

    // Load saved session if exists
    const context = await this.loadSession();

    this.page = await context.newPage();

    // Navigate to GitHub Spark
    await this.page.goto('https://github.com/spark');

    // Check if logged in, if not - prompt user to login
    await this.ensureAuthenticated();
  }

  /**
   * Load saved GitHub session
   */
  async loadSession() {
    const sessionFile = path.join(this.sessionPath, 'auth.json');

    if (await fs.pathExists(sessionFile)) {
      const sessionData = await fs.readJSON(sessionFile);
      return await this.browser.newContext({
        storageState: sessionData,
      });
    }

    return await this.browser.newContext();
  }

  /**
   * Save GitHub session
   */
  async saveSession() {
    const sessionData = await this.page.context().storageState();
    await fs.ensureDir(this.sessionPath);
    await fs.writeJSON(path.join(this.sessionPath, 'auth.json'), sessionData);
  }

  /**
   * Ensure user is authenticated to GitHub
   */
  async ensureAuthenticated() {
    // Check if login page
    const isLoginPage = await this.page.locator('text=Sign in to GitHub').isVisible().catch(() => false);

    if (isLoginPage) {
      console.log(chalk.yellow('\n⚠️  Please login to GitHub in the browser window...'));
      console.log(chalk.gray('   Waiting for authentication...\n'));

      // Wait for user to login (wait for navigation away from login page)
      await this.page.waitForURL(url => !url.includes('login'), { timeout: 120000 });

      // Save session for future use
      await this.saveSession();

      console.log(chalk.green('✅ Authenticated! Session saved.\n'));
    }
  }

  /**
   * Generate component using GitHub Spark
   * @param {Object} componentDesc - Component description (created by Claude)
   * @returns {Object} Generated component info
   */
  async generateComponent(componentDesc) {
    console.log(chalk.gray(`   Generating: ${componentDesc.name}`));
    console.log(chalk.gray(`   Description: ${componentDesc.description.substring(0, 100)}...`));

    // Navigate to Spark component generator
    await this.page.goto('https://github.com/spark/new');

    // Fill in component name
    await this.page.fill('[placeholder="Component name"]', componentDesc.name);

    // Fill in Claude's detailed description
    await this.page.fill('[placeholder="Describe your component"]', componentDesc.description);

    // Select framework
    await this.page.selectOption('select[name="framework"]', componentDesc.framework.toLowerCase());

    // Click generate
    await this.page.click('button:has-text("Generate")');

    // Wait for generation to complete
    await this.page.waitForSelector('text=Generation complete', { timeout: 120000 });

    // Get generated files
    const files = await this.page.locator('.file-entry').allTextContents();

    return {
      name: componentDesc.name,
      files: files,
      description: componentDesc.description,
    };
  }

  /**
   * Commit generated components to GitHub
   */
  async commit(message) {
    await this.page.fill('[name="commit-message"]', message);
    await this.page.click('button:has-text("Commit")');
    await this.page.waitForSelector('text=Committed successfully');
  }

  /**
   * Pull changes from GitHub to local
   */
  async pullChanges(projectName) {
    // This would use git commands to pull changes
    // Simplified for this example
    console.log(chalk.gray(`   Pulling changes for ${projectName}...`));
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = SparkAutomation;
