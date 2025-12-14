import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface UserAccount {
    id?: string;
    userId: string;
    accountNumber: string;
    fullName: string;
    balance: number; // in kobo
    referralCode?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountNumber: string }> }
) {
  try {
    const { accountNumber } = await params;
    if (!accountNumber) {
        return NextResponse.json({ message: 'Account number is required.' }, { status: 400 });
    }

    if (!supabase) {
        return NextResponse.json({ message: 'Database not configured' }, { status: 500 });
    }

    // Query Supabase for user by account number
    const { data: userData, error } = await supabase
        .from('users')
        .select('id, phone, full_name, account_number, balance, referral_code')
        .eq('account_number', accountNumber)
        .single();
    
    if (error || !userData) {
        logger.warn('User not found by account number:', accountNumber, error);
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    
    // Map Supabase column names to frontend expected format
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
