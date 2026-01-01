import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { wealthService } from '@/lib/wealth-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');

    // Mock market data - in production, integrate with real APIs
    const marketData = {
      'NGN-BONDS': {
        symbol: 'NGN-BONDS',
        name: 'Nigerian Government Bonds',
        current_price: 100.50,
        change_24h: 0.005,
        change_percentage: '0.50%',
        volume_24h: 1500000000,
        market_cap: 25000000000000,
        last_updated: new Date().toISOString()
      },
      'NGX-INDEX': {
        symbol: 'NGX-INDEX',
        name: 'Nigerian Stock Exchange All-Share Index',
        current_price: 52847.32,
        change_24h: 0.012,
        change_percentage: '1.20%',
        volume_24h: 2300000000,
        market_cap: 28500000000000,
        last_updated: new Date().toISOString()
      },
      'BTC-NGN': {
        symbol: 'BTC-NGN',
        name: 'Bitcoin to Naira',
        current_price: 45250000,
        change_24h: -0.025,
        change_percentage: '-2.50%',
        volume_24h: 850000000,
        market_cap: 890000000000000,
        last_updated: new Date().toISOString()
      },
      'USD-NGN': {
        symbol: 'USD-NGN',
        name: 'US Dollar to Naira',
        current_price: 825.50,
        change_24h: 0.001,
        change_percentage: '0.10%',
        volume_24h: 5600000000,
        market_cap: null,
        last_updated: new Date().toISOString()
      },
      'GOLD-NGN': {
        symbol: 'GOLD-NGN',
        name: 'Gold per Ounce in Naira',
        current_price: 1650000,
        change_24h: 0.008,
        change_percentage: '0.80%',
        volume_24h: 125000000,
        market_cap: null,
        last_updated: new Date().toISOString()
      }
    };

    if (symbol) {
      const data = marketData[symbol as keyof typeof marketData];
      if (!data) {
        return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    // Return all market data
    return NextResponse.json(Object.values(marketData));
  } catch (error) {
    logger.error('Market data API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin endpoint to update market data
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, verify admin permissions
    await wealthService.updateMarketData();

    return NextResponse.json({ success: true, message: 'Market data updated' });
  } catch (error) {
    logger.error('Market data update error', { error });
    return NextResponse.json(
      { error: 'Failed to update market data' },
      { status: 500 }
    );
  }
}