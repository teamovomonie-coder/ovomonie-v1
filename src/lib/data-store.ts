import { supabaseAdmin } from '@/lib/supabase';
import { firestore } from '@/lib/user-data';

type TransferInput = {
  senderId: string;
  recipientId: string;
  amountKobo: number;
  reference: string;
  narration: string;
};

const useSupabasePrimary = (process.env.USE_SUPABASE_PRIMARY || 'true') === 'true';
const syncFirestoreSecondary = (process.env.SYNC_FIRESTORE_SECONDARY || 'true') === 'true';

export async function getUserById(userId: string) {
  if (useSupabasePrimary && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
    if (error) throw new Error(error.message);
    return data;
  }
  const doc = await firestore.collection('users').doc(userId).get();
  return { id: doc.id, ...doc.data() };
}

export async function getDailyTotals(userId: string, dayStartISO: string, type: 'debit' | 'credit') {
  if (useSupabasePrimary && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('timestamp', dayStartISO);
    if (error) throw new Error(error.message);
    const total = (data || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    return total;
  }
  const snap = await firestore
    .collection('financialTransactions')
    .where('userId', '==', userId)
    .where('type', '==', type)
    .where('timestamp', '>=', new Date(dayStartISO))
    .get();
  let total = 0;
  snap.forEach((d: any) => (total += d.data()?.amount || 0));
  return total;
}

export async function performTransfer(input: TransferInput) {
  const { senderId, recipientId, amountKobo, reference, narration } = input;

  // Supabase primary write
  if (useSupabasePrimary && supabaseAdmin) {
    const { error } = await supabaseAdmin.rpc('perform_internal_transfer', {
      p_sender_id: senderId,
      p_recipient_id: recipientId,
      p_amount: amountKobo,
      p_reference: reference,
      p_narration: narration,
    });
    if (error) throw new Error(error.message);
  }

  // Firestore secondary write for migration sync
  if (syncFirestoreSecondary) {
    // Reuse existing Firestore transfer flow if available
    const { performTransfer: fsPerform } = await import('@/lib/user-data');
    await fsPerform(senderId, recipientId, amountKobo, reference, narration);
  }

  return { ok: true };
}
