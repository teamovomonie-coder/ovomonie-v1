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
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json(invoices || []);
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
        const { clientReference, ...invoiceData } = body;

        if (!invoiceData.invoiceNumber || !invoiceData.toName) {
            return NextResponse.json({ message: 'Missing required invoice fields.' }, { status: 400 });
        }

        const newInvoice = {
            ...invoiceData,
            user_id: userId,
            client_reference: clientReference || null,
            issue_date: new Date(invoiceData.issueDate).toISOString(),
            due_date: new Date(invoiceData.dueDate).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data: createdInvoice, error } = await supabaseAdmin
            .from('invoices')
            .insert(newInvoice)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(createdInvoice, { status: 201 });
    } catch (error) {
        logger.error("Error creating invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}