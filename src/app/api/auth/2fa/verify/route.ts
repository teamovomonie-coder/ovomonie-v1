import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import * as crypto from 'crypto';

function base32Decode(encoded: string): Buffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = [];
  
  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i].toUpperCase();
    const index = chars.indexOf(char);
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return Buffer.from(output);
}

function verifyTOTP(secret: string, token: string): boolean {
  const window = 1;
  const time = Math.floor(Date.now() / 1000 / 30);
  
  for (let i = -window; i <= window; i++) {
    const calculatedToken = generateTOTP(secret, time + i);
    if (calculatedToken === token) {
      return true;
    }
  }
  return false;
}

function generateTOTP(secret: string, time: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(time));
  
  const decodedSecret = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', decodedSecret);
  hmac.update(buffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const binary = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code || code.length !== 6) {
      return NextResponse.json({ message: 'Invalid code format' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('two_factor_secret')
      .eq('id', userId)
      .single();

    if (error || !user?.two_factor_secret) {
      logger.error('Failed to fetch user 2FA secret', { userId, error });
      return NextResponse.json({ message: 'Setup not found' }, { status: 404 });
    }

    const isValid = verifyTOTP(user.two_factor_secret, code);
    if (!isValid) {
      return NextResponse.json({ message: 'Invalid verification code' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ two_factor_enabled: true })
      .eq('id', userId);

    if (updateError) {
      logger.error('Failed to enable 2FA', { userId, error: updateError });
      return NextResponse.json({ message: 'Failed to enable 2FA' }, { status: 500 });
    }

    return NextResponse.json({ message: '2FA enabled successfully' });
  } catch (error) {
    logger.error('Error in 2FA verification', { error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
