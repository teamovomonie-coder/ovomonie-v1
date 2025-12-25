import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
