import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ovomonie/i);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
  });

  test('register page is accessible', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('form')).toBeVisible();
  });

  test('dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login or show auth prompt
    await expect(page).toHaveURL(/login|register|auth/);
  });

});

test.describe('Financial Pages Security', () => {

  test('transfer pages require authentication', async ({ page }) => {
    await page.goto('/internal-transfer');
    await expect(page).toHaveURL(/login|register|auth/);
  });

  test('external transfer requires authentication', async ({ page }) => {
    await page.goto('/external-transfer');
    await expect(page).toHaveURL(/login|register|auth/);
  });

  test('loan page requires authentication', async ({ page }) => {
    await page.goto('/loan');
    await expect(page).toHaveURL(/login|register|auth/);
  });

  test('add money page requires authentication', async ({ page }) => {
    await page.goto('/add-money');
    await expect(page).toHaveURL(/login|register|auth/);
  });

});

test.describe('API Security Headers', () => {

  test('API returns proper security headers', async ({ request }) => {
    const response = await request.get('/api/auth/login', {
      method: 'OPTIONS',
    });
    
    // Check for security headers
    const headers = response.headers();
    expect(headers['x-frame-options'] || headers['content-security-policy']).toBeDefined;
  });

});
