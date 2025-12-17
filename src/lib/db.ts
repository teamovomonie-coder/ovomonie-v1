// Minimal, stable DB shim to allow lint/typecheck during merge resolution.
// Replace with full Supabase implementation after merge verification.

export const db: any = {};

export const userService = {
  async getById(_userId: string) {
    return null;
  },
  async getByPhone(_phone: string) {
    return null;
  },
  async getByAccountNumber(_accountNumber: string) {
    return null;
  },
  async updateBalance(_userId: string, _newBalance: number) {
    return true;
  },
};

export const transactionService = {
  async create(_tx: any) { return null; },
  async getByReference(_ref: string) { return null; },
  async getByUserId(_userId: string) { return []; },
};

export const notificationService = {
  async create(_n: any) { return null; },
  async getByUserId(_userId: string) { return []; },
};

export async function getUserById(_userId: string) { return null; }
export async function getUserByPhone(_phone: string) { return null; }
export async function getUserByAccountNumber(_accountNumber: string) { return null; }
export async function updateUserBalance(_userId: string, _newBalance: number) { return true; }
export async function createTransaction(_t: any) { return null; }
export async function transactionExists(_ref: string) { return false; }
export async function getTodayDebitTotal(_userId: string) { return 0; }
export async function getTodayCreditTotal(_userId: string) { return 0; }

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
