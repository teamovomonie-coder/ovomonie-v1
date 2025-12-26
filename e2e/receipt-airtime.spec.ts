import { test, expect } from '@playwright/test';

test.describe('Receipt Smoke — Airtime/Data', () => {
  test('renders airtime/data receipt from localStorage', async ({ page }) => {
    // Prepare a mock pending receipt in localStorage
    const mock = {
      type: 'airtime',
      transactionId: 'TEST-TX-RECEIPT-1',
      completedAt: new Date().toISOString(),
      data: {
        network: 'mtn',
        phoneNumber: '+2349030000000',
        amount: 1500,
        planName: '1GB',
        isDataPlan: true,
      },
    };

    await page.goto('/');
    await page.evaluate((r) => localStorage.setItem('ovo-pending-receipt', JSON.stringify(r)), mock);
    await page.goto('/success');

    // Expect the receipt title and amount to be visible
    await expect(page.getByText(/Data Purchase Receipt|Airtime Recharge Receipt|Data Purchased|Airtime Purchased/i)).toBeVisible();
    await expect(page.getByText(/₦\s?1,?500|1500/).first()).toBeVisible();
    await expect(page.getByText(/MTN|mtn/i).first()).toBeVisible();
    await expect(page.getByText(/\+2349030000000/).first()).toBeVisible();
  });
});
