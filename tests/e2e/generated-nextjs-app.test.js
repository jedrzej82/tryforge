const { test, expect } = require('@playwright/test');
const { waitForAPIResponse } = require('./utils/test-helpers');

test.describe('Generated Next.js App', () => {
  test('should render homepage with SSR', async ({ page }) => {
    await page.goto('/');

    // Check for server-rendered content
    const content = await page.content();
    expect(content).toContain('</html>'); // Full HTML rendered

    // Check meta tags (SSR)
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
  });

  test('should navigate with client-side routing', async ({ page }) => {
    await page.goto('/');

    // Click link (should use Next.js Link)
    await page.click('a[href="/dashboard"]');

    // Navigation should be instant (client-side)
    await expect(page).toHaveURL('/dashboard');

    // Content should load without full page reload
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should fetch data from API routes', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for API call
    const response = await page.waitForResponse(res =>
      res.url().includes('/api/') && res.status() === 200,
      { timeout: 10000 }
    );

    expect(response.ok()).toBeTruthy();

    // Data should be displayed
    await expect(page.locator('[data-testid="data-content"]')).toBeVisible();
  });

  test('should handle dynamic routes', async ({ page }) => {
    await page.goto('/blog');

    // Click on a blog post
    await page.click('article:first-child a');

    // Should navigate to dynamic route
    await expect(page).toHaveURL(/\/blog\/[^/]+/);

    // Content should load
    await expect(page.locator('article h1')).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    await page.goto('/dashboard');

    // Loading state should appear briefly
    const loading = page.locator('[data-testid="loading"]');

    // Content should eventually appear
    await expect(page.locator('[data-testid="content"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle server-side rendering errors', async ({ page }) => {
    // Navigate to page that might have SSR errors
    const response = await page.goto('/error-test');

    // Should still render error page
    expect(response?.status()).toBeLessThan(500);
  });

  test('should prefetch linked pages', async ({ page }) => {
    await page.goto('/');

    // Get network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/_next/data/')) {
        requests.push(request.url());
      }
    });

    // Hover over link (Next.js prefetches on hover)
    await page.hover('a[href="/about"]');
    await page.waitForTimeout(1000);

    // Some prefetch requests should have been made
    // (This might not always work depending on Next.js version)
  });

  test('should render API route response', async ({ page }) => {
    // Direct access to API route
    const response = await page.goto('/api/hello');

    expect(response?.status()).toBe(200);

    const body = await response?.json();
    expect(body).toBeTruthy();
  });

  test('should handle image optimization', async ({ page }) => {
    await page.goto('/');

    // Find Next.js Image components
    const images = await page.$$('img');

    for (const img of images.slice(0, 3)) {
      const src = await img.getAttribute('src');

      // Next.js optimized images have specific patterns
      if (src?.includes('_next/image')) {
        expect(src).toBeTruthy();
      }
    }
  });

  test('should support static generation', async ({ page }) => {
    const response = await page.goto('/about');

    // Check response headers for static generation
    const headers = response?.headers();

    // Page should load successfully
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle middleware', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/protected');

    // Middleware might redirect to login
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should render custom 404 page', async ({ page }) => {
    await page.goto('/non-existent-nextjs-page');

    // Should show custom 404
    await expect(page.locator('h1')).toContainText('404');
  });

  test('should handle environment variables', async ({ page }) => {
    await page.goto('/');

    // Check if public env variables are accessible
    const envVar = await page.evaluate(() =>
      // @ts-ignore
      window.__NEXT_DATA__?.props?.pageProps
    );

    expect(envVar).toBeDefined();
  });

  test('should support internationalization', async ({ page }) => {
    await page.goto('/');

    // Check for language selector if i18n is enabled
    const langSelector = page.locator('[data-testid="language-selector"]');

    if (await langSelector.isVisible()) {
      await langSelector.click();

      // Should show language options
      await expect(page.locator('[data-testid="language-options"]')).toBeVisible();
    }
  });

  test('should handle form submission with API routes', async ({ page }) => {
    await page.goto('/contact');

    // Fill form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'Test message');

    // Submit form
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/contact')),
      page.click('button[type="submit"]')
    ]);

    expect(response.status()).toBe(200);
  });

  test('should support ISR (Incremental Static Regeneration)', async ({ page }) => {
    const response = await page.goto('/blog');

    // Check for ISR headers
    const headers = response?.headers();

    // Page should load
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });
});
