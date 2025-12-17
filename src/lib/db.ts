/**
 * Centralized Database Service Layer
 * All database operations go through Supabase (primary)
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

export const db = createClient(supabaseUrl, supabaseKey);

// User operations
export const userService = {
  async getById(userId: string) {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByAccountNumber(accountNumber: string) {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('account_number', accountNumber)
      .single();
    
    if (error) throw error;
    return data;
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
