import { performTransfer } from '@/lib/transfer';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { createAuthToken, verifyAuthToken } from '@/lib/auth';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('Financial Operations', () => {
  describe('Transfer System', () => {
    test('should validate transfer limits based on KYC tier', async () => {
      const result = await performTransfer(
        'user1',
        '1234567890',
        60000 * 100, // Above Tier 1 limit
        'test-ref-001',
        'Test transfer'
      );
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Daily transfer limit exceeded');
    });

    test('should perform successful transfer within limits', async () => {
      const result = await performTransfer(
        'user1',
        '1234567890',
        10000 * 100, // Within Tier 1 limit
        'test-ref-002',
        'Test transfer'
      );
      
      expect(result.success).toBe(true);
      expect(result.newSenderBalance).toBeDefined();
    });
  });

  describe('Authentication System', () => {
    test('should create and verify valid tokens', () => {
      const userId = 'test-user-123';
      const token = createAuthToken(userId);
      
      expect(token).toMatch(/^ovotoken\./);
      
      const payload = verifyAuthToken(token);
      expect(payload?.sub).toBe(userId);
      expect(payload?.exp).toBeGreaterThan(Date.now() / 1000);
    });

    test('should reject expired tokens', () => {
      const userId = 'test-user-123';
      const expiredToken = createAuthToken(userId, -3600); // Expired 1 hour ago
      
      const payload = verifyAuthToken(expiredToken);
      expect(payload).toBeNull();
    });
  });

  describe('VFD Integration', () => {
    test('should handle VFD API errors gracefully', async () => {
      jest.spyOn(vfdWalletService, 'createVirtualAccount').mockRejectedValue(
        new Error('VFD API unavailable')
      );

      const result = await vfdWalletService.createVirtualAccount({
        customerId: 'test-user',
        accountName: 'Test User'
      });

      expect(result).toBeNull();
    });
  });
});