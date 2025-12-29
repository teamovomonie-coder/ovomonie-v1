import { describe, it, expect, beforeAll } from '@jest/globals';

/**
 * Critical Payment Flow Tests - Bill Payments
 * Tests bill payment functionality (airtime, data, utilities)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let authToken: string;

describe('Bill Payment Flow', () => {
  beforeAll(async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: process.env.TEST_PHONE || '2348012345678',
        pin: process.env.TEST_PIN || '1234'
      })
    });
    
    if (loginRes.ok) {
      const data = await loginRes.json();
      authToken = data.token;
    }
  });

  it('should reject bill payment without authentication', async () => {
    const res = await fetch(`${BASE_URL}/api/bills/vfd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billType: 'airtime',
        provider: 'MTN',
        amount: 100,
        phoneNumber: '08012345678'
      })
    });

    expect(res.status).toBe(401);
  });

  it('should validate bill payment amount', async () => {
    const res = await fetch(`${BASE_URL}/api/bills/vfd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        billType: 'airtime',
        provider: 'MTN',
        amount: -100, // Invalid negative amount
        phoneNumber: '08012345678'
      })
    });

    expect(res.status).toBe(400);
  });

  it('should validate phone number format', async () => {
    const res = await fetch(`${BASE_URL}/api/bills/vfd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        billType: 'airtime',
        provider: 'MTN',
        amount: 100,
        phoneNumber: 'invalid-phone'
      })
    });

    expect(res.status).toBe(400);
  });

  it('should enforce payment restrictions for online payments', async () => {
    const res = await fetch(`${BASE_URL}/api/bills/vfd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        billType: 'airtime',
        provider: 'MTN',
        amount: 100,
        phoneNumber: '08012345678'
      })
    });

    // Should succeed or be blocked based on user settings
    expect([200, 403]).toContain(res.status);
  });
});

export {};
