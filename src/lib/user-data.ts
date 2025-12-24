// Server-side user-data: migrated to Supabase
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

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
    // On the server, query Supabase
    if (typeof window === 'undefined' && supabaseAdmin) {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('account_number', accountNumber)
            .single();
        
        if (error || !data) return undefined;
        return { id: data.id, ...data } as UserAccount;
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
    if (!supabaseAdmin) return 0;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabaseAdmin
        .from('financial_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', 'transfer')
        .eq('type', 'debit')
        .gte('timestamp', startOfDay.toISOString());
    
    if (error || !data) return 0;
    
    return data.reduce((total, tx) => total + (Number(tx.amount) || 0), 0);
};

// Helper: get today's total credited transfers for a user in kobo
const getTodayCreditedTransfersTotal = async (userId: string): Promise<number> => {
    if (!supabaseAdmin) return 0;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabaseAdmin
        .from('financial_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', 'transfer')
        .eq('type', 'credit')
        .gte('timestamp', startOfDay.toISOString());
    
    if (error || !data) return 0;
    
    return data.reduce((total, tx) => total + (Number(tx.amount) || 0), 0);
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
        if (!supabaseAdmin) {
            return { success: false, message: 'Database not available' };
        }

        // Idempotency pre-check
        const { data: existing } = await supabaseAdmin
            .from('financial_transactions')
            .select('id')
            .eq('reference', clientReference)
            .limit(1);

        if (existing && existing.length > 0) {
            const { data: senderData } = await supabaseAdmin
                .from('users')
                .select('balance')
                .eq('id', senderUserId)
                .single();
            
            const finalSenderBalance = senderData?.balance || 0;
            return { success: true, newSenderBalance: finalSenderBalance, recipientName: '', reference: clientReference };
        }

        // Find recipient
        const { data: recipientData, error: recipientError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('account_number', recipientAccountNumber)
            .single();

        if (recipientError || !recipientData) {
            return { success: false, message: 'Recipient account not found.' };
        }

        // Get sender data
        const { data: senderData, error: senderError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', senderUserId)
            .single();

        if (senderError || !senderData) {
            return { success: false, message: 'Sender account not found.' };
        }

        // Check sender balance
        if ((senderData.balance || 0) < amountInKobo) {
            return { success: false, message: 'Insufficient funds.' };
        }

        // Check limits
        const senderKycTier = Number(senderData.kyc_tier || 1);
        const senderDailyDebitLimit = DAILY_DEBIT_LIMITS_BY_KYC[senderKycTier];
        const senderTodaysDebit = await getTodayDebitedTransfersTotal(senderUserId);
        
        if (senderDailyDebitLimit && senderTodaysDebit + amountInKobo > senderDailyDebitLimit) {
            return { success: false, message: `Daily transfer limit exceeded. You can send up to ₦${(senderDailyDebitLimit / 100).toLocaleString('en-NG')} per day.` };
        }

        const recipientKycTier = Number(recipientData.kyc_tier || 1);
        const recipientDailyReceiveLimit = DAILY_RECEIVE_LIMITS_BY_KYC[recipientKycTier];
        const recipientTodaysCredit = await getTodayCreditedTransfersTotal(recipientData.id);
        
        if (recipientDailyReceiveLimit && recipientTodaysCredit + amountInKobo > recipientDailyReceiveLimit) {
            return { success: false, message: `Recipient's daily receive limit exceeded. Maximum daily limit is ₦${(recipientDailyReceiveLimit / 100).toLocaleString('en-NG')}.` };
        }

        // Perform transfer
        const newSenderBalance = (senderData.balance || 0) - amountInKobo;
        const newRecipientBalance = (recipientData.balance || 0) + amountInKobo;

        // Update balances
        await Promise.all([
            supabaseAdmin.from('users').update({ balance: newSenderBalance }).eq('id', senderUserId),
            supabaseAdmin.from('users').update({ balance: newRecipientBalance }).eq('id', recipientData.id)
        ]);

        // Create transaction records
        const timestamp = new Date().toISOString();
        await Promise.all([
            supabaseAdmin.from('financial_transactions').insert({
                user_id: senderUserId,
                category: 'transfer',
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: narration || `Transfer to ${recipientData.full_name}`,
                party_name: recipientData.full_name,
                party_account: recipientAccountNumber,
                timestamp,
                balance_after: newSenderBalance,
                metadata: {
                    memoMessage: message || null,
                    memoImageUri: photo || null,
                }
            }),
            supabaseAdmin.from('financial_transactions').insert({
                user_id: recipientData.id,
                category: 'transfer',
                type: 'credit',
                amount: amountInKobo,
                reference: clientReference,
                narration: narration || `Transfer from ${senderData.full_name}`,
                party_name: senderData.full_name,
                party_account: senderData.account_number,
                timestamp,
                balance_after: newRecipientBalance,
                metadata: {
                    memoMessage: message || null,
                    memoImageUri: photo || null,
                }
            })
        ]);

        return { 
            success: true, 
            newSenderBalance, 
            recipientName: recipientData.full_name || '', 
            reference: clientReference 
        };

    } catch (error) {
        console.error('Transfer failed: ', error);
        if (error instanceof Error) return { success: false, message: error.message };
        return { success: false, message: 'An unexpected error occurred during the transfer.' };
    }
};