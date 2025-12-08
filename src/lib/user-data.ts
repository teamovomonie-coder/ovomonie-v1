
// @ts-nocheck
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
    doc,
    getDoc
} from 'firebase/firestore';

interface UserAccount {
    id?: string;
    userId: string;
    accountNumber: string;
    fullName: string;
    balance: number; // in kobo
    referralCode?: string;
    isAgent?: boolean;
    kycTier?: number;
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
    senderUserId: string,
    recipientAccountNumber: string,
    amountInKobo: number,
    clientReference: string,
    narration?: string,
    message?: string,
    photo?: string,
): Promise<{ success: true; newSenderBalance: number; recipientName: string; reference: string } | { success: false; message: string }> => {
    
    try {
        let finalSenderBalance = 0;
        let recipientName = '';

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                const senderDocRef = doc(db, 'users', senderUserId);
                const senderDoc = await transaction.get(senderDocRef);
                if (senderDoc.exists()) {
                    finalSenderBalance = senderDoc.data().balance;
                }
                console.log(`Idempotent request for internal transfer: ${clientReference} already processed.`);
                return;
            }

            const senderDocRef = doc(db, "users", senderUserId);
            const recipientQuery = query(collection(db, "users"), where("accountNumber", "==", recipientAccountNumber));

            const [senderDoc, recipientSnapshot] = await Promise.all([
                transaction.get(senderDocRef),
                transaction.get(recipientQuery)
            ]);

            if (!senderDoc.exists()) {
                throw new Error("Sender account not found.");
            }
            if (recipientSnapshot.empty) {
                throw new Error("Recipient account not found.");
            }
            
            const recipientDoc = recipientSnapshot.docs[0];

            const senderData = senderDoc.data() as UserAccount;
            const recipientData = recipientDoc.data() as UserAccount;
            recipientName = recipientData.fullName;

            if (senderData.balance < amountInKobo) {
                throw new Error("Insufficient funds.");
            }

            const newSenderBalance = senderData.balance - amountInKobo;
            const newRecipientBalance = recipientData.balance + amountInKobo;
            
            transaction.update(senderDoc.ref, { balance: newSenderBalance });
            transaction.update(recipientDoc.ref, { balance: newRecipientBalance });
            
            const senderLog = {
                userId: senderDoc.id,
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
                balanceAfter: newSenderBalance,
                memoMessage: message || null,
                memoImageUri: photo || null,
            };
            transaction.set(doc(financialTransactionsRef), senderLog);
            
            const recipientLog = {
                userId: recipientDoc.id,
                category: 'transfer',
                type: 'credit',
                amount: amountInKobo,
                reference: clientReference,
                narration: narration || `Transfer from ${senderData.fullName}`,
                party: {
                    name: senderData.fullName,
                    account: senderData.accountNumber,
                    bank: 'Ovomonie'
                },
                timestamp: serverTimestamp(),
                balanceAfter: newRecipientBalance,
                memoMessage: message || null,
                memoImageUri: photo || null,
            };
            transaction.set(doc(financialTransactionsRef), recipientLog);

            finalSenderBalance = newSenderBalance;
        });

        if (finalSenderBalance === 0 && clientReference) {
             const senderDocRef = doc(db, 'users', senderUserId);
             const senderDoc = await getDoc(senderDocRef);
             if (senderDoc.exists()) {
                 finalSenderBalance = senderDoc.data().balance;
             }
        }
        
        return { success: true, newSenderBalance: finalSenderBalance, recipientName, reference: clientReference };

    } catch (error) {
        console.error("Firestore transaction failed: ", error);
        if (error instanceof Error) {
           return { success: false, message: error.message };
        }
        return { success: false, message: 'An unexpected error occurred during the transfer.' };
    }
}
// @ts-nocheck
