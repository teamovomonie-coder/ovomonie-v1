const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://agzdjkhifsqsiowllnqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemRqa2hpZnNxc2lvd2xsbnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU1MTc4MywiZXhwIjoyMDgxMTI3NzgzfQ.5s_K0kaT-kBfh_ljI28hySA0-ozcCI1qUIx9OAoWkvA'
);

async function fixPendingPayments() {
  const userId = '2e8c6054-12f5-49df-aa73-4fcf032cf3a2';
  
  await supabase.from('users').update({ balance: 3106200 }).eq('id', userId);
  console.log('Reset balance to 3106200 kobo\n');
  
  let currentBalance = 3106200;
  
  const { data: pending } = await supabase
    .from('pending_payments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  console.log('Found', pending?.length, 'pending payments\n');
  
  for (const payment of pending || []) {
    console.log('Processing:', payment.reference, payment.amount, 'kobo');
    
    currentBalance += payment.amount;
    await supabase
      .from('users')
      .update({ balance: currentBalance, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    await supabase.from('financial_transactions').insert({
      user_id: userId,
      type: 'credit',
      category: 'deposit',
      amount: payment.amount,
      reference: payment.reference,
      narration: 'Card funding via VFD',
      party: { method: 'card', gateway: 'VFD' },
      balance_after: currentBalance,
      timestamp: new Date().toISOString()
    });
    
    await supabase
      .from('pending_payments')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('reference', payment.reference);
    
    console.log('✓ Balance:', currentBalance, 'kobo\n');
  }
  
  console.log('=== FINAL ===');
  console.log(currentBalance, 'kobo = ₦' + (currentBalance / 100).toFixed(2));
}

fixPendingPayments().catch(console.error);
