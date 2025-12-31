import { test, expect } from '@playwright/test';

test.describe('Receipt Flow — Airtime/Data', () => {
  test('renders airtime receipt from unified receipt page', async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ovo-auth-token', 'mock-token-12345');
    });

    // Mock the receipt API response
    await page.route('**/api/transactions/receipt/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          receipt: {
            type: 'AIRTIME',
            reference: 'TEST-TX-RECEIPT-1',
            amount: 1500,
            phoneNumber: '09030000000',
            network: 'mtn',
            planName: '1GB Data Plan',
            transactionId: 'tx-12345',
            completedAt: new Date().toISOString(),
            isDataPlan: true
          }
        })
      });
    });

    // Navigate to receipt page
    await page.goto('/receipt/tx-12345?txId=tx-12345&type=data');

    // Wait for receipt to load and verify content
    await expect(page.getByText(/Data Purchased|Airtime Purchased/i)).toBeVisible();
    await expect(page.getByText(/₦\s?1,?500|1500/).first()).toBeVisible();
    await expect(page.getByText(/MTN|mtn/i).first()).toBeVisible();
    await expect(page.getByText(/09030000000/).first()).toBeVisible();
    await expect(page.getByText(/1GB Data Plan/i).first()).toBeVisible();
    
    // Verify share button is present
    await expect(page.getByRole('button', { name: /share receipt/i })).toBeVisible();
  });

  test('handles receipt not found gracefully', async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ovo-auth-token', 'mock-token-12345');
    });

    // Mock 404 response
    await page.route('**/api/transactions/receipt/**', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, message: 'Transaction not found' })
      });
    });

    // Navigate to non-existent receipt
    await page.goto('/receipt/non-existent-tx');

    // Should show error message and redirect option
    await expect(page.getByText(/Receipt Not Found/i)).toBeVisible();
    await expect(page.getByText(/Transaction not found/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Go to Dashboard Now/i })).toBeVisible();
  });
});