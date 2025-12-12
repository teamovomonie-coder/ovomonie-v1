
// Server-side user-data: migrated to Firebase Admin SDK
import { getDb, admin } from '@/lib/firebaseAdmin';

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
    // On the server, query Firestore using Admin SDK.
    if (typeof window === 'undefined') {
        const db = await getDb();
        const snapshot = await db.collection('users').where('accountNumber', '==', accountNumber).get();
        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...(doc.data() as any) } as UserAccount;
    } else {
        // On the client, fetch via API
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
        const db = await getDb();
        // Idempotency pre-check
        try {
            const existing = await db.collection('financialTransactions').where('reference', '==', clientReference).get();
            if (existing && !existing.empty) {
                const senderDoc = await db.collection('users').doc(senderUserId).get();
                const finalSenderBalance = (senderDoc.exists ? (senderDoc.data() as any).balance : 0) || 0;
                return { success: true, newSenderBalance: finalSenderBalance, recipientName: '', reference: clientReference };
            }
        } catch (e) {
            // proceed to transaction if idempotency check fails
            console.warn('Idempotency pre-check failed, proceeding with transaction', e);
        }

        let finalSenderBalance = 0;
        let recipientName = '';

        // Find recipient doc first
        const recipientSnapshot = await db.collection('users').where('accountNumber', '==', recipientAccountNumber).get();
        if (recipientSnapshot.empty) return { success: false, message: 'Recipient account not found.' };
        const recipientDocRef = db.collection('users').doc(recipientSnapshot.docs[0].id);

        await db.runTransaction(async (transaction) => {
            const senderRef = db.collection('users').doc(senderUserId);
            const [senderDocSnap, recipientDocSnap] = await Promise.all([
                transaction.get(senderRef),
                transaction.get(recipientDocRef),
            ]);

            if (!senderDocSnap.exists) throw new Error('Sender account not found.');
            if (!recipientDocSnap.exists) throw new Error('Recipient account not found.');

            const senderData = senderDocSnap.data() as any;
            const recipientData = recipientDocSnap.data() as any;
            recipientName = recipientData.fullName || '';

            if ((senderData.balance || 0) < amountInKobo) {
                throw new Error('Insufficient funds.');
            }

            const newSenderBalance = (senderData.balance || 0) - amountInKobo;
            const newRecipientBalance = (recipientData.balance || 0) + amountInKobo;

            transaction.update(senderRef, { balance: newSenderBalance });
            transaction.update(recipientDocRef, { balance: newRecipientBalance });

            const debitLog = {
                userId: senderUserId,
                category: 'transfer',
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: narration || `Transfer to ${recipientData.fullName}`,
                party: { name: recipientData.fullName, account: recipientAccountNumber, bank: 'Ovomonie' },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                balanceAfter: newSenderBalance,
                memoMessage: message || null,
                memoImageUri: photo || null,
            };
            const creditLog = {
                userId: recipientDocRef.id,
                category: 'transfer',
                type: 'credit',
                amount: amountInKobo,
                reference: clientReference,
                narration: narration || `Transfer from ${senderData.fullName}`,
                party: { name: senderData.fullName, account: senderData.accountNumber, bank: 'Ovomonie' },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                balanceAfter: newRecipientBalance,
                memoMessage: message || null,
                memoImageUri: photo || null,
            };

            transaction.set(db.collection('financialTransactions').doc(), debitLog);
            transaction.set(db.collection('financialTransactions').doc(), creditLog);

            // Create notifications for both users
            const debitNotification = {
              userId: senderUserId,
              title: 'Money Sent',
              body: `Debited to ${recipientData.fullName}`,
              category: 'transfer',
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              type: 'debit',
              amount: amountInKobo,
              recipientName: recipientData.fullName,
            };
            const creditNotification = {
              userId: recipientDocRef.id,
              title: 'Money Received',
              body: `Account credited by ${senderData.fullName}`,
              category: 'transfer',
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              type: 'credit',
              amount: amountInKobo,
              senderName: senderData.fullName,
            };

            transaction.set(db.collection('notifications').doc(), debitNotification);
            transaction.set(db.collection('notifications').doc(), creditNotification);

            finalSenderBalance = newSenderBalance;
        });

        if (finalSenderBalance === 0 && clientReference) {
            const senderDoc = await db.collection('users').doc(senderUserId).get();
            if (senderDoc.exists) finalSenderBalance = (senderDoc.data() as any).balance || 0;
        }

        return { success: true, newSenderBalance: finalSenderBalance, recipientName, reference: clientReference };

    } catch (error) {
        console.error('Firestore transaction failed: ', error);
        if (error instanceof Error) return { success: false, message: error.message };
        return { success: false, message: 'An unexpected error occurred during the transfer.' };
    }
}
// @ts-nocheck
