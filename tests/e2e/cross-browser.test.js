const { test, expect } = require('@playwright/test');

test.describe('Cross-Browser Compatibility', () => {
  test('should render correctly in all browsers', async ({ page, browserName }) => {
    await page.goto('/');

    // Basic content should be visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();

    console.log(`Test passed in: ${browserName}`);
  });

  test('should handle JavaScript features in all browsers', async ({ page }) => {
    await page.goto('/');

    // Test modern JS features
    const jsSupport = await page.evaluate(() => {
      return {
        // ES6+ features
        arrow: typeof (() => {}) === 'function',
        promises: typeof Promise !== 'undefined',
        async: typeof (async () => {}) === 'function',
        // Modern APIs
        fetch: typeof fetch !== 'undefined',
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        // DOM APIs
        querySelector: typeof document.querySelector !== 'undefined',
        classList: 'classList' in document.createElement('div'),
      };
    });

    // All features should be supported
    expect(jsSupport.arrow).toBe(true);
    expect(jsSupport.promises).toBe(true);
    expect(jsSupport.async).toBe(true);
    expect(jsSupport.fetch).toBe(true);
    expect(jsSupport.localStorage).toBe(true);
    expect(jsSupport.sessionStorage).toBe(true);
    expect(jsSupport.querySelector).toBe(true);
    expect(jsSupport.classList).toBe(true);
  });

  test('should handle CSS features in all browsers', async ({ page }) => {
    await page.goto('/');

    // Test CSS support
    const cssSupport = await page.evaluate(() => {
      const div = document.createElement('div');
      return {
        flexbox: CSS.supports('display', 'flex'),
        grid: CSS.supports('display', 'grid'),
        customProperties: CSS.supports('--custom', 'value'),
        transforms: CSS.supports('transform', 'translateX(10px)'),
        transitions: CSS.supports('transition', 'all 0.3s'),
      };
    });

    expect(cssSupport.flexbox).toBe(true);
    expect(cssSupport.grid).toBe(true);
    expect(cssSupport.customProperties).toBe(true);
    expect(cssSupport.transforms).toBe(true);
    expect(cssSupport.transitions).toBe(true);
  });

  test('should handle forms in all browsers', async ({ page }) => {
    await page.goto('/contact');

    // Fill and submit form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'Test message');

    // Form should be functional
    const nameValue = await page.inputValue('input[name="name"]');
    expect(nameValue).toBe('Test User');
  });

  test('should handle navigation in all browsers', async ({ page }) => {
    await page.goto('/');

    // Navigate to different pages
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL('/about');

    // Back button should work
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('should handle events in all browsers', async ({ page }) => {
    await page.goto('/');

    // Click events
    const button = await page.locator('button').first();
    if (await button.isVisible()) {
      await button.click();
      // Should not throw error
    }

    // Keyboard events
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });

  test('should handle media queries in all browsers', async ({ page }) => {
    await page.goto('/');

    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(200);
    await expect(page.locator('nav')).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200);
    // Content should still be visible
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle storage APIs in all browsers', async ({ page }) => {
    await page.goto('/');

    // Test localStorage
    const localStorageWorks = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        const value = localStorage.getItem('test');
        localStorage.removeItem('test');
        return value === 'value';
      } catch (e) {
        return false;
      }
    });

    expect(localStorageWorks).toBe(true);

    // Test sessionStorage
    const sessionStorageWorks = await page.evaluate(() => {
      try {
        sessionStorage.setItem('test', 'value');
        const value = sessionStorage.getItem('test');
        sessionStorage.removeItem('test');
        return value === 'value';
      } catch (e) {
        return false;
      }
    });

    expect(sessionStorageWorks).toBe(true);
  });

  test('should handle AJAX requests in all browsers', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for API request
    const response = await page.waitForResponse(
      res => res.url().includes('/api/') && res.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);

    // If API requests are made, they should work
    if (response) {
      expect(response.ok()).toBe(true);
    }
  });

  test('should handle console errors in all browsers', async ({ page, browserName }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`${browserName} console errors:`, errors.length);
    expect(errors).toHaveLength(0);
  });

  test('should handle async operations in all browsers', async ({ page }) => {
    await page.goto('/');

    // Test async/await
    const asyncWorks = await page.evaluate(async () => {
      const promise = new Promise(resolve => {
        setTimeout(() => resolve('success'), 100);
      });
      const result = await promise;
      return result === 'success';
    });

    expect(asyncWorks).toBe(true);
  });
});
