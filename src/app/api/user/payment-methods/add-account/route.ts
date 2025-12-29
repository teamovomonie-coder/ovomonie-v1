import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VFD_API_URL = process.env.VFD_API_URL || 'https://api-devapps.vfdbank.systems';
const VFD_API_KEY = process.env.VFD_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bankName, accountNumber, accountName } = body;

    if (!bankName || !accountNumber) {
      return NextResponse.json(
        { message: 'Bank name and account number are required' },
        { status: 400 }
      );
    }

    // Skip VFD verification for now in dev mode
    const verifiedAccountName = accountName || 'Account Holder';

    // Save to Supabase
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: userId,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: verifiedAccountName,
        is_active: true,
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json({
      message: 'Bank account linked successfully',
      account: data,
    });
  } catch (error) {
    console.error('Error adding bank account:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to add bank account' },
      { status: 500 }
    );
  }
}

function getBankCode(bankName: string): string {
  const bankCodes: Record<string, string> = {
    'Access Bank': '044',
    'GTBank': '058',
    'First Bank': '011',
    'UBA': '033',
    'Zenith Bank': '057',
    'Fidelity Bank': '070',
    'Union Bank': '032',
    'Sterling Bank': '232',
    'Stanbic IBTC': '221',
    'Polaris Bank': '076',
    'Wema Bank': '035',
    'Ecobank': '050',
    'FCMB': '214',
    'Keystone Bank': '082',
  };
  return bankCodes[bankName] || '000';
}
