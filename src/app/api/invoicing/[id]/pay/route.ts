import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reqHeaders = request.headers as { get(name: string): string };
        const userId = getUserIdFromToken(reqHeaders);
        
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
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

        const { data: updatedInvoice, error: updateError } = await supabaseAdmin
            .from('invoices')
            .update({
                status: 'Paid',
                updated_at: new Date().toISOString()
            })
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
        logger.error("Error marking invoice as paid:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
