import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { loanId, amount, clientReference } = await request.json();

        if (!loanId || !amount || amount <= 0) {
            return NextResponse.json({ message: 'Loan ID and a positive amount are required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }
        
        const amountInKobo = Math.round(amount * 100);

        // Check for existing transaction (idempotency)
        const { data: existingTxn } = await supabaseAdmin
            .from('financial_transactions')
            .select('id')
            .eq('reference', clientReference)
            .limit(1);

        if (existingTxn && existingTxn.length > 0) {
            logger.info(`Idempotent request for loan repayment: ${clientReference} already processed.`);
            const { data: user } = await supabaseAdmin.from('users').select('balance').eq('id', userId).single();
            const { data: loan } = await supabaseAdmin.from('loans').select('balance').eq('id', loanId).single();
            
            return NextResponse.json({
                message: 'Repayment already processed',
                newUserBalance: user?.balance || 0,
                newLoanBalance: loan?.balance || 0,
            });
        }

        // Get loan and user data
        const { data: loan, error: loanError } = await supabaseAdmin
            .from('loans')
            .select('*')
            .eq('id', loanId)
            .single();

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (loanError || !loan) throw new Error("Loan not found.");
        if (loan.user_id !== userId) throw new Error("Loan does not belong to this user.");
        if (userError || !user) throw new Error("User not found.");

        if (user.balance < amountInKobo) throw new Error("Insufficient funds for repayment.");

        const newLoanBalance = loan.balance - amountInKobo;
        const newUserBalance = user.balance - amountInKobo;
        const newStatus = newLoanBalance <= 0 ? 'Paid' : 'Active';

        // Update user balance
        await supabaseAdmin
            .from('users')
            .update({ balance: newUserBalance })
            .eq('id', userId);

        // Update loan
        await supabaseAdmin
            .from('loans')
            .update({
                balance: newLoanBalance,
                status: newStatus,
                last_repayment_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', loanId);

        // Create transaction record
        await supabaseAdmin
            .from('financial_transactions')
            .insert({
                user_id: userId,
                category: 'loan',
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: 'Loan repayment',
                party_name: 'Ovomonie Loans',
                timestamp: new Date().toISOString(),
                balance_after: newUserBalance,
            });

        return NextResponse.json({
            message: 'Repayment successful!',
            newUserBalance,
            newLoanBalance,
        }, { status: 200 });

    } catch (error) {
        logger.error("Loan Repayment Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}