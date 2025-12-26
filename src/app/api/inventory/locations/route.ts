import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { inventoryService } from '@/lib/inventory-service';

export async function GET(request: NextRequest) {
  try {
    const locations = await inventoryService.getLocations();
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error('Locations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, manager } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const location = await inventoryService.createLocation({
      name,
      address,
      manager
    });

    if (!location) {
      return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: location });
  } catch (error) {
    console.error('Locations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}