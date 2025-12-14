import { createClient } from '@supabase/supabase-js';
import { hashSecret } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate a unique referral code
const generateReferralCode = (length: number = 6): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, phone, loginPin, confirmLoginPin, fullName, transactionPin, confirmTransactionPin } = body;

        if (!email || !phone || !loginPin || !fullName || !transactionPin) {
            return NextResponse.json({ message: 'Missing required fields for registration.' }, { status: 400 });
        }

        if (confirmLoginPin && String(confirmLoginPin) !== String(loginPin)) {
            return NextResponse.json({ message: 'Login PIN confirmation does not match.' }, { status: 400 });
        }
        if (confirmTransactionPin && String(confirmTransactionPin) !== String(transactionPin)) {
            return NextResponse.json({ message: 'Transaction PIN confirmation does not match.' }, { status: 400 });
        }

        // Check if user already exists with the same email or phone
        const [emailCheck, phoneCheck] = await Promise.all([
            supabase.from('users').select('id').eq('email', email).limit(1),
            supabase.from('users').select('id').eq('phone', phone).limit(1)
        ]);

        if (emailCheck.data && emailCheck.data.length > 0) {
            return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
        }
        if (phoneCheck.data && phoneCheck.data.length > 0) {
            return NextResponse.json({ message: 'An account with this phone number already exists.' }, { status: 409 });
        }

        // Generate account number by reversing the last 10 digits of the phone number
        const lastTenDigits = phone.slice(-10);
        const accountNumber = lastTenDigits.split('').reverse().join('');
        const referralCode = generateReferralCode();

        // Create new user document in Supabase
        const { data, error } = await supabase.from('users').insert({
            email,
            phone,
            full_name: fullName,
            account_number: accountNumber,
            referral_code: referralCode,
            login_pin_hash: hashSecret(String(loginPin)),
            transaction_pin_hash: hashSecret(String(transactionPin)),
            balance: 0,
        }).select().single();

        if (error) {
            logger.error("Supabase Registration Error:", error);
            return NextResponse.json({ message: 'Failed to create user account.' }, { status: 500 });
        }
        
        return NextResponse.json({ message: 'Registration successful!', userId: data.id }, { status: 201 });

    } catch (error) {
        logger.error("Registration Error:", error);
        let errorMessage = 'An internal server error occurred.';
        if (error instanceof Error) {
            errorMessage = `An internal server error occurred: ${error.message}`;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
