import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as registerHandler } from '@/app/api/auth/register/route';

// Mock database operations
jest.mock('@/lib/database', () => ({
  dbOperations: {
    getUserByPhone: jest.fn(),
    createUser: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  createAuthToken: jest.fn(() => 'mock-token'),
  verifySecret: jest.fn(),
  hashSecret: jest.fn(() => 'hashed-pin'),
}));

import { dbOperations } from '@/lib/database';
import { verifySecret } from '@/lib/auth';

const mockDbOperations = dbOperations as jest.Mocked<typeof dbOperations>;
const mockVerifySecret = verifySecret as jest.MockedFunction<typeof verifySecret>;

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        phone: '1234567890',
        full_name: 'Test User',
        account_number: '9012345678',
        login_pin_hash: 'hashed-pin',
        balance: 1000,
      };

      mockDbOperations.getUserByPhone.mockResolvedValue(mockUser);
      mockVerifySecret.mockReturnValue(true);

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone: '1234567890', pin: '1234' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        token: 'mock-token',
        userId: 'user-1',
        fullName: 'Test User',
        accountNumber: '9012345678',
      });
    });

    it('should reject invalid credentials', async () => {
      mockDbOperations.getUserByPhone.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone: '1234567890', pin: '1234' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid phone number or PIN');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      mockDbOperations.getUserByPhone.mockResolvedValue(null);
      mockDbOperations.createUser.mockResolvedValue('new-user-id');

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          phone: '1234567890',
          email: 'test@example.com',
          full_name: 'Test User',
          pin: '1234',
        }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Registration successful!');
      expect(data.userId).toBe('new-user-id');
    });
  });
});