/**
 * VFD Banks List API Route
 * Returns list of all Nigerian banks for transfers
 */

import { NextResponse } from 'next/server';
import vfdWallet from '@/lib/vfd-wallet';

// Cache banks list for 24 hours
let cachedBanks: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    // Return cached data if still valid
    if (cachedBanks && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedBanks,
        cached: true
      });
    }

    // Fetch from VFD API
    const result = await vfdWallet.getBankList();

    if (!result.ok) {
      // Return fallback bank list if API fails
      return NextResponse.json({
        success: true,
        data: getFallbackBanks(),
        fallback: true
      });
    }

    // Cache the result
    cachedBanks = result.data || [];
    cacheTimestamp = Date.now();

    return NextResponse.json({
      success: true,
      data: cachedBanks
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    // Return fallback list on error
    return NextResponse.json({
      success: true,
      data: getFallbackBanks(),
      fallback: true
    });
  }
}

// Fallback list of popular Nigerian banks
function getFallbackBanks() {
  return [
    { code: '044', name: 'Access Bank' },
    { code: '023', name: 'Citibank Nigeria' },
    { code: '063', name: 'Diamond Bank' },
    { code: '050', name: 'Ecobank Nigeria' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '526', name: 'Parallex Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '101', name: 'Providus Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '100', name: 'Suntrust Bank' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' },
    { code: '999999', name: 'VFD Microfinance Bank' },
    { code: '090110', name: 'VFD Microfinance Bank (NIP)' },
    { code: '999991', name: 'Opay' },
    { code: '999992', name: 'PalmPay' },
    { code: '999993', name: 'Kuda Bank' },
    { code: '999994', name: 'Moniepoint' },
  ];
}
