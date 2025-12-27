import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { inventoryService } from '@/lib/inventory-service';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const transactions = await inventoryService.getTransactions(limit);
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Inventory transactions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}