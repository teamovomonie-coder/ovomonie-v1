// Mock user data store

interface UserAccount {
    accountNumber: string; // This is the 10-digit phone number
    userId: string;
    fullName: string;
    balance: number; // in kobo to avoid floating point issues
}

// Using a Map for easier access by account number
const accounts = new Map<string, UserAccount>([
    ['8012345678', { userId: 'user_paago', accountNumber: '8012345678', fullName: 'PAAGO DAVID', balance: 125034500 }],
    ['0987654321', { userId: 'user_jane', accountNumber: '0987654321', fullName: 'JANE SMITH', balance: 5000000 }],
    ['1122334455', { userId: 'user_femi', accountNumber: '1122334455', fullName: 'FEMI ADEBOLA', balance: 7500000 }],
]);

export const mockGetAccountByNumber = async (accountNumber: string): Promise<UserAccount | undefined> => {
    return accounts.get(accountNumber);
};

export const mockUpdateBalance = async (accountNumber: string, newBalance: number): Promise<boolean> => {
    const account = accounts.get(accountNumber);
    if (account) {
        account.balance = newBalance;
        accounts.set(accountNumber, account);
        return true;
    }
    return false;
};

// We'll use this as the sender's account for all transactions in this simulation
export const MOCK_SENDER_ACCOUNT = '8012345678';
