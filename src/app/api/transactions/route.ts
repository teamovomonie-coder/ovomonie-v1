import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { transactionService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    const transactions = await transactionService.getByUserId(
      userId, 
      limit, 
      category && category !== 'all' ? category : undefined
    );

    return NextResponse.json({ success: true, data: transactions || [] });
  } catch (error) {
    console.error('Transactions error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
