
// This file now interacts directly with Firestore for user account data.
import { db } from '@/lib/firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    query, 
    where, 
    getDocs,
    runTransaction,
    doc
} from 'firebase/firestore';

interface UserAccount {
    id?: string;
    userId: string;
    accountNumber: string;
    fullName: string;
    balance: number; // in kobo
    referralCode?: string;
}


export const mockGetAccountByNumber = async (accountNumber: string): Promise<UserAccount | undefined> => {
    // On the server, query Firestore directly.
    if (typeof window === 'undefined') {
        const q = query(collection(db, "users"), where("accountNumber", "==", accountNumber));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return undefined;
        }
        
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserAccount;
    } 
    // On the client, fetch from the API route to avoid direct DB connection issues.
    else {
        try {
            const response = await fetch(`/api/user/${accountNumber}`);
            if (!response.ok) {
                if (response.status === 404) return undefined;
                console.error('Failed to fetch user account data, status:', response.status);
                return undefined;
            }
            const data = await response.json();
            return data as UserAccount;
        } catch (error) {
            console.error("Error fetching account data from API:", error);
            return undefined;
        }
    }
};

export const performTransfer = async (
    senderAccountNumber: string,
    recipientAccountNumber: string,
    amountInKobo: number,
    clientReference: string,
    narration?: string
): Promise<{ success: true; newSenderBalance: number; reference: string } | { success: false; message: string }> => {
    
    const FRAUD_THRESHOLD_KOBO = 10000000; // ₦100,000
    if (amountInKobo > FRAUD_THRESHOLD_KOBO) {
        return {
            success: false,
            message: 'This transaction is unusually large and has been flagged for security review. Please contact support if you believe this is an error.'
        };
    }
    
    try {
        let newSenderBalance = 0;

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                console.log(`Idempotent request for internal transfer: ${clientReference} already processed.`);
                return;
            }

            const senderQuery = query(collection(db, "users"), where("accountNumber", "==", senderAccountNumber));
            const recipientQuery = query(collection(db, "users"), where("accountNumber", "==", recipientAccountNumber));

            const senderSnapshot = await getDocs(senderQuery);
            const recipientSnapshot = await getDocs(recipientQuery);

            if (senderSnapshot.empty) {
                throw new Error("Sender account not found.");
            }
            if (recipientSnapshot.empty) {
                throw new Error("Recipient account not found.");
            }
            
            const senderDoc = senderSnapshot.docs[0];
            const recipientDoc = recipientSnapshot.docs[0];

            const senderData = senderDoc.data() as UserAccount;
            const recipientData = recipientDoc.data() as UserAccount;

            if (senderData.balance < amountInKobo) {
                throw new Error("Insufficient funds.");
            }

            // Perform balance updates
            newSenderBalance = senderData.balance - amountInKobo;
            const newRecipientBalance = recipientData.balance + amountInKobo;
            
            transaction.update(senderDoc.ref, { balance: newSenderBalance });
            transaction.update(recipientDoc.ref, { balance: newRecipientBalance });
            

            // Log Debit for Sender
            const senderLog = {
                userId: senderData.userId,
                category: 'transfer',
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: narration || `Transfer to ${recipientData.fullName}`,
                party: {
                    name: recipientData.fullName,
                    account: recipientAccountNumber,
                    bank: 'Ovomonie'
                },
                timestamp: serverTimestamp(),
                balanceAfter: newSenderBalance
            };
            transaction.set(doc(financialTransactionsRef), senderLog);
            
            // Log Credit for Recipient
            const recipientLog = {
                userId: recipientData.userId,
                category: 'transfer',
                type: 'credit',
                amount: amountInKobo,
                reference: clientReference,
                narration: narration || `Transfer from ${senderData.fullName}`,
                party: {
                    name: senderData.fullName,
                    account: senderAccountNumber,
                    bank: 'Ovomonie'
                },
                timestamp: serverTimestamp(),
                balanceAfter: newRecipientBalance
            };
            transaction.set(doc(financialTransactionsRef), recipientLog);
        });

        // Re-fetch balance to return the most up-to-date value, even if the txn was idempotent
        const finalSenderAccount = await mockGetAccountByNumber(senderAccountNumber);
        newSenderBalance = finalSenderAccount!.balance;
        
        return { success: true, newSenderBalance, reference: clientReference };

    } catch (error) {
        console.error("Firestore transaction failed: ", error);
        if (error instanceof Error) {
           return { success: false, message: error.message };
        }
        return { success: false, message: 'An unexpected error occurred during the transfer.' };
    }
}


// We'll use this as the sender's account for all transactions in this simulation
export const MOCK_SENDER_ACCOUNT = '8012345678';
