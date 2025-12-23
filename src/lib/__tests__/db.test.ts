import { userService, transactionService, notificationService } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('Database Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('userService', () => {
    describe('getById', () => {
      it('should return user when found', async () => {
        const mockUser = { id: '1', full_name: 'Test User', balance: 1000 };
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
            }),
          }),
        } as any);

        const result = await userService.getById('1');
        expect(result).toEqual(expect.objectContaining({
          id: '1',
          full_name: 'Test User',
          balance: 1000,
        }));
      });

      it('should return null when user not found', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        } as any);

        const result = await userService.getById('999');
        expect(result).toBeNull();
      });
    });

    describe('updateBalance', () => {
      it('should update balance successfully', async () => {
        mockSupabase.from.mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        } as any);

        const result = await userService.updateBalance('1', 2000);
        expect(result).toBe(true);
      });

      it('should handle update errors', async () => {
        mockSupabase.from.mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
          }),
        } as any);

        const result = await userService.updateBalance('1', 2000);
        expect(result).toBe(false);
      });
    });
  });

  describe('transactionService', () => {
    describe('create', () => {
      it('should create transaction successfully', async () => {
        const mockTransaction = {
          user_id: '1',
          category: 'transfer',
          type: 'debit' as const,
          amount: 500,
          reference: 'TXN123',
        };

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: { id: 'txn_1' }, 
                error: null 
              }),
            }),
          }),
        } as any);

        const result = await transactionService.create(mockTransaction);
        expect(result).toBe('txn_1');
      });
    });

    describe('getByUserId', () => {
      it('should return user transactions', async () => {
        const mockTransactions = [
          { id: '1', user_id: '1', amount: 100, type: 'credit' },
          { id: '2', user_id: '1', amount: 50, type: 'debit' },
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ 
                  data: mockTransactions, 
                  error: null 
                }),
              }),
            }),
          }),
        } as any);

        const result = await transactionService.getByUserId('1');
        expect(result).toEqual(mockTransactions);
      });
    });
  });

  describe('notificationService', () => {
    describe('create', () => {
      it('should create notification successfully', async () => {
        const mockNotification = {
          user_id: '1',
          title: 'Test Notification',
          body: 'Test message',
        };

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: { id: 'notif_1' }, 
                error: null 
              }),
            }),
          }),
        } as any);

        const result = await notificationService.create(mockNotification);
        expect(result).toBe('notif_1');
      });
    });
  });
});