// Mock user data store

interface UserAccount {
    accountNumber: string; // This is the 10-digit phone number
    userId: string;
    fullName: string;
    balance: number; // in kobo to avoid floating point issues
}

interface Transaction {
    id: string;
    accountNumber: string;
    type: 'debit' | 'credit';
    amount: number; // in kobo, always positive
    balanceBefore: number;
    balanceAfter: number;
    reference: string;
    narration?: string;
    timestamp: string;
}

// Using a Map for easier access by account number
const accounts = new Map<string, UserAccount>([
    ['8012345678', { userId: 'user_paago', accountNumber: '8012345678', fullName: 'PAAGO DAVID', balance: 125034500 }],
    ['0987654321', { userId: 'user_jane', accountNumber: '0987654321', fullName: 'JANE SMITH', balance: 5000000 }],
    ['1122334455', { userId: 'user_femi', accountNumber: '1122334455', fullName: 'FEMI ADEBOLA', balance: 7500000 }],
]);

// This array acts as our immutable transaction ledger
const transactions: Transaction[] = [];

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
    // This function simulates a database transaction.
    // START TRANSACTION;

    // --- Fraud Detection Simulation ---
    const FRAUD_THRESHOLD_KOBO = 10000000; // ₦100,000
    if (amountInKobo > FRAUD_THRESHOLD_KOBO) {
        // In a real system, this would trigger a more complex workflow:
        // 1. Log the attempt in a security event stream.
        // 2. Add the transaction to a manual review queue.
        // 3. Potentially place a temporary hold on the user's account.
        // 4. Send a notification to the user about the flagged activity.
        return {
            success: false,
            message: 'This transaction is unusually large and has been flagged for security review. Please contact support if you believe this is an error.'
        };
    }
    // --- End Fraud Detection ---
    
    const senderAccount = accounts.get(senderAccountNumber);
    const recipientAccount = accounts.get(recipientAccountNumber);

    if (!senderAccount || !recipientAccount) {
        // This check should be redundant if called from the API, but good for safety
        return { success: false, message: 'Invalid account.' };
    }

    if (senderAccount.balance < amountInKobo) {
        return { success: false, message: 'Insufficient funds.' };
    }

    const reference = `OVO-INT-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newSenderBalance = senderAccount.balance - amountInKobo;
    const newRecipientBalance = recipientAccount.balance + amountInKobo;

    // 1. Debit Sender
    senderAccount.balance = newSenderBalance;
    transactions.push({
        id: `txn_${Date.now()}_d`,
        accountNumber: senderAccountNumber,
        type: 'debit',
        amount: amountInKobo,
        balanceBefore: senderAccount.balance + amountInKobo, // old balance
        balanceAfter: newSenderBalance,
        reference,
        narration: narration || `Transfer to ${recipientAccount.fullName}`,
        timestamp
    });

    // 2. Credit Recipient
    recipientAccount.balance = newRecipientBalance;
    transactions.push({
        id: `txn_${Date.now()}_c`,
        accountNumber: recipientAccountNumber,
        type: 'credit',
        amount: amountInKobo,
        balanceBefore: recipientAccount.balance - amountInKobo, // old balance
        balanceAfter: newRecipientBalance,
        reference,
        narration: narration || `Transfer from ${senderAccount.fullName}`,
        timestamp
    });

    // Update the accounts in our "database"
    accounts.set(senderAccountNumber, senderAccount);
    accounts.set(recipientAccountNumber, recipientAccount);
    
    // In a real DB, we would now COMMIT the transaction.
    // COMMIT;

    return { success: true, newSenderBalance, reference };
}


// We'll use this as the sender's account for all transactions in this simulation
export const MOCK_SENDER_ACCOUNT = '8012345678';
