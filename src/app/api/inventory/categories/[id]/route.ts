import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const body = await _request.json();
        const { id } = await params;

        const { id: _bodyId, ...updateData } = body;
        const { error } = await supabaseAdmin
            .from('categories')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        
        return NextResponse.json({ id, ...body });
    } catch (error) {
        logger.error("Error updating category: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const { id } = await params;
        const { error } = await supabaseAdmin
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Category deleted' }, { status: 200 });
    } catch (error) {
        logger.error("Error deleting category: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}