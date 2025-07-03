// Mock user data store
import { db } from './inventory-db';

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
    // In a real DB, this would be a 'SELECT * FROM accounts WHERE accountNumber = ?'
    return accounts.get(accountNumber);
};

export const performTransfer = async (
    senderAccountNumber: string,
    recipientAccountNumber: string,
    amountInKobo: number,
    narration?: string
): Promise<{ success: true; newSenderBalance: number; reference: string } | { success: false; message: string }> => {
    // START TRANSACTION;
    const senderAccount = accounts.get(senderAccountNumber);
    const recipientAccount = accounts.get(recipientAccountNumber);

    if (!senderAccount || !recipientAccount) {
        return { success: false, message: 'Invalid account.' };
    }
    
    // --- Fraud Detection Simulation ---
    const FRAUD_THRESHOLD_KOBO = 10000000; // ₦100,000
    if (amountInKobo > FRAUD_THRESHOLD_KOBO) {
        return {
            success: false,
            message: 'This transaction is unusually large and has been flagged for security review. Please contact support if you believe this is an error.'
        };
    }
    // --- End Fraud Detection ---
    

    if (senderAccount.balance < amountInKobo) {
        return { success: false, message: 'Insufficient funds.' };
    }

    const reference = `OVO-INT-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newSenderBalance = senderAccount.balance - amountInKobo;
    const newRecipientBalance = recipientAccount.balance + amountInKobo;

    // 1. Log Debit for Sender
    await db.financialTransactions.create({
        userId: senderAccount.userId,
        category: 'transfer',
        type: 'debit',
        amount: amountInKobo,
        reference,
        narration: narration || `Transfer to ${recipientAccount.fullName}`,
        party: {
            name: recipientAccount.fullName,
            account: recipientAccountNumber,
            bank: 'Ovomonie'
        },
        timestamp,
        balanceAfter: newSenderBalance
    });

    // 2. Log Credit for Recipient
    await db.financialTransactions.create({
        userId: recipientAccount.userId,
        category: 'transfer',
        type: 'credit',
        amount: amountInKobo,
        reference,
        narration: narration || `Transfer from ${senderAccount.fullName}`,
        party: {
            name: senderAccount.fullName,
            account: senderAccountNumber,
            bank: 'Ovomonie'
        },
        timestamp,
        balanceAfter: newRecipientBalance
    });

    // 3. Update account balances
    senderAccount.balance = newSenderBalance;
    recipientAccount.balance = newRecipientBalance;
    accounts.set(senderAccountNumber, senderAccount);
    accounts.set(recipientAccountNumber, recipientAccount);
    
    // COMMIT;

    return { success: true, newSenderBalance, reference };
}


// We'll use this as the sender's account for all transactions in this simulation
export const MOCK_SENDER_ACCOUNT = '8012345678';
