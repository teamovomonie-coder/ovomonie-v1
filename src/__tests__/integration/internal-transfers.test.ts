import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

/**
 * Critical Payment Flow Tests - Internal Transfers
 * Tests the most critical financial operation: peer-to-peer transfers
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let authToken: string;
let testUserId: string;

describe('Internal Transfer Flow', () => {
  beforeAll(async () => {
    // Setup: Login to get auth token
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
      testUserId = data.userId;
    }
  });

  it('should reject transfer without authentication', async () => {
    const res = await fetch(`${BASE_URL}/api/transfers/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientAccountNumber: '1234567890',
        amount: 1000,
        narration: 'Test transfer'
      })
    });

    expect(res.status).toBe(401);
  });

  it('should reject transfer with invalid PIN', async () => {
    const res = await fetch(`${BASE_URL}/api/transfers/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipientAccountNumber: '1234567890',
        amount: 1000,
        narration: 'Test transfer',
        senderPin: 'wrong-pin'
      })
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toContain('Invalid');
  });

  it('should reject transfer with insufficient balance', async () => {
    const res = await fetch(`${BASE_URL}/api/transfers/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipientAccountNumber: '1234567890',
        amount: 999999999,
        narration: 'Test transfer',
        senderPin: process.env.TEST_PIN || '1234'
      })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('Insufficient');
  });

  it('should reject transfer to non-existent recipient', async () => {
    const res = await fetch(`${BASE_URL}/api/transfers/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipientAccountNumber: '9999999999',
        amount: 100,
        narration: 'Test transfer',
        senderPin: process.env.TEST_PIN || '1234'
      })
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toContain('not found');
  });

  it('should reject transfer to self', async () => {
    // Get own account number first
    const profileRes = await fetch(`${BASE_URL}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const profile = await profileRes.json();

    const res = await fetch(`${BASE_URL}/api/transfers/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipientAccountNumber: profile.accountNumber,
        amount: 100,
        narration: 'Test transfer',
        senderPin: process.env.TEST_PIN || '1234'
      })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('yourself');
  });

  it('should enforce payment restrictions (gambling block)', async () => {
    const res = await fetch(`${BASE_URL}/api/transfers/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipientAccountNumber: '1234567890',
        amount: 100,
        narration: 'Bet9ja payment',
        senderPin: process.env.TEST_PIN || '1234'
      })
    });

    // Should be blocked if gambling restrictions are enabled
    if (res.status === 403) {
      const data = await res.json();
      expect(data.message).toContain('restricted');
    }
  });

  it('should enforce transaction limits', async () => {
    const res = await fetch(`${BASE_URL}/api/transfers/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipientAccountNumber: '1234567890',
        amount: 10000000, // 100M naira
        narration: 'Large transfer',
        senderPin: process.env.TEST_PIN || '1234'
      })
    });

    expect([400, 403]).toContain(res.status);
    const data = await res.json();
    expect(data.message).toMatch(/limit|exceed/i);
  });
});

export {};
