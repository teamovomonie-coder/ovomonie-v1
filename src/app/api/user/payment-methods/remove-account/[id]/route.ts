import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_active: false })
      .eq('id', params.id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Account removed successfully' });
  } catch (error) {
    console.error('Error removing account:', error);
    return NextResponse.json(
      { message: 'Failed to remove account' },
      { status: 500 }
    );
  }
}
