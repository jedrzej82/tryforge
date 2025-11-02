const { test, expect } = require('@playwright/test');
const { waitForNetworkIdle, getConsoleErrors } = require('./utils/test-helpers');

test.describe('Generated React App', () => {
  test('should render homepage', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Generated App|React App/);

    // Check main content
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Click navigation link
    await page.click('nav a:has-text("About")');

    // Verify URL changed
    await expect(page).toHaveURL('/about');

    // Verify content loaded
    await expect(page.locator('h1')).toContainText('About');
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/non-existent-page');

    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('text=Page Not Found')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('nav')).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu should be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('should render navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check navigation exists
    const nav = await page.locator('nav');
    await expect(nav).toBeVisible();

    // Check for navigation links
    const links = await page.$$eval('nav a', anchors => anchors.length);
    expect(links).toBeGreaterThan(0);
  });

  test('should handle form submission', async ({ page }) => {
    await page.goto('/contact');

    // Fill out form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'Test message');

    // Submit form
    await page.click('button[type="submit"]');

    // Check for success message
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 5000 });
  });

  test('should display loading states', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for loading indicator
    const loading = page.locator('[data-testid="loading"]');

    // Content should eventually appear
    await expect(page.locator('[data-testid="content"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle button clicks', async ({ page }) => {
    await page.goto('/');

    // Find and click a button
    const button = await page.locator('button').first();
    if (await button.isVisible()) {
      await button.click();

      // Verify some action occurred (could be modal, navigation, etc.)
      await page.waitForTimeout(500);
    }
  });

  test('should support dark mode toggle', async ({ page }) => {
    await page.goto('/');

    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');

    if (await darkModeToggle.isVisible()) {
      // Get initial theme
      const initialClass = await page.getAttribute('html', 'class');

      // Toggle dark mode
      await darkModeToggle.click();

      // Check if theme changed
      const newClass = await page.getAttribute('html', 'class');
      expect(initialClass).not.toBe(newClass);
    }
  });

  test('should handle external links correctly', async ({ page }) => {
    await page.goto('/');

    // Find external links
    const externalLinks = await page.$$('a[href^="http"]');

    for (const link of externalLinks.slice(0, 3)) {
      const target = await link.getAttribute('target');
      const rel = await link.getAttribute('rel');

      // External links should open in new tab
      expect(target).toBe('_blank');

      // Should have security attributes
      if (rel) {
        expect(rel).toContain('noopener');
      }
    }
  });

  test('should render footer', async ({ page }) => {
    await page.goto('/');

    const footer = await page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should handle image loading', async ({ page }) => {
    await page.goto('/');

    // Find all images
    const images = await page.$$('img');

    for (const img of images) {
      // Check if image has alt text
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();

      // Check if image loaded
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    const focused1 = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused1);

    // Continue tabbing
    await page.keyboard.press('Tab');
    const focused2 = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused2);
  });

  test('should display copyright information', async ({ page }) => {
    await page.goto('/');

    const footer = await page.textContent('footer');
    expect(footer).toMatch(/©|\(c\)|copyright/i);
  });
});
