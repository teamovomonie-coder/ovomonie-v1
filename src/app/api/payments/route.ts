import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

// Vercel serverless function configuration
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken(request.headers);
        
        if (!userId) {
            return NextResponse.json({ message: 'User not found' }, { status: 401 });
        }

        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const body = await request.json();
        const { amount, category, party, narration, clientReference } = body;
        
        // Validation
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'A valid amount is required.' }, { status: 400 });
        }
        if (!category || !party || !clientReference) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }

        // Check for duplicate transaction
        const { data: existingTxn } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('reference', clientReference)
            .single();
        
        if (existingTxn) {
            return NextResponse.json({ message: 'Transaction already exists' }, { status: 400 });
        }

        // Get user balance
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();
        
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const amountInKobo = Math.round(amount * 100);
        
        if (user.balance < amountInKobo) {
            return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
        }

        // Process with VFD (simulate service delivery)
        const vfdResponse = await processVFDService(category, party, amount);
        
        if (!vfdResponse.success) {
            return NextResponse.json({ message: 'Service delivery failed' }, { status: 500 });
        }

        // Update user balance
        const newBalance = user.balance - amountInKobo;
        await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userId);
        
        // Create transaction record (primary insert; fallback if schema mismatch)
        let transaction: any = null;
        let txError: any = null;

        const insertPayload: any = {
            user_id: userId,
            reference: clientReference,
            type: 'debit',
            amount: amountInKobo,
            narration: narration || `${category} for ${party.billerId}`,
            // use JSONB `party` column as per schema
            party: {
                name: party?.name,
                billerId: party?.billerId,
                planName: party?.planName
            },
            balance_after: newBalance,
            category: category,
            // Note: status column doesn't exist in financial_transactions schema
            // Transaction is considered completed once inserted
            metadata: {
                service_type: category,
                recipient: party.billerId,
                network: party.name,
                plan_name: party.planName,
                vfd_reference: vfdResponse.success && 'reference' in vfdResponse ? vfdResponse.reference : undefined,
                phoneNumber: party.billerId,
                platform: party.name,
                accountId: party.billerId,
                status: 'completed', // Store status in metadata instead
            }
        };

        try {
            const res = await supabaseAdmin
                .from('financial_transactions')
                .insert(insertPayload)
                .select('id')
                .single();
            transaction = res.data;
            txError = res.error;
        } catch (e) {
            logger.error('Transaction insert exception:', e);
            txError = e;
        }

        if (txError || !transaction) {
            logger.info('Primary transaction insert failed — attempting fallback without `metadata`.');
            const fallbackPayload: any = { ...insertPayload };
            delete (fallbackPayload as any).metadata;

            try {
                const res2 = await supabaseAdmin
                    .from('financial_transactions')
                    .insert(fallbackPayload)
                    .select('id')
                    .single();
                transaction = res2.data;
                txError = res2.error;
            } catch (e) {
                logger.error('Fallback transaction insert failed:', e);
                txError = e;
            }
        }

        if (txError || !transaction) {
            logger.error('Transaction creation failed:', txError);
            const payload: any = { message: 'Transaction recording failed' };
            if (process.env.NODE_ENV === 'development') {
                try {
                    payload.error = typeof txError === 'object' ? JSON.parse(JSON.stringify(txError)) : String(txError);
                } catch (e) {
                    payload.error = String(txError);
                }
            }
            return NextResponse.json(payload, { status: 500 });
        }

        // Save receipt to new receipt system using direct service call
        // Disabled for now due to foreign key constraint issues
        /*
        try {
          const { receiptService } = await import('@/lib/receipt-service');
          const templateType = category === 'betting' ? 'betting' : category === 'airtime' || category === 'data' ? 'airtime' : 'utility';
          
          const receiptData = {
            platform: category === 'betting' ? party.name : undefined,
            accountId: category === 'betting' ? party.billerId : undefined,
            network: category === 'airtime' || category === 'data' ? party.name : undefined,
            phoneNumber: category === 'airtime' || category === 'data' ? party.billerId : undefined,
            planName: category === 'data' ? party.planName : undefined,
            biller: category !== 'betting' && category !== 'airtime' && category !== 'data' ? party.name : undefined,
            amount: amountInKobo / 100,
            transactionId: clientReference,
            completedAt: new Date().toISOString(),
          };
          
          const receiptId = await receiptService.saveReceipt(
            userId,
            transaction.id,
            clientReference,
            templateType,
            receiptData
          );
          
          if (receiptId) {
            console.log(`[Payments API] Receipt saved with ID: ${receiptId} for payment: ${clientReference}`);
          } else {
            console.warn(`[Payments API] Failed to save receipt for payment: ${clientReference} - receipt tables may not exist`);
          }
        } catch (receiptError) {
          console.error('[Payments API] Receipt save error:', receiptError);
          // Don't fail the payment if receipt saving fails
        }
        */

        // Send notification
        await sendTransactionNotification(userId, transaction.id, category, amount, party);

        // Return transaction details for receipt navigation
        // Include both ID and reference so processing page can poll status
        return NextResponse.json({
            success: true,
            transaction_id: transaction.id,
            reference: clientReference,
            data: {
                reference: clientReference,
                transactionId: transaction.id,
            },
            message: 'Payment successful',
            newBalanceInKobo: newBalance
        });

    } catch (error: any) {
        logger.error('Payment processing error:', error);
        return NextResponse.json({ 
            message: 'Payment processing failed',
            error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined 
        }, { status: 500 });
    }
}

// VFD Service Processing
async function processVFDService(category: string, party: any, amount: number) {
    try {
        // Simulate VFD API call based on service type
        const vfdEndpoint = getVFDEndpoint(category);
        const payload = buildVFDPayload(category, party, amount);
        
        // Mock VFD response for now - replace with actual VFD API call
        const response = {
            success: true,
            reference: `VFD_${Date.now()}`,
            status: 'completed',
            service_delivered: true
        };
        
        return response;
    } catch (error) {
        logger.error('VFD service error:', error);
        return { success: false, error: 'Service delivery failed' };
    }
}

function getVFDEndpoint(category: string): string | undefined {
    const endpoints: Record<string, string | undefined> = {
        'airtime': process.env.VFD_AIRTIME_API_BASE,
        'data': process.env.VFD_DATA_API_BASE,
        'utility': process.env.VFD_BILLS_API_BASE,
        'cable tv': process.env.VFD_BILLS_API_BASE,
        'betting': process.env.VFD_BILLS_API_BASE
    };
    return endpoints[category] || process.env.VFD_BILLS_API_BASE;
}

function buildVFDPayload(category: string, party: any, amount: number) {
    return {
        service_type: category,
        recipient: party.billerId,
        amount: amount,
        network: party.name,
        plan: party.planName
    };
}

// Notification Service
async function sendTransactionNotification(userId: string, transactionId: string, category: string, amount: number, party: any) {
    try {
        if (!supabaseAdmin) {
            logger.warn('Supabase admin not available, skipping notification');
            return;
        }
        await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Purchase Successful`,
            message: `₦${amount.toLocaleString()} ${category} for ${party.billerId} completed successfully`,
            type: 'transaction',
            metadata: { transaction_id: transactionId },
            read: false
        });
    } catch (error) {
        logger.error('Notification creation failed:', error);
    }
}