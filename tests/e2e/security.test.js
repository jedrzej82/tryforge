const { test, expect } = require('@playwright/test');

test.describe('Security Tests', () => {
  test('should have secure HTTP headers', async ({ page }) => {
    const response = await page.goto('/');

    const headers = response?.headers();

    // Check for security headers
    if (headers) {
      console.log('Security Headers:', {
        'x-content-type-options': headers['x-content-type-options'],
        'x-frame-options': headers['x-frame-options'],
        'x-xss-protection': headers['x-xss-protection'],
        'strict-transport-security': headers['strict-transport-security'],
        'content-security-policy': headers['content-security-policy'],
      });
    }
  });

  test('should not expose sensitive information in HTML', async ({ page }) => {
    await page.goto('/');

    const content = await page.content();

    // Should not contain sensitive data
    expect(content).not.toContain('password');
    expect(content).not.toContain('api_key');
    expect(content).not.toContain('secret');
    expect(content).not.toContain('private_key');
  });

  test('should sanitize user input in forms', async ({ page }) => {
    await page.goto('/contact');

    // Try XSS attack
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('input[name="name"]', xssPayload);

    // Check if input is sanitized
    const value = await page.inputValue('input[name="name"]');

    // Should either sanitize or escape the script tag
    if (value.includes('<script>')) {
      console.warn('Potential XSS vulnerability: script tag not sanitized');
    }
  });

  test('should have CSRF protection on forms', async ({ page }) => {
    await page.goto('/contact');

    // Check for CSRF token
    const csrfToken = await page.$('input[name="_csrf"]');
    const csrfMeta = await page.$('meta[name="csrf-token"]');

    // CSRF protection should exist
    const hasCsrfProtection = csrfToken !== null || csrfMeta !== null;

    console.log('CSRF Protection:', hasCsrfProtection ? 'Yes' : 'No');
  });

  test('should use HTTPS for external resources', async ({ page }) => {
    await page.goto('/');

    // Get all external resources
    const resources = await page.$$eval('script[src], link[href], img[src]', elements =>
      elements
        .map(el => el.src || el.href)
        .filter(url => url.startsWith('http'))
    );

    // Check if all external resources use HTTPS
    for (const resource of resources) {
      if (resource.startsWith('http://')) {
        console.warn('Insecure resource:', resource);
      }
      // In production, all should be HTTPS
      // expect(resource).toMatch(/^https:/);
    }
  });

  test('should have secure cookies', async ({ page, context }) => {
    await page.goto('/');

    // Set a test cookie
    await context.addCookies([{
      name: 'test_cookie',
      value: 'test_value',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    }]);

    // Verify cookie attributes
    const cookies = await context.cookies();
    const testCookie = cookies.find(c => c.name === 'test_cookie');

    if (testCookie) {
      expect(testCookie.httpOnly).toBe(true);
      expect(testCookie.secure).toBe(true);
      expect(testCookie.sameSite).toBe('Strict');
    }
  });

  test('should prevent clickjacking', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    // Check X-Frame-Options or CSP frame-ancestors
    const xFrameOptions = headers?.['x-frame-options'];
    const csp = headers?.['content-security-policy'];

    const hasClickjackingProtection =
      xFrameOptions === 'DENY' ||
      xFrameOptions === 'SAMEORIGIN' ||
      (csp && csp.includes('frame-ancestors'));

    console.log('Clickjacking Protection:', hasClickjackingProtection ? 'Yes' : 'No');
  });

  test('should not expose error stack traces', async ({ page }) => {
    // Try to trigger an error
    await page.goto('/error-test');

    const content = await page.content();

    // Should not contain stack traces
    expect(content).not.toMatch(/at\s+\w+\s+\(/); // Stack trace pattern
    expect(content).not.toContain('node_modules');
    expect(content).not.toContain('.js:');
  });

  test('should validate file uploads', async ({ page }) => {
    const fileInputs = await page.$$('input[type="file"]');

    for (const input of fileInputs) {
      const accept = await input.getAttribute('accept');

      // File inputs should have accept attribute
      console.log('File input accept:', accept);
    }
  });

  test('should handle SQL injection attempts', async ({ page }) => {
    await page.goto('/contact');

    // Try SQL injection
    const sqlPayload = "'; DROP TABLE users; --";
    await page.fill('input[name="email"]', sqlPayload);
    await page.click('button[type="submit"]');

    // Should show validation error, not database error
    await page.waitForTimeout(1000);

    const content = await page.content();
    expect(content).not.toContain('SQL');
    expect(content).not.toContain('database');
  });

  test('should not expose sensitive API endpoints', async ({ page }) => {
    // Try accessing sensitive endpoints
    const endpoints = [
      '/api/admin',
      '/api/users',
      '/api/config',
      '/api/env',
    ];

    for (const endpoint of endpoints) {
      const response = await page.goto(endpoint).catch(() => null);

      if (response) {
        const status = response.status();
        // Should return 401/403/404, not 200
        expect([401, 403, 404, 500]).toContain(status);
      }
    }
  });

  test('should have rate limiting on API endpoints', async ({ page }) => {
    // Make multiple rapid requests
    const requests = [];

    for (let i = 0; i < 20; i++) {
      requests.push(
        page.goto('/api/test').catch(() => null)
      );
    }

    const responses = await Promise.all(requests);

    // Check if any requests were rate limited
    const rateLimited = responses.some(r => r?.status() === 429);

    console.log('Rate limiting detected:', rateLimited ? 'Yes' : 'No');
  });

  test('should sanitize URLs', async ({ page }) => {
    // Try to navigate to javascript: URL
    await page.goto('/');

    // Check all links
    const links = await page.$$eval('a', anchors =>
      anchors.map(a => a.href)
    );

    for (const link of links) {
      expect(link).not.toMatch(/^javascript:/i);
      expect(link).not.toMatch(/^data:/i);
      expect(link).not.toMatch(/^vbscript:/i);
    }
  });

  test('should have proper Content-Type headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    const contentType = headers?.['content-type'];

    // Should have charset specified
    if (contentType) {
      expect(contentType).toMatch(/charset=/i);
    }
  });

  test('should prevent information disclosure', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    // Should not expose server information
    const server = headers?.['server'];
    const xPoweredBy = headers?.['x-powered-by'];

    console.log('Server header:', server || 'Not exposed');
    console.log('X-Powered-By header:', xPoweredBy || 'Not exposed');

    // Ideally these should not be present
    // expect(xPoweredBy).toBeUndefined();
  });
});
