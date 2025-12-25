const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://agzdjkhifsqsiowllnqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemRqa2hpZnNxc2lvd2xsbnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU1MTc4MywiZXhwIjoyMDgxMTI3NzgzfQ.5s_K0kaT-kBfh_ljI28hySA0-ozcCI1qUIx9OAoWkvA'
);

async function fixPendingPayments() {
  const userId = '2e8c6054-12f5-49df-aa73-4fcf032cf3a2';
  
  // Reset balance to before the fix
  await supabase.from('users').update({ balance: 3106200 }).eq('id', userId);
  console.log('Reset balance to 3106200 kobo');
  
  let currentBalance = 3106200;
  
  // Get all pending payments
  const { data: pending, error: fetchError } = await supabase
    .from('pending_payments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  if (fetchError) {
    console.error('Error fetching pending payments:', fetchError);
    return;
  }
  
  console.log('\nFound', pending?.length, 'pending payments\n');
  
  for (const payment of pending || []) {
    console.log('Processing:', payment.reference, payment.amount, 'kobo');
    
    // Update balance
    currentBalance += payment.amount;
    const { error: balError } = await supabase
      .from('users')
      .update({ balance: currentBalance, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (balError) {
      console.error('Balance update error:', balError);
      continue;
    }
    
    // Create transaction
    const { error: txnError } = await supabase.from('financial_transactions').insert({
      user_id: userId,
      type: 'credit',
      category: 'deposit',
      amount: payment.amount,
      reference: payment.reference,
      narration: 'Card funding via VFD',
      balance_after: currentBalance,
      timestamp: new Date().toISOString()
    });
    
    if (txnError) {
      console.error('Transaction insert error:', txnError);
      continue;
    }
    
    // Mark as completed
    const { error: updateError } = await supabase
      .from('pending_payments')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('reference', payment.reference);
    
    if (updateError) {
      console.error('Pending payment update error:', updateError);
      continue;
    }
    
    console.log('✓ Balance:', currentBalance, 'kobo\n');
  }
  
  console.log('=== FINAL BALANCE ===');
  console.log(currentBalance, 'kobo =', (currentBalance / 100).toFixed(2), 'NGN');
}

fixPendingPayments().catch(console.error);
