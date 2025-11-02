const { expect } = require('@playwright/test');

// Login helper
async function login(page, email = 'test@example.com', password = 'password123') {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

// Logout helper
async function logout(page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logout');
  await expect(page).toHaveURL('/');
}

// Create test user
async function createTestUser(page, userData = {}) {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test User',
    ...userData
  };

  await page.goto('/register');
  await page.fill('input[name="email"]', defaultData.email);
  await page.fill('input[name="password"]', defaultData.password);
  await page.fill('input[name="name"]', defaultData.name);
  await page.click('button[type="submit"]');

  return defaultData;
}

// Wait for API response
async function waitForAPIResponse(page, urlPattern) {
  return page.waitForResponse(response =>
    response.url().includes(urlPattern) && response.status() === 200
  );
}

// Take accessible screenshot
async function takeA11yScreenshot(page, name) {
  await page.screenshot({ path: `test-results/a11y-${name}.png`, fullPage: true });
}

// Check for console errors
async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

// Wait for element to be visible with timeout
async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch (error) {
    console.error(`Element ${selector} not found within ${timeout}ms`);
    return false;
  }
}

// Fill form with data object
async function fillForm(page, formData) {
  for (const [name, value] of Object.entries(formData)) {
    const input = await page.$(`[name="${name}"]`);
    if (input) {
      await page.fill(`[name="${name}"]`, value);
    }
  }
}

// Check if element exists
async function elementExists(page, selector) {
  const element = await page.$(selector);
  return element !== null;
}

// Get text content safely
async function getTextContent(page, selector) {
  try {
    return await page.textContent(selector);
  } catch (error) {
    return null;
  }
}

// Click and wait for navigation
async function clickAndNavigate(page, selector, expectedUrl) {
  await Promise.all([
    page.waitForNavigation({ url: expectedUrl }),
    page.click(selector)
  ]);
}

// Wait for network idle
async function waitForNetworkIdle(page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

// Take full page screenshot
async function takeFullScreenshot(page, name) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true
  });
}

// Check for network errors
async function checkNetworkErrors(page) {
  const errors = [];
  page.on('response', response => {
    if (!response.ok()) {
      errors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
  return errors;
}

// Simulate slow network
async function simulateSlowNetwork(page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 50 * 1024 / 8,
    uploadThroughput: 20 * 1024 / 8,
    latency: 500
  });
}

// Clear local storage
async function clearLocalStorage(page) {
  await page.evaluate(() => localStorage.clear());
}

// Clear session storage
async function clearSessionStorage(page) {
  await page.evaluate(() => sessionStorage.clear());
}

// Clear all storage
async function clearAllStorage(page) {
  await clearLocalStorage(page);
  await clearSessionStorage(page);
  await page.context().clearCookies();
}

module.exports = {
  login,
  logout,
  createTestUser,
  waitForAPIResponse,
  takeA11yScreenshot,
  getConsoleErrors,
  waitForElement,
  fillForm,
  elementExists,
  getTextContent,
  clickAndNavigate,
  waitForNetworkIdle,
  takeFullScreenshot,
  checkNetworkErrors,
  simulateSlowNetwork,
  clearLocalStorage,
  clearSessionStorage,
  clearAllStorage
};
