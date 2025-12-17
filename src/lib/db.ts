import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

export const db = createClient(supabaseUrl, supabaseKey);

export const userService = {
  async getById(userId: string) {
    const { data, error } = await db.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  },

  async getByPhone(phone: string) {
    const { data, error } = await db.from('users').select('*').eq('phone', phone).single();
    if (error) throw error;
    return data;
  },

  async getByAccountNumber(accountNumber: string) {
    const { data, error } = await db.from('users').select('*').eq('account_number', accountNumber).single();
    if (error) throw error;
    return data;
  },

  async updateBalance(userId: string, newBalance: number) {
    const { error } = await db.from('users').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', userId);
    if (error) throw error;
    return true;
  },
};

export const transactionService = {
  async create(transaction: any) {
    const { data, error } = await db.from('financial_transactions').insert([transaction]).select('id').single();
    if (error) throw error;
    return data;
  },

  async getByReference(reference: string) {
    const { data, error } = await db.from('financial_transactions').select('*').eq('reference', reference).single();
    if (error && (error as any).code !== 'PGRST116') throw error;
    return data;
  },

  async getByUserId(userId: string, limit = 100, category?: string) {
    let query: any = db.from('financial_transactions').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(limit);
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};

// Backwards-compatible helpers used across the codebase
export async function getUserById(userId: string) {
  try {
    return await userService.getById(userId);
  } catch (err) {
    logger.error('getUserById failed', err);
    return null;
  }
}

export async function getUserByPhone(phone: string) {
  try {
    return await userService.getByPhone(phone);
  } catch (err) {
    logger.error('getUserByPhone failed', err);
    return null;
  }
}

export async function getUserByAccountNumber(accountNumber: string) {
  try {
    return await userService.getByAccountNumber(accountNumber);
  } catch (err) {
    logger.error('getUserByAccountNumber failed', err);
    return null;
  }
}

export async function updateUserBalance(userId: string, newBalance: number) {
  try {
    await userService.updateBalance(userId, newBalance);
    return true;
  } catch (err) {
    logger.error('updateUserBalance failed', err);
    return false;
  }
  // end
  try {
    const data = await transactionService.create(transaction);
    return data?.id || null;
  } catch (err) {
    logger.error('createTransaction failed', err);
    return null;
  }
}

export async function transactionExists(reference: string) {
  try {
    const data = await transactionService.getByReference(reference);
    return Boolean(data);
  } catch (err) {
    logger.error('transactionExists failed', err);
    return false;
  }
}

export async function getTodayDebitTotal(userId: string) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data, error } = await db
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category', 'transfer')
      .eq('type', 'debit')
      .gte('timestamp', startOfDay.toISOString());
    if (error) throw error;
    return data?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
  } catch (err) {
    logger.error('getTodayDebitTotal failed', err);
    return 0;
  }
}

export async function getTodayCreditTotal(userId: string) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data, error } = await db
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category', 'transfer')
      .eq('type', 'credit')
      .gte('timestamp', startOfDay.toISOString());
    if (error) throw error;
    return data?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
  } catch (err) {
  // (end of file)
  },

  async updateBalance(userId: string, newBalance: number) {
    const { error } = await db
      .from('users')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
  },
};

// Transaction operations
export const transactionService = {
  async create(transaction: {
    user_id: string;
    type: 'debit' | 'credit';
    category: string;
    amount: number;
    reference: string;
    narration: string;
    party?: any;
    balance_after: number;
    status?: string;
    metadata?: any;
  }) {
    const { data, error } = await db
      .from('financial_transactions')
      .insert([transaction])
      .select('id')
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByReference(reference: string) {
    const { data, error } = await db
      .from('financial_transactions')
      .select('*')
      .eq('reference', reference)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getByUserId(userId: string, limit = 100, category?: string) {
    let query = db
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Error fetching transactions by user ID:', { error, userId });
      throw error;
    }
    return data || [];
  },
};

// Notification operations
export const notificationService = {
  async create(notification: {
    user_id: string;
    title: string;
    body: string;
    category?: string;
    reference?: string;
    metadata?: any;
  }) {
    const { data, error } = await db
      .from('notifications')
      .insert([{ ...notification, read: false }])
      .select('id')
      .single();
    
    if (error) {
      logger.error('Failed to create notification', error);
      return null;
    }
    return data;
  },

  async getByUserId(userId: string, limit = 50) {
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },
};
>>>>>>> 06661dbe0c7f9a5b6b89f85ec7fcaa54ece2808b
