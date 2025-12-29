import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { inventoryService } from '@/lib/inventory-service';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers) || 'dev-user-fallback';

    const body = await request.json();
    const { product_id, location_id, quantity, unit_price, reference } = body;

    if (!product_id || !location_id || !quantity || !unit_price) {
      return NextResponse.json({ error: 'Product ID, location ID, quantity, and unit price are required' }, { status: 400 });
    }

    const success = await inventoryService.recordSale(
      product_id,
      location_id,
      parseInt(quantity),
      parseFloat(unit_price),
      userId,
      reference
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Sale recorded successfully' });
  } catch (error) {
    console.error('Stock sale error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}