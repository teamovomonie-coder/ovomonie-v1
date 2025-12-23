import { supabaseAdmin } from './supabase';
import { logger } from './logger';

// DB types used across the app
export interface DbUser {
  id: string;
  phone?: string;
  email?: string;
  full_name?: string;
  account_number?: string;
  referral_code?: string;
  balance: number;
  kyc_tier?: number;
  is_agent?: boolean;
  avatar_url?: string;
  status?: string;
  login_pin_hash?: string;
  transaction_pin_hash?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbTransaction {
  id?: string;
  user_id: string;
  category: string;
  type: 'debit' | 'credit';
  amount: number;
  reference: string;
  narration?: string;
  party_name?: string;
  party_account?: string;
  balance_after?: number;
  timestamp?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

export interface DbNotification {
  id?: string;
  user_id: string;
  title: string;
  body: string;
  category?: string;
  type?: string;
  amount?: number;
  reference?: string;
  read?: boolean;
  created_at?: string;
  recipient_name?: string;
  sender_name?: string;
  metadata?: Record<string, unknown>;
}

function mapUser(row: any): DbUser | null {
  if (!row) return null;
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    full_name: row.full_name,
    account_number: row.account_number,
    balance: typeof row.balance === 'number' ? row.balance : Number(row.balance) || 0,
    kyc_tier: row.kyc_tier,
    is_agent: row.is_agent,
    avatar_url: row.avatar_url,
    status: row.status,
    login_pin_hash: row.login_pin_hash || null,
    transaction_pin_hash: row.transaction_pin_hash || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// User service
export const userService = {
  async getById(userId: string): Promise<DbUser | null> {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return null;
    }
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        logger.error('Error fetching user by ID', { userId, error });
        return null;
      }
      return mapUser(data);
    } catch (error) {
      logger.error('Exception in getById', { userId, error });
      return null;
    }
  },
  async getByPhone(phone: string): Promise<DbUser | null> {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return null;
    }
    try {
      const phoneClean = String(phone || '').replace(/\D/g, '');
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (data) return mapUser(data);
      
      // Try with cleaned phone if first attempt failed
      const { data: data2, error: error2 } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone', phoneClean)
        .single();
      
      return data2 ? mapUser(data2) : null;
    } catch (error) {
      logger.error('Exception in getByPhone', { phone, error });
      return null;
    }
  },
  async getByAccountNumber(accountNumber: string): Promise<DbUser | null> {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return null;
    }
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('account_number', accountNumber)
        .single();
      
      if (error) {
        logger.error('Error fetching user by account number', { accountNumber, error });
        return null;
      }
      return mapUser(data);
    } catch (error) {
      logger.error('Exception in getByAccountNumber', { accountNumber, error });
      return null;
    }
  },
  
  async updateBalance(userId: string, newBalance: number): Promise<boolean> {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return false;
    }
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        logger.error('Error updating user balance', { userId, newBalance, error });
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Exception in updateBalance', { userId, newBalance, error });
      return false;
    }
  }
};

// Transaction service
export const transactionService = {
  async create(tx: DbTransaction): Promise<string | null> {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return null;
    }
    try {
      const { data, error } = await supabaseAdmin
        .from('financial_transactions')
        .insert([{ ...tx, timestamp: new Date().toISOString() }])
        .select('id')
        .single();
      
      if (error) {
        logger.error('Error creating transaction', { tx, error });
        return null;
      }
      return data?.id ?? null;
    } catch (error) {
      logger.error('Exception in transaction create', { tx, error });
      return null;
    }
  },
  
  async getByReference(reference: string): Promise<DbTransaction | null> {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return null;
    }
    try {
      const { data, error } = await supabaseAdmin
        .from('financial_transactions')
        .select('*')
        .eq('reference', reference)
        .single();
      
      if (error) {
        logger.error('Error fetching transaction by reference', { reference, error });
        return null;
      }
      return data;
    } catch (error) {
      logger.error('Exception in getByReference', { reference, error });
      return null;
    }
  },
  
  async getByUserId(userId: string, limit = 50, category?: string): Promise<DbTransaction[]> {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return [];
    }
    try {
      let query = supabaseAdmin
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Error fetching transactions by user', { userId, category, error });
        return [];
      }
      return data ?? [];
    } catch (error) {
      logger.error('Exception in getByUserId', { userId, category, error });
      return [];
    }
  }
};

// Notification service
export const notificationService = {
  async create(n: DbNotification): Promise<string | null> {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return null;
    }
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert([{ ...n, created_at: new Date().toISOString() }])
        .select('id')
        .single();
      
      if (error) {
        logger.error('Error creating notification', { notification: n, error });
        return null;
      }
      return data?.id ?? null;
    } catch (error) {
      logger.error('Exception in notification create', { notification: n, error });
      return null;
    }
  },
  
  async getByUserId(userId: string, limit = 50): Promise<DbNotification[]> {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return [];
    }
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        logger.error('Error fetching notifications', { userId, error });
        return [];
      }
      return data ?? [];
    } catch (error) {
      logger.error('Exception in getByUserId notifications', { userId, error });
      return [];
    }
  }
};

// Utility functions used across the codebase
export async function getUserById(userId: string): Promise<DbUser | null> {
  return await userService.getById(userId);
}

export async function getUserByPhone(phone: string): Promise<DbUser | null> {
  return await userService.getByPhone(phone);
}

export async function getUserByAccountNumber(accountNumber: string): Promise<DbUser | null> {
  return await userService.getByAccountNumber(accountNumber);
}

export async function updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
  return await userService.updateBalance(userId, newBalance);
}

export async function createTransaction(tx: DbTransaction): Promise<string | null> {
  return await transactionService.create(tx);
}

export async function transactionExists(reference: string): Promise<boolean> {
  if (!supabaseAdmin) {
    logger.error('Supabase admin client not available');
    return false;
  }
  try {
    const { count, error } = await supabaseAdmin
      .from('financial_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('reference', reference);
    
    if (error) {
      logger.error('Error checking transaction existence', { reference, error });
      return false;
    }
    return !!count && count > 0;
  } catch (error) {
    logger.error('Exception in transactionExists', { reference, error });
    return false;
  }
}

export async function getTodayDebitTotal(userId: string): Promise<number> {
  if (!supabaseAdmin) {
    logger.error('Supabase admin client not available');
    return 0;
  }
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'debit')
      .gte('timestamp', start.toISOString());
    
    if (error) {
      logger.error('Error fetching today debit total', { userId, error });
      return 0;
    }
    return (data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  } catch (error) {
    logger.error('Exception in getTodayDebitTotal', { userId, error });
    return 0;
  }
}

export async function getTodayCreditTotal(userId: string): Promise<number> {
  if (!supabaseAdmin) {
    logger.error('Supabase admin client not available');
    return 0;
  }
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .gte('timestamp', start.toISOString());
    
    if (error) {
      logger.error('Error fetching today credit total', { userId, error });
      return 0;
    }
    return (data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  } catch (error) {
    logger.error('Exception in getTodayCreditTotal', { userId, error });
    return 0;
  }
}

export async function createNotification(n: DbNotification): Promise<string | null> {
  return await notificationService.create(n);
}

// Export db instance for compatibility
export const db = supabaseAdmin;

