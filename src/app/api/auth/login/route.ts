import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone } from '@/lib/db';
import { createAuthToken, verifySecret } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { withErrorHandler, AuthenticationError } from '@/lib/middleware/error-handler';
import { rateLimits } from '@/lib/middleware/rate-limit';
import { validateRequest, loginSchema } from '@/lib/validation';
import { pinRateLimiter } from '@/lib/middleware/pin-rate-limiter';

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
  
  // Check if account is locked
  const lockoutCheck = pinRateLimiter.checkLockout(phoneSanitized, 'login');
  if (lockoutCheck) return lockoutCheck;
  
  const user = await getUserByPhone(phoneSanitized);

  if (!user) {
    logger.info('Login attempt failed - user not found', { phone: phoneSanitized });
    throw new AuthenticationError('Invalid phone number or PIN.');
  }

  const providedPin = String(pin).trim();
  const isValid = verifySecret(providedPin, user.login_pin_hash || '');

  if (!isValid) {
    const result = pinRateLimiter.recordFailure(phoneSanitized, 'login');
    
    logger.info('Login attempt failed - invalid PIN', { 
      phone: phoneSanitized, 
      userId: user.id, 
      hasPin: !!user.login_pin_hash,
      remainingAttempts: result.remainingAttempts
    });
    
    if (result.locked) {
      return NextResponse.json(
        { message: 'Too many failed attempts. Account locked for 30 minutes.' },
        { status: 429 }
      );
    }
    
    throw new AuthenticationError(
      `Invalid phone number or PIN. ${result.remainingAttempts} attempt(s) remaining.`
    );
  }

  // Success - reset failure counter
  pinRateLimiter.recordSuccess(phoneSanitized, 'login');
  const token = createAuthToken(user.id);
  
  logger.info('User logged in successfully', { userId: user.id, phone: phoneSanitized });

  return NextResponse.json({ 
    token, 
    userId: user.id, 
    fullName: user.full_name, 
    accountNumber: user.account_number 
  });
});
