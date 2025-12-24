
import { NextResponse, type NextRequest } from 'next/server';
// Firebase removed - using Supabase
// Firebase removed - using Supabase
import { headers } from 'next/headers';
import { nigerianBanks } from '@/lib/banks';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id: batchId } = await params;
        let finalUserBalance = 0;

        // Fetch payroll batch and user from Supabase
        const { data: payrollRows, error: payrollError } = await supabaseAdmin?.from('payrollBatches').select('*').eq('id', batchId).limit(1) || { data: null, error: new Error('Supabase not available') };
        const payrollData = payrollRows && payrollRows.length > 0 ? payrollRows[0] : null;

        const { data: userRows, error: userError } = await supabaseAdmin?.from('users').select('*').eq('id', userId).limit(1) || { data: null, error: new Error('Supabase not available') };
        const userData = userRows && userRows.length > 0 ? userRows[0] : null;

        if (!payrollData || payrollData.userId !== userId) {
            throw new Error('Payroll batch not found or access denied.');
        }
        if (!userData) {
            throw new Error('User account not found.');
        }

        if (payrollData.status === 'Paid') {
            throw new Error('This payroll batch has already been paid.');
        }

        const totalSalaryKobo = (payrollData.employees || []).reduce((sum: number, emp: { salary: number; }) => sum + Math.round((emp.salary || 0) * 100), 0);

        if ((userData.balance || 0) < totalSalaryKobo) {
            throw new Error('Insufficient funds in your wallet to complete this payroll.');
        }

        // 1. Debit the total amount from the user's wallet
        const newBalance = (userData.balance || 0) - totalSalaryKobo;
        const { error: updateUserError } = await supabaseAdmin?.from('users').update({ balance: newBalance }).eq('id', userId) || { error: new Error('Supabase not available') };
        if (updateUserError) throw updateUserError;
        finalUserBalance = newBalance;

        // 2. Log each individual transaction in bulk
        const txRecords: any[] = [];
        (payrollData.employees || []).forEach((employee: any) => {
            const bankName = nigerianBanks.find((b) => b.code === employee.bankCode)?.name || 'Unknown Bank';
            const employeeSalaryKobo = Math.round((employee.salary || 0) * 100);
            txRecords.push({
                user_id: userId,
                category: 'payroll',
                type: 'debit',
                amount: employeeSalaryKobo,
                reference: `PAYROLL-${batchId}-${employee.accountNumber}`,
                narration: `Salary for ${payrollData.period} to ${employee.fullName}`,
                party: {
                    name: employee.fullName,
                    account: employee.accountNumber,
                    bank: bankName,
                },
                timestamp: new Date().toISOString(),
                balance_after: newBalance,
            });
        });

        if (txRecords.length > 0) {
            const { error: txInsertError } = await supabaseAdmin?.from('financial_transactions').insert(txRecords) || { error: new Error('Supabase not available') };
            if (txInsertError) throw txInsertError;
        }

        // 3. Update the payroll batch status
        const { error: updatePayrollError } = await supabaseAdmin?.from('payrollBatches').update({ status: 'Paid', paymentDate: new Date().toISOString() }).eq('id', batchId) || { error: new Error('Supabase not available') };
        if (updatePayrollError) throw updatePayrollError;
        
        return NextResponse.json({ message: "Payroll processed successfully!", newBalanceInKobo: finalUserBalance }, { status: 200 });

    } catch (error) {
        logger.error("Payroll Execution Error:", error);
        return NextResponse.json({ message: (error as Error).message }, { status: 400 });
    }
}
