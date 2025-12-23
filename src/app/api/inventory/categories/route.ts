import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const { data: categories, error } = await supabaseAdmin
            .from('categories')
            .select('*');

        if (error) throw error;

        return NextResponse.json(categories || []);
    } catch (error) {
        logger.error("Error fetching categories: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const body = await request.json();
        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert({
                ...body,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        logger.error("Error creating category: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}