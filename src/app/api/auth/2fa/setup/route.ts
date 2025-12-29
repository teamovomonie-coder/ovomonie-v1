import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import * as crypto from 'crypto';

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[crypto.randomInt(0, chars.length)];
  }
  return secret;
}

function generateQRCode(email: string, secret: string): string {
  const issuer = 'Ovomonie';
  const otpauth = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
}

export async function POST() {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user) {
      logger.error('Failed to fetch user', { userId, error });
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const secret = generateSecret();
    const qrCode = generateQRCode(user.email, secret);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ two_factor_secret: secret })
      .eq('id', userId);

    if (updateError) {
      logger.error('Failed to save 2FA secret', { userId, error: updateError });
      return NextResponse.json({ message: 'Failed to setup 2FA' }, { status: 500 });
    }

    return NextResponse.json({ qrCode, secret });
  } catch (error) {
    logger.error('Error in 2FA setup', { error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
