import { supabaseAdmin } from './supabase';

const GAMBLING_KEYWORDS = ['bet', 'betting', 'sporty', 'betking', 'nairabet', '1xbet', 'merrybet', 'betway', 'bet9ja', 'casino', 'lottery', 'lotto'];

export async function validatePayment(userId: string, amountKobo: number, recipient?: string, description?: string) {
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

  // Check gambling
  if (settings.block_gambling) {
    const text = `${recipient || ''} ${description || ''}`.toLowerCase();
    if (GAMBLING_KEYWORDS.some(k => text.includes(k))) {
      return { allowed: false, reason: 'Betting payments are restricted on your account' };
    }
  }

  return { allowed: true };
}
