import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone } from '@/lib/db';
import { createAuthToken, verifySecret } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { withErrorHandler, AuthenticationError } from '@/lib/middleware/error-handler';
import { rateLimits } from '@/lib/middleware/rate-limit';
import { validateRequest, loginSchema } from '@/lib/validation';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimits.auth(request);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json();
  
  // Validate input
  const validation = validateRequest(loginSchema, body);
  if (!validation.success) {
    throw new AuthenticationError(validation.error);
  }

  const { phone, pin } = validation.data;

  // Normalize phone for lookup
  const phoneSanitized = String(phone).replace(/\s+/g, '');
  const user = await getUserByPhone(phoneSanitized);

  if (!user) {
    logger.info('Login attempt failed - user not found', { phone: phoneSanitized });
    throw new AuthenticationError('Invalid phone number or PIN.');
  }

  const providedPin = String(pin).trim();
  const isValid = verifySecret(providedPin, user.login_pin_hash || '');

  if (!isValid) {
    logger.info('Login attempt failed - invalid PIN', { 
      phone: phoneSanitized, 
      userId: user.id, 
      hasPin: !!user.login_pin_hash 
    });
    throw new AuthenticationError('Invalid phone number or PIN.');
  }

  const token = createAuthToken(user.id);
  
  logger.info('User logged in successfully', { userId: user.id, phone: phoneSanitized });

  return NextResponse.json({ 
    token, 
    userId: user.id, 
    fullName: user.full_name, 
    accountNumber: user.account_number 
  });
});
