
import { NextResponse, type NextRequest } from 'next/server';
// Firebase removed - using Supabase
// Firebase removed - using Supabase
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

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
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

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
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

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
    }
}
