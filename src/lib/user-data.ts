
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

// KYC-based daily transfer limits (debit) in kobo
const DAILY_DEBIT_LIMITS_BY_KYC: Record<number, number> = {
    1: 50000 * 100, // ₦50,000
    2: 500000 * 100, // ₦500,000
    3: 5000000 * 100, // ₦5,000,000
    4: Infinity, // Unlimited (corporate)
};

// KYC-based daily receive limits (credit) in kobo
const DAILY_RECEIVE_LIMITS_BY_KYC: Record<number, number> = {
    1: 200000 * 100, // ₦200,000
    2: 5000000 * 100, // ₦5,000,000
    3: Infinity, // Unlimited
    4: Infinity, // Unlimited (corporate)
};

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

// Helper: get today's total debited transfers for a user in kobo
const getTodayDebitedTransfersTotal = async (userId: string): Promise<number> => {
    const db = await getDb();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTs = admin.firestore.Timestamp.fromDate(startOfDay);
    const snap = await db
        .collection('financialTransactions')
        .where('userId', '==', userId)
        .where('category', '==', 'transfer')
        .where('type', '==', 'debit')
        .where('timestamp', '>=', startTs)
        .get();
    let total = 0;
    snap.forEach((d) => {
        const data: any = d.data();
        total += Number(data.amount || 0);
    });
    return total;
};

// Helper: get today's total credited transfers for a user in kobo
const getTodayCreditedTransfersTotal = async (userId: string): Promise<number> => {
    const db = await getDb();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTs = admin.firestore.Timestamp.fromDate(startOfDay);
    const snap = await db
        .collection('financialTransactions')
        .where('userId', '==', userId)
        .where('category', '==', 'transfer')
        .where('type', '==', 'credit')
        .where('timestamp', '>=', startTs)
        .get();
    let total = 0;
    snap.forEach((d) => {
        const data: any = d.data();
        total += Number(data.amount || 0);
    });
    return total;
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

        // Pre-check sender debit limit before transaction
        const senderDocPreCheck = await db.collection('users').doc(senderUserId).get();
        if (!senderDocPreCheck.exists) return { success: false, message: 'Sender account not found.' };
        const senderKycTier = Number(senderDocPreCheck.data()?.kycTier || 1);
        const senderDailyDebitLimit = DAILY_DEBIT_LIMITS_BY_KYC[senderKycTier] ?? DAILY_DEBIT_LIMITS_BY_KYC[1];
        const senderTodaysDebit = await getTodayDebitedTransfersTotal(senderUserId);
        if (senderTodaysDebit + amountInKobo > senderDailyDebitLimit) {
            return { success: false, message: `Daily transfer limit exceeded. You can send up to ₦${(senderDailyDebitLimit / 100).toLocaleString('en-NG')} per day.` };
        }

        // Pre-check recipient receive limit before transaction
        const recipientDocPreCheck = await recipientDocRef.get();
        if (!recipientDocPreCheck.exists) return { success: false, message: 'Recipient account not found.' };
        const recipientKycTier = Number(recipientDocPreCheck.data()?.kycTier || 1);
        const recipientDailyReceiveLimit = DAILY_RECEIVE_LIMITS_BY_KYC[recipientKycTier] ?? DAILY_RECEIVE_LIMITS_BY_KYC[1];
        const recipientTodaysCredit = await getTodayCreditedTransfersTotal(recipientDocRef.id);
        if (recipientTodaysCredit + amountInKobo > recipientDailyReceiveLimit) {
            return { success: false, message: `Recipient's daily receive limit exceeded. Maximum daily limit is ₦${(recipientDailyReceiveLimit / 100).toLocaleString('en-NG')}.` };
        }

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

            finalSenderBalance = newSenderBalance;
        });

        if (finalSenderBalance === 0 && clientReference) {
            const senderDoc = await db.collection('users').doc(senderUserId).get();
            if (senderDoc.exists) finalSenderBalance = (senderDoc.data() as any).balance || 0;
        }

        // Create Supabase notifications after successful transfer
        const { createNotifications } = await import('@/lib/notification-helper');
        const senderData = senderDocPreCheck.data();
        const recipientData = recipientSnapshot.docs[0].data();
        
        console.log('DEBUG: Sender data:', {
            fullName: senderData?.fullName,
            phoneNumber: senderData?.phoneNumber,
            accountNumber: senderData?.accountNumber
        });
        console.log('DEBUG: Recipient data:', {
            fullName: recipientData?.fullName,
            phoneNumber: recipientData?.phoneNumber,
            accountNumber: recipientAccountNumber
        });
        
        await createNotifications([
            {
                userId: senderUserId,
                title: 'Money Sent',
                body: `₦${(amountInKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })} sent to ${recipientName}`,
                category: 'transfer',
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                senderName: senderData?.fullName,
                senderPhone: senderData?.phoneNumber,
                senderAccount: senderData?.accountNumber,
                recipientName,
                recipientPhone: recipientData?.phoneNumber,
                recipientAccount: recipientAccountNumber,
            },
            {
                userId: recipientSnapshot.docs[0].id,
                title: 'Money Received',
                body: `₦${(amountInKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })} received from ${senderData?.fullName || 'Unknown'}`,
                category: 'transfer',
                type: 'credit',
                amount: amountInKobo,
                reference: clientReference,
                senderName: senderData?.fullName,
                senderPhone: senderData?.phoneNumber,
                senderAccount: senderData?.accountNumber,
                recipientName,
                recipientPhone: recipientData?.phoneNumber,
                recipientAccount: recipientAccountNumber,
            },
        ]);

        return { success: true, newSenderBalance: finalSenderBalance, recipientName, reference: clientReference };

    } catch (error) {
        console.error('Firestore transaction failed: ', error);
        if (error instanceof Error) return { success: false, message: error.message };
        return { success: false, message: 'An unexpected error occurred during the transfer.' };
    }
}
// @ts-nocheck
