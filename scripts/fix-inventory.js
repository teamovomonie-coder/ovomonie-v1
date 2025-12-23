const fs = require('fs');
const path = require('path');

const templates = {
  'locations': {
    get: `import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const { data: locations, error } = await supabaseAdmin
            .from('locations')
            .select('*');

        if (error) throw error;

        return NextResponse.json(locations || []);
    } catch (error) {
        logger.error("Error fetching locations: ", error);
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
            .from('locations')
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
        logger.error("Error creating location: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}`,
    put: `import { NextResponse, type NextRequest } from 'next/server';
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
            .from('locations')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        
        return NextResponse.json({ id, ...body });
    } catch (error) {
        logger.error("Error updating location: ", error);
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
            .from('locations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Location deleted' }, { status: 200 });
    } catch (error) {
        logger.error("Error deleting location: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}`
  }
};

// Fix all inventory routes
const routes = [
  'src/app/api/inventory/locations/route.ts',
  'src/app/api/inventory/products/route.ts',
  'src/app/api/inventory/products/[id]/route.ts',
  'src/app/api/inventory/suppliers/route.ts',
  'src/app/api/inventory/suppliers/[id]/route.ts'
];

routes.forEach(route => {
  const tableName = route.includes('products') ? 'products' : 
                   route.includes('suppliers') ? 'suppliers' : 'locations';
  
  const template = route.includes('[id]') ? 
    templates.locations.put.replace(/locations/g, tableName).replace(/location/g, tableName.slice(0, -1)) :
    templates.locations.get.replace(/locations/g, tableName).replace(/location/g, tableName.slice(0, -1));
  
  try {
    fs.writeFileSync(route, template);
    console.log(`Fixed: ${route}`);
  } catch (error) {
    console.error(`Error fixing ${route}:`, error.message);
  }
});

console.log('Inventory routes fixed!');