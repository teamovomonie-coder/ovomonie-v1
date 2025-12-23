import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email format').optional(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d+$/, 'PIN must contain only digits'),
});

export const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number required'),
  pin: z.string().min(1, 'PIN is required'),
});

export const updateBalanceSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Amount must be positive'),
});

// Transaction validation schemas
export const createTransactionSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  category: z.enum(['transfer', 'payment', 'deposit', 'withdrawal', 'airtime', 'bills']),
  type: z.enum(['debit', 'credit']),
  amount: z.number().positive('Amount must be positive'),
  reference: z.string().min(1, 'Reference is required'),
  narration: z.string().optional(),
  party_name: z.string().optional(),
  party_account: z.string().optional(),
});

export const transferSchema = z.object({
  fromUserId: z.string().uuid('Invalid sender ID'),
  toAccount: z.string().min(10, 'Invalid recipient account'),
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount too large'),
  narration: z.string().max(100, 'Narration too long').optional(),
  pin: z.string().length(4, 'PIN must be 4 digits'),
});

// Notification validation schemas
export const createNotificationSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  body: z.string().min(1, 'Body is required').max(500, 'Body too long'),
  category: z.string().optional(),
  type: z.string().optional(),
  amount: z.number().optional(),
  reference: z.string().optional(),
});

// Payment validation schemas
export const paymentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Amount must be positive'),
  recipient: z.string().min(1, 'Recipient is required'),
  pin: z.string().length(4, 'PIN must be 4 digits'),
  category: z.enum(['bills', 'airtime', 'data', 'transfer']),
});

// Utility function to validate request body
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Invalid input data' };
  }
}