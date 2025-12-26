import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { inventoryService } from '@/lib/inventory-service';

export async function GET(request: NextRequest) {
  try {
    const suppliers = await inventoryService.getSuppliers();
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Suppliers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contact_person, email, phone, address } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supplier = await inventoryService.createSupplier({
      name,
      contact_person,
      email,
      phone,
      address
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Suppliers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}