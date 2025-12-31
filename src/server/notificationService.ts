import { supabaseAdmin } from '@/lib/supabase';

export async function shouldSendNotification(userId: string, type: string): Promise<boolean> {
  if (!supabaseAdmin) throw new Error('Supabase admin client not available');
  const { data, error } = await supabaseAdmin
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return false;
  if (!data) return false;
  switch (type) {
    case 'debit': return data.debit_alerts;
    case 'credit': return data.credit_alerts;
    case 'failed_transaction': return data.failed_transaction_alerts;
    case 'login_alert': return data.login_alerts;
    case 'large_transaction': return data.large_transaction_alerts;
    case 'low_balance': return data.low_balance_alerts;
    default: return false;
  }
}

export async function sendNotification({
  userId,
  type,
  title,
  message,
  metadata = {}
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not available');
  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    metadata,
  });
  if (error) throw error;
}
