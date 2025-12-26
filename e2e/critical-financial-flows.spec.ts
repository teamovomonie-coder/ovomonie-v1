import { test, expect } from '@playwright/test';

test.describe('Critical Financial Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('User Registration and KYC Flow', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Phone Number').fill('+2349034151086');
    await page.getByLabel(/Full name|Name/i).fill('Test User');
    await page.waitForSelector('[data-testid="pin-input"]', { state: 'visible' });
    await page.fill('[data-testid="pin-input"]', '123456');
    await page.getByRole('button', { name: /register|create account/i }).click();

    await expect(page.getByTestId?.('dashboard') ?? page.locator('[role="region"]:has-text("dashboard")')).toBeVisible();
    await expect(page.getByText('Tier 1', { exact: false })).toBeVisible();
  });

  test('Internal Transfer Flow', async ({ page }) => {
    await page.getByLabel('Phone Number').fill('+2349034151086');
    await page.waitForSelector('[data-testid="pin-input"]', { state: 'visible' });
    await page.fill('[data-testid="pin-input"]', '123456');
    await page.getByRole('button', { name: /log in/i }).click();

    await page.goto('/transfer');
    await page.getByLabel(/recipient|account/i).fill('1234567891');
    await page.getByLabel(/amount/i).fill('1000');
    await page.getByLabel(/narration|description/i).fill('Test transfer');
    await page.getByRole('button', { name: /submit|send/i }).click();

    await expect(page.getByText(/success|transaction/i)).toBeVisible();
  });

  test('Bill Payment Flow', async ({ page }) => {
    await page.getByLabel('Phone Number').fill('+2349034151086');
    await page.waitForSelector('[data-testid="pin-input"]', { state: 'visible' });
    await page.fill('[data-testid="pin-input"]', '123456');
    await page.getByRole('button', { name: /log in/i }).click();

    await page.goto('/bills');
    await page.getByRole('button', { name: /electricity/i }).click();
    await page.getByLabel(/provider|select provider/i).selectOption('EKEDC');
    await page.getByLabel(/meter number|meter/i).fill('12345678901');
    await page.getByLabel(/amount/i).fill('5000');
    await page.getByRole('button', { name: /pay|submit/i }).click();

    await expect(page.getByText(/payment successful|success/i)).toBeVisible();
  });

  test('Card Creation Flow', async ({ page }) => {
    await page.getByLabel('Phone Number').fill('+2349034151086');
    await page.waitForSelector('[data-testid="pin-input"]', { state: 'visible' });
    await page.fill('[data-testid="pin-input"]', '123456');
    await page.getByRole('button', { name: /log in/i }).click();

    await page.goto('/cards');
    await page.getByRole('button', { name: /create card|new card/i }).click();
    await page.getByLabel(/card type/i).selectOption('virtual');
    await page.getByLabel(/card name/i).fill('My Virtual Card');
    await page.getByRole('button', { name: /create|submit/i }).click();

    await expect(page.getByText(/card created|created successfully/i)).toBeVisible();
  });

  test('Loan Application Flow', async ({ page }) => {
    await page.getByLabel('Phone Number').fill('+2349034151086');
    await page.getByLabel(/PIN|6-Digit PIN/i).fill('123456');
    await page.getByRole('button', { name: /log in/i }).click();

    await page.goto('/loans');
    await page.getByRole('button', { name: /apply|apply now/i }).click();
    await page.getByLabel(/loan amount|amount/i).fill('50000');
    await page.getByLabel(/tenure|loan-tenure/i).selectOption('6');
    await page.getByLabel(/purpose|loan-purpose/i).fill('Business expansion');
    await page.getByRole('button', { name: /submit|apply/i }).click();

    await expect(page.getByText(/application submitted|success/i)).toBeVisible();
  });
});