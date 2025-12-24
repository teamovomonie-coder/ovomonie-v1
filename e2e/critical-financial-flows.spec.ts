import { test, expect } from '@playwright/test';

test.describe('Critical Financial Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('User Registration and KYC Flow', async ({ page }) => {
    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="phone-input"]', '+2349034151086');
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="pin-input"]', '123456');
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="kyc-tier"]')).toContainText('Tier 1');
  });

  test('Internal Transfer Flow', async ({ page }) => {
    await page.fill('[data-testid="phone-input"]', '+2349034151086');
    await page.fill('[data-testid="pin-input"]', '123456');
    await page.click('[data-testid="login-button"]');
    
    await page.click('[data-testid="transfer-button"]');
    await page.fill('[data-testid="recipient-account"]', '1234567891');
    await page.fill('[data-testid="amount-input"]', '1000');
    await page.fill('[data-testid="narration-input"]', 'Test transfer');
    await page.click('[data-testid="transfer-submit"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('Bill Payment Flow', async ({ page }) => {
    await page.fill('[data-testid="phone-input"]', '+2349034151086');
    await page.fill('[data-testid="pin-input"]', '123456');
    await page.click('[data-testid="login-button"]');
    
    await page.click('[data-testid="bills-button"]');
    await page.click('[data-testid="electricity-category"]');
    await page.selectOption('[data-testid="provider-select"]', 'EKEDC');
    await page.fill('[data-testid="meter-number"]', '12345678901');
    await page.fill('[data-testid="amount-input"]', '5000');
    await page.click('[data-testid="pay-bill-button"]');
    
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
  });

  test('Card Creation Flow', async ({ page }) => {
    await page.fill('[data-testid="phone-input"]', '+2349034151086');
    await page.fill('[data-testid="pin-input"]', '123456');
    await page.click('[data-testid="login-button"]');
    
    await page.click('[data-testid="cards-button"]');
    await page.click('[data-testid="create-card-button"]');
    await page.selectOption('[data-testid="card-type"]', 'virtual');
    await page.fill('[data-testid="card-name"]', 'My Virtual Card');
    await page.click('[data-testid="create-card-submit"]');
    
    await expect(page.locator('[data-testid="card-created"]')).toBeVisible();
  });

  test('Loan Application Flow', async ({ page }) => {
    await page.fill('[data-testid="phone-input"]', '+2349034151086');
    await page.fill('[data-testid="pin-input"]', '123456');
    await page.click('[data-testid="login-button"]');
    
    await page.click('[data-testid="loans-button"]');
    await page.click('[data-testid="apply-loan-button"]');
    await page.fill('[data-testid="loan-amount"]', '50000');
    await page.selectOption('[data-testid="loan-tenure"]', '6');
    await page.fill('[data-testid="loan-purpose"]', 'Business expansion');
    await page.click('[data-testid="apply-loan-submit"]');
    
    await expect(page.locator('[data-testid="loan-application-success"]')).toBeVisible();
  });
});