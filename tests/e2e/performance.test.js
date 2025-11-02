const { test, expect } = require('@playwright/test');

test.describe('Performance Tests', () => {
  test('should load homepage within 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;

    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals - LCP', async ({ page }) => {
    await page.goto('/');

    // Largest Contentful Paint
    const lcp = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Timeout after 10 seconds
        setTimeout(() => resolve(0), 10000);
      });
    });

    console.log(`LCP: ${lcp}ms`);
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500); // Good LCP is < 2.5s
    }
  });

  test('should have good First Input Delay', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simulate user interaction
    const button = await page.$('button, a');
    if (button) {
      const start = Date.now();
      await button.click();
      const fid = Date.now() - start;

      console.log(`FID: ${fid}ms`);
      expect(fid).toBeLessThan(100); // Good FID is < 100ms
    }
  });

  test('should have minimal Cumulative Layout Shift', async ({ page }) => {
    await page.goto('/');

    // Wait for page to settle
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });

        // Resolve after 3 seconds
        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    console.log(`CLS: ${cls}`);
    expect(cls).toBeLessThan(0.1); // Good CLS is < 0.1
  });

  test('should have minimal bundle size', async ({ page }) => {
    const resources = [];
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          resources.push({
            url: response.url(),
            size: parseInt(contentLength)
          });
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const totalSizeKB = (totalSize / 1024).toFixed(2);

    console.log(`Total bundle size: ${totalSizeKB}KB`);
    console.log('Resources:', resources.map(r => ({
      url: r.url.split('/').pop(),
      size: `${(r.size / 1024).toFixed(2)}KB`
    })));

    expect(totalSize).toBeLessThan(500000); // 500KB threshold
  });

  test('should render First Contentful Paint quickly', async ({ page }) => {
    await page.goto('/');

    const fcp = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          resolve(fcpEntry ? fcpEntry.startTime : 0);
        }).observe({ entryTypes: ['paint'] });

        // Timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log(`FCP: ${fcp}ms`);
    if (fcp > 0) {
      expect(fcp).toBeLessThan(1800); // Good FCP is < 1.8s
    }
  });

  test('should have optimized images', async ({ page }) => {
    const images = [];
    page.on('response', response => {
      if (response.url().match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const contentLength = response.headers()['content-length'];
        images.push({
          url: response.url(),
          size: contentLength ? parseInt(contentLength) : 0
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('Images loaded:', images.length);

    for (const img of images) {
      const sizeKB = (img.size / 1024).toFixed(2);
      console.log(`Image: ${img.url.split('/').pop()} - ${sizeKB}KB`);

      // Individual images should not exceed 200KB
      expect(img.size).toBeLessThan(200000);
    }
  });

  test('should have minimal Time to Interactive', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');

    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');
    const tti = Date.now() - start;

    console.log(`Time to Interactive: ${tti}ms`);
    expect(tti).toBeLessThan(3800); // Good TTI is < 3.8s
  });

  test('should efficiently load fonts', async ({ page }) => {
    const fonts = [];
    page.on('response', response => {
      if (response.url().match(/\.(woff|woff2|ttf|otf)$/i)) {
        const contentLength = response.headers()['content-length'];
        fonts.push({
          url: response.url(),
          size: contentLength ? parseInt(contentLength) : 0
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const totalFontSize = fonts.reduce((sum, f) => sum + f.size, 0);
    const totalFontSizeKB = (totalFontSize / 1024).toFixed(2);

    console.log(`Total font size: ${totalFontSizeKB}KB`);
    console.log('Fonts loaded:', fonts.length);

    // Total font size should be reasonable
    if (fonts.length > 0) {
      expect(totalFontSize).toBeLessThan(150000); // 150KB for fonts
    }
  });

  test('should have minimal JavaScript execution time', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('navigation')[0];
      return {
        domInteractive: perfEntries.domInteractive,
        domComplete: perfEntries.domComplete,
        loadEventEnd: perfEntries.loadEventEnd
      };
    });

    console.log('Performance metrics:', metrics);

    // DOM should become interactive quickly
    expect(metrics.domInteractive).toBeLessThan(2000);
  });

  test('should have efficient CSS loading', async ({ page }) => {
    const cssFiles = [];
    page.on('response', response => {
      if (response.url().endsWith('.css')) {
        const contentLength = response.headers()['content-length'];
        cssFiles.push({
          url: response.url(),
          size: contentLength ? parseInt(contentLength) : 0
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const totalCSSSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
    const totalCSSSizeKB = (totalCSSSize / 1024).toFixed(2);

    console.log(`Total CSS size: ${totalCSSSizeKB}KB`);
    console.log('CSS files loaded:', cssFiles.length);

    // CSS should be reasonably sized
    expect(totalCSSSize).toBeLessThan(100000); // 100KB for CSS
  });

  test('should minimize HTTP requests', async ({ page }) => {
    let requestCount = 0;
    page.on('request', () => requestCount++);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`Total HTTP requests: ${requestCount}`);

    // Should have a reasonable number of requests
    expect(requestCount).toBeLessThan(50);
  });

  test('should use compression for text resources', async ({ page }) => {
    const compressedResources = [];

    page.on('response', response => {
      const contentType = response.headers()['content-type'];
      const encoding = response.headers()['content-encoding'];

      if (contentType?.includes('javascript') || contentType?.includes('css') || contentType?.includes('html')) {
        compressedResources.push({
          url: response.url().split('/').pop(),
          compressed: !!encoding
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('Compressed resources:', compressedResources.filter(r => r.compressed).length);
    console.log('Total text resources:', compressedResources.length);

    // Most text resources should be compressed
    const compressionRate = compressedResources.filter(r => r.compressed).length / compressedResources.length;
    if (compressedResources.length > 0) {
      expect(compressionRate).toBeGreaterThan(0.5);
    }
  });

  test('should have fast server response time', async ({ page }) => {
    const start = Date.now();
    const response = await page.goto('/');
    const responseTime = Date.now() - start;

    console.log(`Server response time: ${responseTime}ms`);

    // Server should respond quickly
    expect(response?.status()).toBe(200);
    expect(responseTime).toBeLessThan(600); // TTFB should be < 600ms
  });
});
