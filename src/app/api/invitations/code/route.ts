import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

function getUserIdFromRequest(request: Request) {
  const userId = request.headers.get('x-ovo-user-id');
  if (userId) return userId;
  const url = new URL(request.url);
  if (url.searchParams.has('userId')) return url.searchParams.get('userId');
  return null;
}

export async function PATCH(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { referralCode } = body;
    if (!referralCode) return NextResponse.json({ message: 'referralCode required' }, { status: 400 });

    const { error } = await supabase
      .from('users')
      .update({ referral_code: referralCode })
      .eq('id', userId);

    if (error) {
      logger.error('Failed to update referral code:', error);
      return NextResponse.json({ message: 'Failed to update referral code' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Referral code updated' });
  } catch (err) {
    logger.error('Error updating referral code:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
