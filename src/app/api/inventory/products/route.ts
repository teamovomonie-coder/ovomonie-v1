import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { inventoryService } from '@/lib/inventory-service';

export async function GET(request: NextRequest) {
  try {
    const products = await inventoryService.getProducts();
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, sku, category_id, supplier_id, unit_price, cost_price, reorder_level } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const product = await inventoryService.createProduct({
      name,
      description,
      sku,
      category_id,
      supplier_id,
      unit_price: unit_price ? parseFloat(unit_price) : 0,
      cost_price: cost_price ? parseFloat(cost_price) : 0,
      reorder_level: reorder_level ? parseInt(reorder_level) : 0
    });

    if (!product) {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}