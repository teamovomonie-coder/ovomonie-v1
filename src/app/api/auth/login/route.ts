import { NextResponse } from 'next/server';
import { getUserByPhone } from '@/lib/db';
import { createAuthToken, verifySecret } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { phone, pin } = await request.json();

    if (!phone || !pin) {
      return NextResponse.json({ message: 'Phone number and PIN are required.' }, { status: 400 });
    }

    // normalize phone for logging and lookup
    const phoneSanitized = String(phone).replace(/\s+/g, '');
    const user = await getUserByPhone(phoneSanitized);

    if (!user) {
      logger.info('Login attempt failed - user not found', { phone: phoneSanitized });
      return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
    }

    const providedPin = String(pin).trim();
    const isValid = verifySecret(providedPin, user.login_pin_hash || '');

    if (!isValid) {
      logger.info('Login attempt failed - invalid PIN', { phone: phoneSanitized, userId: user.id, hasPin: !!user.login_pin_hash });
      return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
    }

    const token = createAuthToken(user.id);

    return NextResponse.json({ 
      token, 
      userId: user.id, 
      fullName: user.full_name, 
      accountNumber: user.account_number 
    });

  } catch (error) {
    logger.error("Login Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
