import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: batches, error } = await supabase
      .from('payroll_batches')
      .select(`
        *,
        employees:payroll_employees(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching payroll batches:', error);
      return NextResponse.json({ message: 'Failed to fetch batches' }, { status: 500 });
    }

    const formatted = (batches || []).map(batch => ({
      id: batch.id,
      groupName: batch.group_name,
      period: batch.period,
      status: batch.status,
      paymentDate: batch.payment_date,
      employees: (batch.employees || []).map((emp: any) => ({
        id: emp.id,
        fullName: emp.full_name,
        bankCode: emp.bank_code,
        accountNumber: emp.account_number,
        salary: parseFloat(emp.salary),
        isVerified: emp.is_verified
      }))
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    logger.error('Error in payroll GET:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employees, ...batchData } = body;

    const { data: batch, error: batchError } = await supabase
      .from('payroll_batches')
      .insert({
        user_id: userId,
        group_name: batchData.groupName,
        period: batchData.period,
        status: 'Draft'
      })
      .select()
      .single();

    if (batchError) {
      logger.error('Error creating batch:', batchError);
      return NextResponse.json({ message: 'Failed to create batch' }, { status: 500 });
    }

    if (employees && employees.length > 0) {
      const employeeRecords = employees.map((emp: any) => ({
        batch_id: batch.id,
        full_name: emp.fullName,
        bank_code: emp.bankCode,
        account_number: emp.accountNumber,
        salary: emp.salary,
        is_verified: emp.isVerified || false
      }));

      const { error: empError } = await supabase
        .from('payroll_employees')
        .insert(employeeRecords);

      if (empError) {
        logger.error('Error creating employees:', empError);
        await supabase.from('payroll_batches').delete().eq('id', batch.id);
        return NextResponse.json({ message: 'Failed to create employees' }, { status: 500 });
      }
    }

    const { data: fullBatch } = await supabase
      .from('payroll_batches')
      .select(`*, employees:payroll_employees(*)`)
      .eq('id', batch.id)
      .single();

    return NextResponse.json({
      id: fullBatch.id,
      groupName: fullBatch.group_name,
      period: fullBatch.period,
      status: fullBatch.status,
      employees: (fullBatch.employees || []).map((emp: any) => ({
        id: emp.id,
        fullName: emp.full_name,
        bankCode: emp.bank_code,
        accountNumber: emp.account_number,
        salary: parseFloat(emp.salary),
        isVerified: emp.is_verified
      }))
    }, { status: 201 });
  } catch (error) {
    logger.error('Error in payroll POST:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
