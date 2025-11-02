const { test, expect } = require('@playwright/test');

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('homepage should match screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot of full page
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('homepage header should match screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot of specific element
    const header = await page.locator('header');
    await expect(header).toHaveScreenshot('header.png');
  });

  test('navigation menu should match screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = await page.locator('nav');
    await expect(nav).toHaveScreenshot('navigation.png');
  });

  test('footer should match screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = await page.locator('footer');
    await expect(footer).toHaveScreenshot('footer.png');
  });

  test('about page should match screenshot', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('about-page.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('mobile homepage should match screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('tablet homepage should match screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('tablet-homepage.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('button hover state should match screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const button = await page.locator('button').first();
    await button.hover();
    await page.waitForTimeout(200);

    await expect(button).toHaveScreenshot('button-hover.png');
  });

  test('form should match screenshot', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const form = await page.locator('form').first();
    await expect(form).toHaveScreenshot('contact-form.png');
  });

  test('form with validation errors should match screenshot', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    const form = await page.locator('form').first();
    await expect(form).toHaveScreenshot('form-with-errors.png');
  });

  test('dark mode should match screenshot', async ({ page }) => {
    await page.goto('/');

    // Try to enable dark mode
    const darkModeToggle = await page.$('[data-testid="dark-mode-toggle"]');
    if (darkModeToggle) {
      await darkModeToggle.click();
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('dark-mode-homepage.png', {
        fullPage: true,
        maxDiffPixels: 200
      });
    }
  });

  test('modal dialog should match screenshot', async ({ page }) => {
    await page.goto('/');

    // Try to open modal
    const modalTrigger = await page.$('[data-testid="modal-trigger"]');
    if (modalTrigger) {
      await modalTrigger.click();
      await page.waitForTimeout(500);

      const modal = await page.locator('[role="dialog"]');
      await expect(modal).toHaveScreenshot('modal-dialog.png');
    }
  });

  test('loading state should match screenshot', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Capture loading state quickly
    const loading = await page.$('[data-testid="loading"]');
    if (loading) {
      await expect(loading).toHaveScreenshot('loading-state.png');
    }
  });

  test('error page should match screenshot', async ({ page }) => {
    await page.goto('/404');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
      maxDiffPixels: 50
    });
  });

  test('admin panel should match screenshot', async ({ page }) => {
    await page.goto('http://localhost:3333');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('admin-panel.png', {
      fullPage: true,
      maxDiffPixels: 150
    });
  });
});
