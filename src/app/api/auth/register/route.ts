import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/database';
import { withErrorHandler, AuthenticationError, ConflictError } from '@/lib/middleware/error-handler';
import { rateLimits } from '@/lib/middleware/rate-limit';
import { validateRequest, createUserSchema } from '@/lib/validation';
import { hashSecret } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { phoneToAccountNumber } from '@/lib/account-utils';

const generateReferralCode = (length: number = 6): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
    const rateLimitResponse = await rateLimits.auth(request);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validation = validateRequest(createUserSchema, body);
    if (!validation.success) {
        throw new AuthenticationError(validation.error);
    }

    const { phone, email, full_name, pin } = validation.data;

    // Check if user already exists
    const existingUser = await dbOperations.getUserByPhone(phone);
    if (existingUser) {
        throw new ConflictError('User already exists with this phone number');
    }

    const accountNumber = phoneToAccountNumber(phone);
    const referralCode = generateReferralCode();

    // Create VFD wallet in production
    if (process.env.NODE_ENV === 'production') {
        try {
            const { vfdWalletService } = await import('@/lib/vfd-wallet-service');
            await vfdWalletService.createWallet({
                customerId: accountNumber,
                customerName: full_name,
                email: email || '',
                phone: accountNumber,
            });
            logger.info('VFD wallet created', { accountNumber });
        } catch (vfdError) {
            logger.error('VFD wallet creation failed', { error: vfdError });
        }
    }

    const userId = await dbOperations.createUser({
        phone,
        email: email || undefined,
        full_name,
        account_number: accountNumber,
        referral_code: referralCode,
        balance: 0,
        kyc_tier: 0,
        is_agent: false,
        status: 'active',
        login_pin_hash: hashSecret(pin),
        transaction_pin_hash: hashSecret(pin), // Use same PIN for both initially
    });

    if (!userId) {
        throw new Error('Failed to create user account');
    }

    logger.info('User registered successfully', { userId, phone });

    return NextResponse.json({
        message: 'Registration successful!',
        userId,
        accountNumber,
    }, { status: 201 });
});
