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

