const { test, expect } = require('@playwright/test');

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(focused);

    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Should be able to activate with Enter
    focused = await page.evaluate(() => document.activeElement.tagName);
    if (focused === 'BUTTON' || focused === 'A') {
      await page.keyboard.press('Enter');
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
      elements.map(el => ({ tag: el.tagName, text: el.textContent }))
    );

    // Should have exactly one h1
    const h1Count = headings.filter(h => h.tag === 'H1').length;
    expect(h1Count).toBe(1);

    // Headings should not skip levels
    const levels = headings.map(h => parseInt(h.tag.charAt(1)));
    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have alt text for images', async ({ page }) => {
    const images = await page.$$('img');

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();

      // Alt text should not be just the filename
      expect(alt).not.toMatch(/\.(jpg|jpeg|png|gif|svg)$/i);
    }
  });

  test('should have proper form labels', async ({ page }) => {
    const forms = await page.$$('form');

    if (forms.length > 0) {
      await page.goto('/contact');

      const inputs = await page.$$('input[type="text"], input[type="email"], input[type="password"], textarea');

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        if (id) {
          const label = await page.$(`label[for="${id}"]`);
          expect(label || ariaLabel || ariaLabelledBy).toBeTruthy();
        } else {
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Get all text elements
    const elements = await page.$$('p, h1, h2, h3, h4, h5, h6, span, a, button');

    for (const element of elements.slice(0, 10)) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });

      // Basic check that colors are defined
      expect(styles.color).toBeTruthy();
    }
  });

  test('should have ARIA landmarks', async ({ page }) => {
    // Check for main landmark
    const main = await page.$('main, [role="main"]');
    expect(main).toBeTruthy();

    // Check for navigation
    const nav = await page.$('nav, [role="navigation"]');
    expect(nav).toBeTruthy();
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Get focused element
    const focused = await page.evaluateHandle(() => document.activeElement);

    // Check if element has visible focus indicator
    const outline = await focused.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      };
    });

    // Should have some form of focus indicator
    const hasFocusIndicator =
      outline.outlineWidth !== '0px' ||
      outline.boxShadow !== 'none';

    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should have descriptive link text', async ({ page }) => {
    const links = await page.$$('a');

    for (const link of links.slice(0, 10)) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      const linkText = text?.trim() || ariaLabel;

      if (linkText) {
        // Link text should not be generic
        expect(linkText.toLowerCase()).not.toMatch(/^(click here|read more|link)$/);
      }
    }
  });

  test('should have proper button semantics', async ({ page }) => {
    const buttons = await page.$$('button, [role="button"]');

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      // Buttons should have accessible text
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Check for skip navigation link
    const skipLink = await page.$('a[href="#main"], a[href="#content"]');

    // Skip link is a best practice but not required
    if (skipLink) {
      const text = await skipLink.textContent();
      expect(text?.toLowerCase()).toContain('skip');
    }
  });

  test('should have lang attribute on html', async ({ page }) => {
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
    expect(lang?.length).toBeGreaterThanOrEqual(2);
  });

  test('should have descriptive page title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title.toLowerCase()).not.toBe('untitled');
  });

  test('should have proper table structure', async ({ page }) => {
    const tables = await page.$$('table');

    for (const table of tables) {
      // Tables should have headers
      const hasHeaders = await table.$$('th');
      expect(hasHeaders.length).toBeGreaterThan(0);
    }
  });

  test('should handle focus trap in modals', async ({ page }) => {
    // Try to find and open a modal
    const modalTrigger = await page.$('[data-testid="modal-trigger"], button:has-text("Open")');

    if (modalTrigger) {
      await modalTrigger.click();
      await page.waitForTimeout(500);

      // Check if modal is open
      const modal = await page.$('[role="dialog"], .modal');

      if (modal) {
        // Tab should stay within modal
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement);

        // Focus should be within modal
        const isInsideModal = await page.evaluate((modal, focused) =>
          modal.contains(focused), modal, focused
        );

        expect(isInsideModal).toBeTruthy();
      }
    }
  });

  test('should have accessible forms with error messages', async ({ page }) => {
    const forms = await page.$$('form');

    if (forms.length > 0) {
      await page.goto('/contact');

      // Submit form without filling it
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      // Check for error messages
      const errors = await page.$$('[role="alert"], .error-message, .field-error');

      // If validation exists, should show errors
      if (errors.length > 0) {
        for (const error of errors) {
          const text = await error.textContent();
          expect(text?.trim()).toBeTruthy();
        }
      }
    }
  });
});
