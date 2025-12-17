/**
 * Primary Database Layer - Supabase PostgreSQL
 * Firebase is backup only
 */

import { supabaseAdmin } from './supabase';
import { getDb as getFirestoreDb } from './firebaseAdmin';
import { logger } from './logger';

export interface DbUser {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  account_number: string;
  balance: number;
  login_pin_hash: string;
  transaction_pin_hash?: string;
  kyc_tier: number;
  is_agent: boolean;
  status: string;
  avatar_url?: string;
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
  narration: string;
  party_name?: string;
  party_account?: string;
  party_bank?: string;
  balance_after: number;
  timestamp?: string;
  memo_message?: string;
  memo_image_uri?: string;
}

export interface DbNotification {
  id?: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  type?: string;
  read: boolean;
  amount?: number;
  sender_name?: string;
  recipient_name?: string;
  reference?: string;
  created_at?: string;
}

/**
 * Get user by ID from Supabase
 */
export async function getUserById(userId: string): Promise<DbUser | null> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as DbUser;
  } catch (error) {
    logger.error('Error fetching user from Supabase:', error);
    return null;
  }
}

/**
 * Get user by phone from Supabase
 */
export async function getUserByPhone(phone: string): Promise<DbUser | null> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) throw error;
    return data as DbUser;
  } catch (error) {
    logger.error('Error fetching user by phone from Supabase:', error);
    return null;
  }
}

/**
 * Get user by account number from Supabase
 */
export async function getUserByAccountNumber(accountNumber: string): Promise<DbUser | null> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('account_number', accountNumber)
      .single();

    if (error) throw error;
    return data as DbUser;
  } catch (error) {
    logger.error('Error fetching user by account number from Supabase:', error);
    return null;
  }
}

/**
 * Update user balance in Supabase
 */
export async function updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');
    
    const { error } = await supabaseAdmin
      .from('users')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    // Backup to Firebase (non-blocking)
    syncToFirebase('users', userId, { balance: newBalance }).catch(err => 
      logger.warn('Firebase backup failed:', err)
    );

    return true;
  } catch (error) {
    logger.error('Error updating user balance:', error);
    return false;
  }
}

/**
 * Create transaction in Supabase
 */
export async function createTransaction(transaction: DbTransaction): Promise<string | null> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .insert([{
        user_id: transaction.user_id,
        category: transaction.category,
        type: transaction.type,
        amount: transaction.amount,
        reference: transaction.reference,
        narration: transaction.narration,
        party_name: transaction.party_name,
        party_account: transaction.party_account,
        party_bank: transaction.party_bank,
        balance_after: transaction.balance_after,
        memo_message: transaction.memo_message,
        memo_image_uri: transaction.memo_image_uri,
        timestamp: new Date().toISOString(),
      }])
      .select('id')
      .single();

    if (error) throw error;

    // Backup to Firebase (non-blocking)
    if (data?.id) {
      syncToFirebase('financialTransactions', data.id, transaction).catch(err =>
        logger.warn('Firebase backup failed:', err)
      );
    }

    return data?.id || null;
  } catch (error) {
    logger.error('Error creating transaction:', error);
    return null;
  }
}

/**
 * Create notification in Supabase
 */
export async function createNotification(notification: DbNotification): Promise<string | null> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert([{
        user_id: notification.user_id,
        title: notification.title,
        body: notification.body,
        category: notification.category,
        type: notification.type,
        read: false,
        amount: notification.amount,
        sender_name: notification.sender_name,
        recipient_name: notification.recipient_name,
        reference: notification.reference,
        created_at: new Date().toISOString(),
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    logger.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Check if transaction reference exists (idempotency)
 */
export async function transactionExists(reference: string): Promise<boolean> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .select('id')
      .eq('reference', reference)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    logger.error('Error checking transaction existence:', error);
    return false;
  }
}

/**
 * Get today's total debited transfers for KYC limit check
 */
export async function getTodayDebitTotal(userId: string): Promise<number> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category', 'transfer')
      .eq('type', 'debit')
      .gte('timestamp', startOfDay.toISOString());

    if (error) throw error;
    return data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  } catch (error) {
    logger.error('Error getting today debit total:', error);
    return 0;
  }
}

/**
 * Get today's total credited transfers for KYC limit check
 */
export async function getTodayCreditTotal(userId: string): Promise<number> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category', 'transfer')
      .eq('type', 'credit')
      .gte('timestamp', startOfDay.toISOString());

    if (error) throw error;
    return data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  } catch (error) {
    logger.error('Error getting today credit total:', error);
    return 0;
  }
}

/**
 * Backup data to Firebase (non-blocking, best effort)
 */
async function syncToFirebase(collection: string, docId: string, data: any): Promise<void> {
  try {
    const db = await getFirestoreDb();
    await db.collection(collection).doc(docId).set(data, { merge: true });
  } catch (error) {
    logger.warn(`Firebase backup failed for ${collection}/${docId}:`, error);
  }
}
