import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reqHeaders = request.headers as { get(name: string): string };
        const userId = getUserIdFromToken(reqHeaders);
        
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const body = await request.json();
        const { id } = await params;

        const { data: invoice, error: fetchError } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !invoice) {
            return NextResponse.json({ message: 'Invoice not found or access denied' }, { status: 404 });
        }
        
        const updateData = {
            invoice_number: body.invoiceNumber,
            from_name: body.fromName,
            from_address: body.fromAddress || null,
            to_name: body.toName,
            to_email: body.toEmail || null,
            to_address: body.toAddress || null,
            issue_date: new Date(body.issueDate).toISOString(),
            due_date: new Date(body.dueDate).toISOString(),
            line_items: body.lineItems || [],
            notes: body.notes || null,
            status: body.status || 'Draft',
            updated_at: new Date().toISOString()
        };

        const { data: updatedInvoice, error: updateError } = await supabaseAdmin
            .from('invoices')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        const mapped = {
            id: updatedInvoice.id,
            invoiceNumber: updatedInvoice.invoice_number,
            fromName: updatedInvoice.from_name,
            fromAddress: updatedInvoice.from_address,
            toName: updatedInvoice.to_name,
            toEmail: updatedInvoice.to_email,
            toAddress: updatedInvoice.to_address,
            issueDate: updatedInvoice.issue_date,
            dueDate: updatedInvoice.due_date,
            lineItems: updatedInvoice.line_items,
            notes: updatedInvoice.notes,
            status: updatedInvoice.status,
            client: updatedInvoice.to_name
        };

        return NextResponse.json(mapped);
    } catch (error) {
        logger.error("Error updating invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reqHeaders = request.headers as { get(name: string): string };
        const userId = getUserIdFromToken(reqHeaders);
        
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data: invoice, error: fetchError } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !invoice) {
            return NextResponse.json({ message: 'Invoice not found or access denied' }, { status: 404 });
        }

        const { error: deleteError } = await supabaseAdmin
            .from('invoices')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
    } catch (error) {
        logger.error("Error deleting invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}