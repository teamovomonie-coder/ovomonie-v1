import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employees, ...batchData } = body;

    const { error: updateError } = await supabase
      .from('payroll_batches')
      .update({
        group_name: batchData.groupName,
        period: batchData.period,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', userId);

    if (updateError) {
      logger.error('Error updating batch:', updateError);
      return NextResponse.json({ message: 'Failed to update batch' }, { status: 500 });
    }

    await supabase.from('payroll_employees').delete().eq('batch_id', params.id);

    if (employees && employees.length > 0) {
      const employeeRecords = employees.map((emp: any) => ({
        batch_id: params.id,
        full_name: emp.fullName,
        bank_code: emp.bankCode,
        account_number: emp.accountNumber,
        salary: emp.salary,
        is_verified: emp.isVerified || false
      }));

      await supabase.from('payroll_employees').insert(employeeRecords);
    }

    const { data: fullBatch } = await supabase
      .from('payroll_batches')
      .select(`*, employees:payroll_employees(*)`)
      .eq('id', params.id)
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
    });
  } catch (error) {
    logger.error('Error in payroll PUT:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
