import { describe, it, expect, beforeAll } from '@jest/globals';

/**
 * Critical Payment Flow Tests - Card Funding
 * Tests wallet funding via card payments
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let authToken: string;

describe('Card Funding Flow', () => {
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

  it('should reject funding without authentication', async () => {
    const res = await fetch(`${BASE_URL}/api/funding/card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1000
      })
    });

    expect(res.status).toBe(401);
  });

  it('should validate funding amount (minimum)', async () => {
    const res = await fetch(`${BASE_URL}/api/funding/card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        amount: 50 // Below minimum
      })
    });

    expect(res.status).toBe(400);
  });

  it('should validate funding amount (maximum)', async () => {
    const res = await fetch(`${BASE_URL}/api/funding/card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        amount: 10000000 // Above maximum
      })
    });

    expect(res.status).toBe(400);
  });

  it('should initiate card funding with valid amount', async () => {
    const res = await fetch(`${BASE_URL}/api/funding/card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        amount: 1000
      })
    });

    expect([200, 201]).toContain(res.status);
    if (res.ok) {
      const data = await res.json();
      expect(data).toHaveProperty('reference');
      expect(data).toHaveProperty('authorizationUrl');
    }
  });
});

export {};
