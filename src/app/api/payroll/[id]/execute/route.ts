import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

<<<<<<< HEAD
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
=======
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
>>>>>>> origin/main
    }

    const { data: batch, error: fetchError } = await supabase
      .from('payroll_batches')
      .select(`*, employees:payroll_employees(*)`)
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !batch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }

    const totalAmount = batch.employees.reduce((sum: number, emp: any) => sum + parseFloat(emp.salary), 0);
    const totalInKobo = Math.round(totalAmount * 100);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.balance < totalInKobo) {
      return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
    }

    const { error: deductError } = await supabase
      .from('users')
      .update({ balance: user.balance - totalInKobo })
      .eq('id', userId);

    if (deductError) {
      logger.error('Error deducting balance:', deductError);
      return NextResponse.json({ message: 'Payment failed' }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from('payroll_batches')
      .update({ 
        status: 'Paid',
        payment_date: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      logger.error('Error updating batch status:', updateError);
      return NextResponse.json({ message: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Payment executed successfully' });
  } catch (error) {
    logger.error('Error executing payroll:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
