# E2E Testing Quick Start Guide

Get up and running with Playwright E2E tests in 5 minutes.

## Installation

```bash
# Install dependencies (including Playwright)
npm install

# Install Playwright browsers
npx playwright install
```

## Basic Usage

### Run all tests

```bash
npm run test:e2e
```

### Run tests with UI (recommended for development)

```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can:
- See all tests
- Run tests individually
- Watch tests execute in real-time
- Debug failures easily

### Run tests in headed mode (see the browser)

```bash
npm run test:e2e:headed
```

### Debug a specific test

```bash
npm run test:e2e:debug
```

## Test Specific Files

```bash
# Admin panel tests
npx playwright test tests/e2e/admin-panel.test.js

# Accessibility tests
npx playwright test tests/e2e/accessibility.test.js

# Performance tests
npx playwright test tests/e2e/performance.test.js
```

## Test Specific Browsers

```bash
# Chrome only
npm run test:e2e:chromium

# Firefox only
npm run test:e2e:firefox

# Safari only
npm run test:e2e:webkit

# Mobile devices
npm run test:e2e:mobile
```

## View Test Reports

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

## Common Commands

```bash
# Run tests matching a pattern
npx playwright test -g "should login"

# Run a single test file
npx playwright test admin-panel.test.js

# Run tests in parallel (faster)
npx playwright test --workers=4

# Update visual regression snapshots
npx playwright test --update-snapshots

# Show test results in terminal
npx playwright test --reporter=list
```

## Writing Your First Test

Create a new file: `tests/e2e/my-test.test.js`

```javascript
const { test, expect } = require('@playwright/test');

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## Debugging Tips

### 1. Use UI Mode (Best for beginners)
```bash
npm run test:e2e:ui
```

### 2. Use Debug Mode
```bash
npm run test:e2e:debug
```

### 3. Add console.log
```javascript
test('debug test', async ({ page }) => {
  const text = await page.textContent('h1');
  console.log('H1 text:', text);
});
```

### 4. Take screenshots
```javascript
await page.screenshot({ path: 'debug.png' });
```

### 5. Pause execution
```javascript
await page.pause(); // Opens Playwright Inspector
```

## Test Structure

```
tests/e2e/
├── utils/
│   └── test-helpers.js       # Reusable functions
├── admin-panel.test.js       # Test files
├── accessibility.test.js
├── performance.test.js
└── README.md                 # Full documentation
```

## Environment Setup

1. Copy environment template:
```bash
cp tests/e2e/.env.example tests/e2e/.env.test
```

2. Edit `.env.test` with your values:
```
BASE_URL=http://localhost:3000
ANTHROPIC_API_KEY=your_key_here
```

## Test Categories

| Category | Command | Description |
|----------|---------|-------------|
| **All Tests** | `npm run test:e2e` | Run all E2E tests |
| **Admin Panel** | `npx playwright test admin-panel` | Test admin interface |
| **Accessibility** | `npx playwright test accessibility` | WCAG compliance |
| **Performance** | `npx playwright test performance` | Speed & metrics |
| **Security** | `npx playwright test security` | Security checks |
| **Visual** | `npx playwright test visual-regression` | Visual changes |

## CI/CD

Tests run automatically on GitHub:
- Push to `main` or `develop`
- Pull requests

View results in GitHub Actions tab.

## Troubleshooting

### Tests timing out?
Increase timeout in `playwright.config.js`:
```javascript
timeout: 60000 // 60 seconds
```

### Can't find elements?
Use better selectors:
```javascript
// ❌ Bad
await page.click('button');

// ✅ Good
await page.click('[data-testid="submit-button"]');
```

### Tests flaky?
Add explicit waits:
```javascript
await page.waitForSelector('[data-testid="content"]');
await page.waitForLoadState('networkidle');
```

## Next Steps

1. Read the full documentation: `tests/e2e/README.md`
2. Check example tests in `tests/e2e/`
3. Write tests for your features
4. Run tests before committing

## Resources

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## Need Help?

1. Check `tests/e2e/README.md` for detailed docs
2. Review existing test examples
3. Visit Playwright documentation
4. Open an issue on GitHub

---

Happy Testing! 🎭✨
