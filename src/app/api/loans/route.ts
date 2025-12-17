import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import { vfdLoansService } from '@/lib/vfd-loans-service';
import { vfdMandateService } from '@/lib/vfd-mandate-service';
import { db, transactionService, notificationService, userService } from '@/lib/db';





export async function GET(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const loanId = searchParams.get('loanId');

        if (loanId) {
            const loan = await vfdLoansService.getLoanDetails(loanId);
            return NextResponse.json({ ok: true, data: loan });
        }

        const history = await vfdLoansService.getLoanHistory(userId);
        return NextResponse.json({ ok: true, data: history });

    } catch (error) {
        logger.error('Error fetching loans:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch loans';
        return NextResponse.json({ ok: false, message }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { amount, tenure, purpose, reference, accountNumber, bankCode } = await request.json();
        
        if (!amount || !tenure || !purpose || !reference || !accountNumber || !bankCode) {
            return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
        }

        const existing = await transactionService.getByReference(reference);
        if (existing) {
            return NextResponse.json({ ok: false, message: 'Loan already applied' }, { status: 400 });
        }

        // Apply for loan
        const loan = await vfdLoansService.applyForLoan({
            customerId: userId,
            amount: String(amount),
            tenure,
            purpose,
            reference,
        });

        // Create mandate for automatic repayment
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + tenure);

        const mandate = await vfdMandateService.createMandate({
            customerId: userId,
            accountNumber,
            bankCode,
            amount: loan.monthlyRepayment,
            frequency: 'MONTHLY',
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            reference: `${reference}-mandate`,
            narration: `Loan repayment for ${loan.loanId}`,
        });

        // Log loan transaction
        await transactionService.create({
            user_id: userId,
            reference,
            type: 'credit',
            category: 'loan',
            amount: Number(amount) * 100,
            narration: `Loan disbursement - ${purpose}`,
            party: { loanId: loan.loanId },
            balance_after: 0,
            status: 'completed',
            metadata: { 
                loanId: loan.loanId, 
                tenure, 
                interestRate: loan.interestRate,
                mandateId: mandate.mandateId,
            },
        });

        await notificationService.create({
            user_id: userId,
            title: 'Loan Approved',
            body: `Your loan of ₦${amount.toLocaleString()} has been approved. A mandate has been set up for automatic monthly repayment.`,
            category: 'loan',
            reference,
        });

        return NextResponse.json({ 
            ok: true, 
            data: { 
                loan, 
                mandate: {
                    mandateId: mandate.mandateId,
                    monthlyRepayment: loan.monthlyRepayment,
                    frequency: 'MONTHLY',
                },
            },
        });

    } catch (error) {
        logger.error('Loan application error:', error);
        const message = error instanceof Error ? error.message : 'Loan application failed';
        return NextResponse.json({ ok: false, message }, { status: 500 });
    }
}
