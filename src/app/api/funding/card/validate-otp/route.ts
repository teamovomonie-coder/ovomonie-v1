import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { validateOtp } from '@/lib/vfd';
import { userService, transactionService, notificationService } from '@/lib/db';
import { executeVFDTransaction } from '@/lib/balance-sync';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        
        let userId: string | null = null;
        try {
            userId = getUserIdFromToken(reqHeaders);
        } catch (authError) {
            logger.error('Auth error in validate-otp', { error: authError });
            return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
        }
        
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { reference, otp } = body;

        if (!reference || !otp) {
            return NextResponse.json({ message: 'Reference and OTP are required' }, { status: 400 });
        }

        logger.info('Validating OTP', { reference, userId });

        let pendingPayment = null;
        if (supabaseAdmin) {
            const { data, error } = await supabaseAdmin
                .from('pending_payments')
                .select('*')
                .eq('reference', reference)
                .eq('user_id', userId)
                .single();
            
            if (error) {
                logger.error('Failed to fetch pending payment', { error, reference });
            } else {
                pendingPayment = data;
            }
        }

        if (!pendingPayment) {
            return NextResponse.json({ message: 'Pending payment not found' }, { status: 404 });
        }

        const validation = await validateOtp(otp, reference);

        if (!validation.ok) {
            logger.error('OTP validation failed', { 
                status: validation.status, 
                message: validation.data?.message 
            });
            return NextResponse.json({ 
                message: validation.data?.message || 'OTP validation failed'
            }, { status: validation.status || 400 });
        }

        const responseData = validation.data?.data || validation.data;
        const serviceCode = responseData?.serviceResponseCodes || responseData?.status;

        if (serviceCode === 'COMPLETED' || serviceCode === '00') {
            const user = await userService.getById(userId);
            const amountInKobo = pendingPayment.amount;
            
            const newBalance = await executeVFDTransaction(
                userId,
                user?.account_number || '',
                async () => {},
                amountInKobo,
                'credit'
            );

            await transactionService.create({
                user_id: userId,
                type: 'credit',
                category: 'deposit',
                amount: amountInKobo,
                reference,
                narration: 'Card deposit via VFD',
                party_name: 'VFD Card',
                balance_after: newBalance,
            });

            await notificationService.create({
                user_id: userId,
                title: 'Wallet Funded',
                body: `You successfully added ₦${(amountInKobo / 100).toLocaleString()} to your wallet.`,
                category: 'transaction',
                type: 'credit',
                amount: amountInKobo,
                reference,
            });

            if (supabaseAdmin) {
                await supabaseAdmin.from('pending_payments').delete().eq('reference', reference);
            }

            return NextResponse.json({ 
                message: 'Payment completed successfully', 
                newBalanceInKobo: newBalance,
                reference
            }, { status: 200 });
        }

        logger.warn('OTP validated but payment not completed', { serviceCode, reference });
        return NextResponse.json({ 
            message: responseData?.narration || 'Payment verification in progress',
            status: serviceCode
        }, { status: 200 });

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error('validate-otp error', { message: errorMessage, error: err });
        
        return NextResponse.json({ 
            message: errorMessage || 'An internal server error occurred.'
        }, { status: 500 });
    }
}
