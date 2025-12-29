import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { verifyAuthToken } from '@/lib/auth';

interface UserAccount {
    id?: string;
    userId: string;
    accountNumber: string;
    fullName: string;
    balance: number;
    referralCode?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountNumber: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      return NextResponse.json({ message: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      logger.warn('Empty token');
      return NextResponse.json({ message: 'Unauthorized - Empty token' }, { status: 401 });
    }
    
    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch (error) {
      logger.error('Token verification error:', error);
      return NextResponse.json({ message: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    
    if (!payload || !payload.sub) {
      logger.warn('Invalid token payload or missing user ID');
      return NextResponse.json({ message: 'Unauthorized - Invalid token payload' }, { status: 401 });
    }

    const senderUserId = payload.sub;
    logger.info('User authenticated:', senderUserId);

    if (!supabaseAdmin) {
      logger.error('Supabase admin not configured');
      return NextResponse.json({ message: 'Database not configured' }, { status: 500 });
    }

    const { data: senderData, error: senderError } = await supabaseAdmin
      .from('users')
      .select('id, status')
      .eq('id', senderUserId)
      .single();

    if (senderError) {
      logger.error('Database error fetching sender:', senderError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }
    
    if (!senderData) {
      logger.warn('Sender not found in database:', senderUserId);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (senderData.status?.toUpperCase() !== 'ACTIVE') {
      logger.warn('Inactive account:', senderUserId);
      return NextResponse.json({ message: 'Account suspended' }, { status: 403 });
    }

    const { accountNumber } = await params;
    if (!accountNumber) {
        return NextResponse.json({ message: 'Account number is required.' }, { status: 400 });
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ message: 'Invalid account number format' }, { status: 400 });
    }

    logger.info('Looking up user by account number:', accountNumber);

    const { data: userData, error } = await supabaseAdmin
        .from('users')
        .select('id, phone, full_name, account_number, balance, referral_code, status')
        .eq('account_number', accountNumber)
        .single();
    
    if (error) {
        logger.warn('Database error looking up account:', { accountNumber, error: error.message });
    }
    
    if (!userData) {
        logger.warn('User not found by account number:', accountNumber);
        return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
    }

    if (userData.status?.toUpperCase() !== 'ACTIVE') {
      return NextResponse.json({ message: 'Account is not active' }, { status: 400 });
    }
    
    const mappedUser: UserAccount = {
        id: userData.id,
        userId: userData.id,
        accountNumber: userData.account_number,
        fullName: userData.full_name,
        balance: userData.balance,
        referralCode: userData.referral_code || undefined,
    };
    
    return NextResponse.json(mappedUser);

  } catch (error) {
    logger.error("Error fetching user data:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}