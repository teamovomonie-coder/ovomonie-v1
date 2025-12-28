import { supabaseAdmin } from './supabase';

const GAMBLING_KEYWORDS = ['bet', 'betting', 'sporty', 'betking', 'nairabet', '1xbet', 'merrybet', 'betway', 'bet9ja', 'casino', 'lottery', 'lotto'];
const INTERNATIONAL_KEYWORDS = ['usd', 'eur', 'gbp', 'international', 'foreign', 'overseas', 'paypal', 'stripe', 'wise', 'remitly'];
const ECOMMERCE_KEYWORDS = ['amazon', 'ebay', 'jumia', 'konga', 'aliexpress', 'shopify', 'store', 'shop', 'cart', 'checkout'];

export async function validatePayment(
  userId: string, 
  amountKobo: number, 
  recipient?: string, 
  description?: string,
  paymentType?: 'transfer' | 'online' | 'contactless'
) {
  if (!supabaseAdmin) return { allowed: true };

  const { data: settings } = await supabaseAdmin
    .from('payment_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!settings) return { allowed: true };

  // Check limits
  if (amountKobo > settings.single_transaction_limit_kobo) {
    return { allowed: false, reason: `Transaction exceeds limit of ₦${(settings.single_transaction_limit_kobo / 100).toLocaleString()}` };
  }

  const today = new Date().toISOString().split('T')[0];
  const { data: txns } = await supabaseAdmin
    .from('transactions')
    .select('amount_kobo')
    .eq('user_id', userId)
    .eq('type', 'debit')
    .gte('created_at', today);

  const dailyTotal = (txns || []).reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0);
  if (dailyTotal + amountKobo > settings.daily_limit_kobo) {
    return { allowed: false, reason: `Daily limit exceeded. Limit: ₦${(settings.daily_limit_kobo / 100).toLocaleString()}` };
  }

  const text = `${recipient || ''} ${description || ''}`.toLowerCase();

  // Check gambling
  if (settings.block_gambling && GAMBLING_KEYWORDS.some(k => text.includes(k))) {
    return { allowed: false, reason: 'Betting payments are restricted on your account' };
  }

  // Check international
  if (settings.block_international && INTERNATIONAL_KEYWORDS.some(k => text.includes(k))) {
    return { allowed: false, reason: 'International payments are restricted on your account' };
  }

  // Check online payments
  if (!settings.enable_online_payments && (paymentType === 'online' || ECOMMERCE_KEYWORDS.some(k => text.includes(k)))) {
    return { allowed: false, reason: 'Online payments are disabled on your account' };
  }

  // Check contactless
  if (!settings.enable_contactless && paymentType === 'contactless') {
    return { allowed: false, reason: 'Contactless payments are disabled on your account' };
  }

  return { allowed: true };
}
