import { supabaseAdmin } from './supabase';

// DB types used across the app
export interface DbUser {
  id: string;
  phone?: string;
  email?: string;
  full_name?: string;
  fullName?: string;
  account_number?: string;
  accountNumber?: string;
  balance: number;
  kyc_tier?: number;
  kycTier?: number;
  is_agent?: boolean;
  isAgent?: boolean;
  avatar_url?: string;
  status?: string;
  // referral/invite fields
  referral_code?: string;
  referralCode?: string;
  invites_count?: number;
  signups_count?: number;
  referral_earnings?: number;
  // legacy/extra fields
  login_pin_hash?: string;
  transaction_pin_hash?: string;
  [key: string]: any;
}

export interface DbTransaction {
  id?: string;
  user_id: string;
  category: string;
  type: 'debit' | 'credit' | string;
  amount: number;
  reference: string;
  narration?: string;
  party_name?: string;
  party_account?: string;
  balance_after?: number;
  created_at?: string;
  // allow additional properties written in various places
  party?: any;
  [key: string]: any;
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
  metadata?: any;
  [key: string]: any;
}

function mapUser(row: any): DbUser | null {
  if (!row) return null;
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    full_name: row.full_name || row.fullName || row.full_name,
    fullName: row.full_name || row.fullName,
    account_number: row.account_number || row.accountNumber,
    accountNumber: row.account_number || row.accountNumber,
    balance: typeof row.balance === 'number' ? row.balance : Number(row.balance) || 0,
    kyc_tier: row.kyc_tier ?? row.kycTier,
    kycTier: row.kyc_tier ?? row.kycTier,
    is_agent: row.is_agent ?? row.isAgent,
    isAgent: row.is_agent ?? row.isAgent,
    avatar_url: row.avatar_url || row.avatarUrl,
    status: row.status,
    // referral/invite fields (preserve raw names too)
    referral_code: row.referral_code || row.referralCode || null,
    referralCode: row.referral_code || row.referralCode || null,
    invites_count: typeof row.invites_count === 'number' ? row.invites_count : Number(row.invites_count) || (typeof row.invitesCount === 'number' ? row.invitesCount : Number(row.invitesCount) || 0),
    signups_count: typeof row.signups_count === 'number' ? row.signups_count : Number(row.signups_count) || (typeof row.signupsCount === 'number' ? row.signupsCount : Number(row.signupsCount) || 0),
    referral_earnings: typeof row.referral_earnings === 'number' ? row.referral_earnings : Number(row.referral_earnings) || (typeof row.referralEarnings === 'number' ? row.referralEarnings : Number(row.referralEarnings) || 0),
    login_pin_hash: row.login_pin_hash || row.loginPinHash || null,
    transaction_pin_hash: row.transaction_pin_hash || row.transactionPinHash || null,
  };
}

// export `db` as the supabaseAdmin client so existing call sites using `db.from()` work
export const db: any = supabaseAdmin;
export const supabase: any = supabaseAdmin;

// User service
export const userService = {
  async getById(userId: string): Promise<DbUser | null> {
    if (!supabaseAdmin) return null;
    const { data } = await supabaseAdmin.from('users').select('*').eq('id', userId).limit(1).single();
    return mapUser((data as any) ?? null);
  },
  async getByPhone(phone: string): Promise<DbUser | null> {
    if (!supabaseAdmin) return null;
    try {
      const phoneClean = String(phone || '').replace(/\D/g, '');

      // 1) try exact match on `phone`
      let resp: any = await supabaseAdmin.from('users').select('*').eq('phone', phone).limit(1).maybeSingle();
      if (resp?.data) return mapUser(resp.data);

      // 2) try numeric-cleaned phone
      resp = await supabaseAdmin.from('users').select('*').eq('phone', phoneClean).limit(1).maybeSingle();
      if (resp?.data) return mapUser(resp.data);

      // 3) try common alternate column `phone_number`
      resp = await supabaseAdmin.from('users').select('*').eq('phone_number', phone).limit(1).maybeSingle();
      if (resp?.data) return mapUser(resp.data);

      resp = await supabaseAdmin.from('users').select('*').eq('phone_number', phoneClean).limit(1).maybeSingle();
      if (resp?.data) return mapUser(resp.data);

      // 4) fallback: search by last 7-10 digits using ilike
      const last10 = phoneClean.slice(-10);
      if (last10) {
        const list = await supabaseAdmin.from('users').select('*').ilike('phone', `%${last10}%`).limit(1);
        if (list?.data && Array.isArray(list.data) && list.data.length > 0) return mapUser(list.data[0]);
      }
    } catch (err) {
      console.error('getByPhone error', err);
    }
    return null;
  },
  async getByAccountNumber(accountNumber: string): Promise<DbUser | null> {
    if (!supabaseAdmin) return null;
    const { data } = await supabaseAdmin.from('users').select('*').eq('account_number', accountNumber).limit(1).single();
    return mapUser((data as any) ?? null);
  },
  async updateBalance(userId: string, newBalance: number): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('users').update({ balance: newBalance }).eq('id', userId);
    return !error;
  }
};

// Transaction service
export const transactionService = {
  async create(tx: DbTransaction): Promise<string | null> {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin.from('financial_transactions').insert([tx]).select('id').limit(1).single();
    if (error) return null;
    return (data as any)?.id ?? null;
  },
  async getByReference(reference: string): Promise<DbTransaction | null> {
    if (!supabaseAdmin) return null;
    const { data } = await supabaseAdmin.from('financial_transactions').select('*').eq('reference', reference).limit(1).single();
    return (data as any) ?? null;
  },
  async getByUserId(userId: string, limit = 50, category?: string): Promise<DbTransaction[]> {
    if (!supabaseAdmin) return [];
    let query = supabaseAdmin.from('financial_transactions').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
    if (category && category !== 'all') query = query.eq('category', category);
    const { data } = await query.limit(limit as any);
    return (data as any) ?? [];
  }
};

// Notification service
export const notificationService = {
  async create(n: DbNotification): Promise<string | null> {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin.from('notifications').insert([n]).select('id').limit(1).single();
    if (error) {
      console.error('Failed to create notification', error);
      throw error;
    }
    return (data as any)?.id ?? null;
  },
  async getByUserId(userId: string, limit = 50): Promise<DbNotification[]> {
    if (!supabaseAdmin) return [];
    const { data } = await supabaseAdmin.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
    return (data as any) ?? [];
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
  if (!supabaseAdmin) return false;
  const { count, error } = await supabaseAdmin.from('financial_transactions').select('id', { count: 'exact', head: true }).eq('reference', reference);
  return !!count && count > 0;
}

export async function getTodayDebitTotal(userId: string): Promise<number> {
  if (!supabaseAdmin) return 0;
  const start = new Date();
  start.setHours(0,0,0,0);
  const { data } = await supabaseAdmin.from('financial_transactions').select('amount').eq('user_id', userId).eq('type', 'debit').gte('timestamp', start.toISOString());
  const arr: any[] = (data as any) ?? [];
  return arr.reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

export async function getTodayCreditTotal(userId: string): Promise<number> {
  if (!supabaseAdmin) return 0;
  const start = new Date();
  start.setHours(0,0,0,0);
  const { data } = await supabaseAdmin.from('financial_transactions').select('amount').eq('user_id', userId).eq('type', 'credit').gte('timestamp', start.toISOString());
  const arr: any[] = (data as any) ?? [];
  return arr.reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

export async function createNotification(n: DbNotification): Promise<string | null> {
  return await notificationService.create(n);
}

