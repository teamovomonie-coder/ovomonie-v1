import { logger } from './logger';
import { serverEnv } from './env.server';

const VFD_BASE_URL = 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';
const VFD_TOKEN_URL = 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token';

interface VFDCardResponse {
  success: boolean;
  data?: {
    cardId: string;
    maskedPan: string;
    expiryMonth: string;
    expiryYear: string;
    cardName: string;
    status: string;
  };
  error?: string;
  code?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getVFDToken(): Promise<string> {
  // Return cached token if valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const consumerKey = serverEnv.VFD_CONSUMER_KEY;
  const consumerSecret = serverEnv.VFD_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('VFD credentials not configured');
  }

  try {
    const response = await fetch(VFD_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consumerKey,
        consumerSecret,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`VFD token request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.accessToken) {
      throw new Error('No access token in VFD response');
    }

    // Cache token for 50 minutes (expires in 1 hour)
    cachedToken = {
      token: data.accessToken,
      expiresAt: Date.now() + 50 * 60 * 1000,
    };

    return data.accessToken;
  } catch (error) {
    logger.error('Failed to get VFD token', { error });
    throw error;
  }
}

export async function createVFDVirtualCard(params: {
  userId: string;
  reference: string;
  customerName: string;
  currency?: string;
}): Promise<VFDCardResponse> {
  try {
    const token = await getVFDToken();

    const payload = {
      customerReference: params.userId,
      reference: params.reference,
      currency: params.currency || 'NGN',
      cardName: params.customerName,
      cardType: 'VIRTUAL',
    };

    logger.info('Creating VFD virtual card', { reference: params.reference });

    const response = await fetch(`${VFD_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s for card creation
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('VFD card creation failed', { 
        status: response.status, 
        data,
        reference: params.reference 
      });

      return {
        success: false,
        error: data.message || 'Card creation failed',
        code: data.code || 'VFD_ERROR',
      };
    }

    // Map VFD response to our format
    return {
      success: true,
      data: {
        cardId: data.cardId || data.card_id,
        maskedPan: data.maskedPan || data.masked_pan,
        expiryMonth: data.expiryMonth || data.expiry_month,
        expiryYear: data.expiryYear || data.expiry_year,
        cardName: data.cardName || data.card_name,
        status: data.status || 'active',
      },
    };
  } catch (error) {
    logger.error('VFD card creation error', { error, reference: params.reference });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'NETWORK_ERROR',
    };
  }
}

export async function getVFDCardDetails(cardId: string): Promise<VFDCardResponse> {
  try {
    const token = await getVFDToken();

    const response = await fetch(`${VFD_BASE_URL}/${cardId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to get card details',
      };
    }

    return {
      success: true,
      data: {
        cardId: data.cardId,
        maskedPan: data.maskedPan,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cardName: data.cardName,
        status: data.status,
      },
    };
  } catch (error) {
    logger.error('Failed to get VFD card details', { error, cardId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function blockVFDCard(cardId: string): Promise<VFDCardResponse> {
  try {
    const token = await getVFDToken();

    const response = await fetch(`${VFD_BASE_URL}/${cardId}/block`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to block card',
      };
    }

    return { success: true };
  } catch (error) {
    logger.error('Failed to block VFD card', { error, cardId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
