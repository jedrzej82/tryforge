const { test, expect } = require('@playwright/test');
const { waitForElement, fillForm } = require('./utils/test-helpers');

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3333'); // Admin panel port
  });

  test('should load admin panel homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/TryForge Admin/);
    await expect(page.locator('h1')).toContainText('API Configuration');
  });

  test('should configure Claude API key', async ({ page }) => {
    // Navigate to Claude config
    await page.click('text=Claude API');

    // Enter API key
    await page.fill('input[name="apiKey"]', 'test-api-key-123');
    await page.selectOption('select[name="authMode"]', 'api');

    // Save configuration
    await page.click('button:has-text("Save Configuration")');

    // Verify success message
    await expect(page.locator('.success-message')).toContainText('Configuration saved');
  });

  test('should test API connection', async ({ page }) => {
    await page.click('text=Claude API');
    await page.fill('input[name="apiKey"]', process.env.ANTHROPIC_API_KEY || 'test-key');

    // Test connection
    await page.click('button:has-text("Test Connection")');

    // Wait for result
    await page.waitForSelector('.connection-status', { timeout: 10000 });
    const status = await page.textContent('.connection-status');

    expect(status).toBeTruthy();
  });

  test('should configure OpenRouter provider', async ({ page }) => {
    await page.click('text=OpenRouter');

    // Select model
    await page.selectOption('select[name="model"]', 'minimax/minimax-01');

    // Enter API key
    await page.fill('input[name="apiKey"]', 'test-openrouter-key');

    // Save
    await page.click('button:has-text("Save Configuration")');

    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should display configuration status', async ({ page }) => {
    // Check status indicators
    const claudeStatus = await page.locator('[data-testid="claude-status"]');
    const openrouterStatus = await page.locator('[data-testid="openrouter-status"]');

    await expect(claudeStatus).toBeVisible();
    await expect(openrouterStatus).toBeVisible();
  });

  test('should switch between providers', async ({ page }) => {
    // Click on Claude provider
    await page.click('[data-testid="claude-provider"]');
    await expect(page.locator('.provider-active')).toContainText('Claude');

    // Switch to OpenRouter
    await page.click('[data-testid="openrouter-provider"]');
    await expect(page.locator('.provider-active')).toContainText('OpenRouter');
  });

  test('should validate API key format', async ({ page }) => {
    await page.click('text=Claude API');

    // Enter invalid API key
    await page.fill('input[name="apiKey"]', 'invalid');
    await page.click('button:has-text("Save Configuration")');

    // Should show validation error
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should display model selection dropdown', async ({ page }) => {
    await page.click('text=OpenRouter');

    // Check if model dropdown exists
    const modelSelect = await page.locator('select[name="model"]');
    await expect(modelSelect).toBeVisible();

    // Check if dropdown has options
    const options = await page.$$eval('select[name="model"] option',
      opts => opts.map(opt => opt.value)
    );
    expect(options.length).toBeGreaterThan(0);
  });

  test('should save provider preferences', async ({ page }) => {
    // Configure Claude
    await page.click('text=Claude API');
    await page.fill('input[name="apiKey"]', 'test-key-123');
    await page.click('button:has-text("Save Configuration")');

    // Reload page
    await page.reload();

    // Check if configuration persisted
    await page.click('text=Claude API');
    const savedKey = await page.inputValue('input[name="apiKey"]');
    expect(savedKey).toBe('test-key-123');
  });

  test('should handle connection timeout gracefully', async ({ page }) => {
    await page.click('text=Claude API');
    await page.fill('input[name="apiKey"]', 'timeout-test-key');

    // Mock slow connection
    await page.route('**/api/test-connection', route => {
      setTimeout(() => route.abort(), 5000);
    });

    await page.click('button:has-text("Test Connection")');

    // Should show timeout error
    await expect(page.locator('.error-message')).toContainText(/timeout|failed/i, {
      timeout: 10000
    });
  });

  test('should display configuration help text', async ({ page }) => {
    await page.click('text=Claude API');

    // Check for help text
    const helpText = await page.locator('[data-testid="help-text"]');
    await expect(helpText).toBeVisible();
  });
});
