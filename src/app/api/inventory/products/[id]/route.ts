import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { inventoryService } from '@/lib/inventory-service';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const success = await inventoryService.updateProduct(params.id, body);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await inventoryService.deleteProduct(params.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}