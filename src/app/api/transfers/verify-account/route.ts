/**
 * Bank Account Verification API
 * Verifies bank account details using VFD API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { getVFDAccessToken } from '@/lib/vfd-auth';
import { logger } from '@/lib/logger';

/**
 * Check VFD API connectivity before processing verification
 */
async function checkVFDConnectivity(): Promise<void> {
  try {
    await getVFDAccessToken();
    logger.info('VFD API connectivity verified for account verification');
  } catch (error) {
    logger.error('VFD API connectivity failed for account verification', { error });
    throw new Error('Banking service is currently unavailable. Please try again later.');
  }
}

/**
 * Development fallback for account verification when VFD API fails
 */
function getDevFallbackAccount(accountNumber: string, bankCode: string) {
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) return null;
  
  // Mock accounts for development
  const mockAccounts = [
    { accountNumber: '0123456789', bankCode: '058', accountName: 'John Doe', bankName: 'GTBank' },
    { accountNumber: '9876543210', bankCode: '044', accountName: 'Jane Smith', bankName: 'Access Bank' },
    { accountNumber: '5555666677', bankCode: '057', accountName: 'Mike Johnson', bankName: 'Zenith Bank' },
    { accountNumber: '1111222233', bankCode: '011', accountName: 'Sarah Wilson', bankName: 'First Bank' },
    { accountNumber: '7777888899', bankCode: '033', accountName: 'David Brown', bankName: 'UBA' },
  ];
  
  return mockAccounts.find(acc => acc.accountNumber === accountNumber && acc.bankCode === bankCode);
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { ok: false, message: 'accountNumber and bankCode are required' },
        { status: 400 }
      );
    }

    // Check VFD API connectivity
    await checkVFDConnectivity();

    // Verify account via VFD API
    logger.info('Bank account verification via VFD API', { userId, accountNumber, bankCode });
    
    try {
      const verification = await vfdWalletService.verifyBankAccount({
        accountNumber,
        bankCode,
      });

      logger.info('Bank account verified', { userId, accountNumber, accountName: verification.accountName });

      return NextResponse.json({
        ok: true,
        data: verification,
      });
    } catch (vfdError: any) {
      // Development fallback when VFD API fails
      const fallbackAccount = getDevFallbackAccount(accountNumber, bankCode);
      if (fallbackAccount) {
        logger.warn('Using development fallback account', { accountNumber, accountName: fallbackAccount.accountName });
        return NextResponse.json({
          ok: true,
          data: {
            accountNumber: fallbackAccount.accountNumber,
            accountName: fallbackAccount.accountName,
            bankCode: fallbackAccount.bankCode,
            bankName: fallbackAccount.bankName,
          },
        });
      }
      
      // Re-throw the original error if no fallback available
      throw vfdError;
    }
  } catch (error: any) {
    logger.error('Bank account verification error', { 
      error: error.message,
      stack: error.stack,
      accountNumber,
      bankCode
    });
    
    // Provide more specific error messages
    let errorMessage = 'Account verification failed';
    if (error.message.includes('Invalid response from VFD API')) {
      errorMessage = 'Banking service returned invalid data. Please try again.';
    } else if (error.message.includes('Banking service is currently unavailable')) {
      errorMessage = error.message;
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { ok: false, message: errorMessage },
      { status: 500 }
    );
  }
}
