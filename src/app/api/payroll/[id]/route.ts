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
        const { id } = await params;
        const { data: rows, error } = await supabaseAdmin?.from('payrollBatches').select('*').eq('id', id).limit(1) || { data: null, error: new Error('Supabase not available') };
        const row = rows && rows.length > 0 ? rows[0] : null;
        if (!row || row.userId !== userId) {
            return NextResponse.json({ message: 'Payroll batch not found or access denied' }, { status: 404 });
        }

        const data = { ...row, id } as any;
        if (data.paymentDate) {
            data.paymentDate = new Date(data.paymentDate);
        }

        return NextResponse.json(data);
    } catch (error) {
        logger.error("Error fetching payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
=======
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
>>>>>>> origin/main
    }

    const body = await request.json();
    const { employees, ...batchData } = body;

<<<<<<< HEAD
        const body = await request.json();
        const { id } = await params;
        const { data: rows, error } = await supabaseAdmin?.from('payrollBatches').select('*').eq('id', id).limit(1) || { data: null, error: new Error('Supabase not available') };
        const row = rows && rows.length > 0 ? rows[0] : null;

        if (!row || row.userId !== userId) {
            return NextResponse.json({ message: 'Payroll batch not found or access denied' }, { status: 404 });
        }

        const { id: _bodyId, ...updateData } = body;
        const { error: updateError } = await supabaseAdmin?.from('payrollBatches').update({
            ...updateData,
            updatedAt: new Date().toISOString(),
        }).eq('id', id) || { error: new Error('Supabase not available') };
        if (updateError) throw updateError;

        const { data: updatedRows } = await supabaseAdmin?.from('payrollBatches').select('*').eq('id', id).limit(1) || { data: null };
        const updated = updatedRows && updatedRows.length > 0 ? updatedRows[0] : null;
        return NextResponse.json({ id, ...updated });
    } catch (error) {
        logger.error("Error updating payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
=======
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
>>>>>>> origin/main
    }

    await supabase.from('payroll_employees').delete().eq('batch_id', params.id);

<<<<<<< HEAD
        const { id } = await params;
        const { data: rows, error } = await supabaseAdmin?.from('payrollBatches').select('*').eq('id', id).limit(1) || { data: null, error: new Error('Supabase not available') };
        const row = rows && rows.length > 0 ? rows[0] : null;

        if (!row || row.userId !== userId) {
            return NextResponse.json({ message: 'Payroll batch not found or access denied' }, { status: 404 });
        }

        // You might want to restrict deletion to only 'Draft' batches
        if (row.status !== 'Draft') {
            return NextResponse.json({ message: 'Cannot delete a processed payroll batch.' }, { status: 403 });
        }

        const { error: deleteError } = await supabaseAdmin?.from('payrollBatches').delete().eq('id', id) || { error: new Error('Supabase not available') };
        if (deleteError) throw deleteError;
        return NextResponse.json({ message: 'Payroll batch deleted successfully' }, { status: 200 });
    } catch (error) {
        logger.error("Error deleting payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
=======
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
>>>>>>> origin/main
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
