import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { data: invoices, error } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = (invoices || []).map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            fromName: inv.from_name,
            fromAddress: inv.from_address,
            toName: inv.to_name,
            toEmail: inv.to_email,
            toAddress: inv.to_address,
            issueDate: inv.issue_date,
            dueDate: inv.due_date,
            lineItems: inv.line_items,
            notes: inv.notes,
            status: inv.status,
            client: inv.to_name
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        logger.error("Error fetching invoices:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const body = await request.json();

        if (!body.invoiceNumber || !body.toName) {
            return NextResponse.json({ message: 'Missing required invoice fields.' }, { status: 400 });
        }

        const newInvoice = {
            user_id: userId,
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
        };

        const { data: createdInvoice, error } = await supabaseAdmin
            .from('invoices')
            .insert(newInvoice)
            .select()
            .single();

        if (error) throw error;

        const mapped = {
            id: createdInvoice.id,
            invoiceNumber: createdInvoice.invoice_number,
            fromName: createdInvoice.from_name,
            fromAddress: createdInvoice.from_address,
            toName: createdInvoice.to_name,
            toEmail: createdInvoice.to_email,
            toAddress: createdInvoice.to_address,
            issueDate: createdInvoice.issue_date,
            dueDate: createdInvoice.due_date,
            lineItems: createdInvoice.line_items,
            notes: createdInvoice.notes,
            status: createdInvoice.status,
            client: createdInvoice.to_name
        };

        return NextResponse.json(mapped, { status: 201 });
    } catch (error) {
        logger.error("Error creating invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}