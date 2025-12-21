const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://agzdjkhifsqsiowllnqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemRqa2hpZnNxc2lvd2xsbnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU1MTc4MywiZXhwIjoyMDgxMTI3NzgzfQ.5s_K0kaT-kBfh_ljI28hySA0-ozcCI1qUIx9OAoWkvA'
);

async function fixPendingPayments() {
  const userId = '2e8c6054-12f5-49df-aa73-4fcf032cf3a2';
  
  // Get current balance
  const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
  let currentBalance = user?.balance || 0;
  console.log('Current balance:', currentBalance, 'kobo');
  
  // Get all pending payments
  const { data: pending } = await supabase
    .from('pending_payments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  console.log('\nFound', pending?.length, 'pending payments');
  
  for (const payment of pending || []) {
    console.log('\nProcessing:', payment.reference, payment.amount, 'kobo');
    
    // Update balance
    currentBalance += payment.amount;
    await supabase
      .from('users')
      .update({ balance: currentBalance, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    // Create transaction
    await supabase.from('financial_transactions').insert({
      user_id: userId,
      type: 'credit',
      category: 'deposit',
      amount: payment.amount,
      reference: payment.reference,
      narration: 'Card funding via VFD',
      balance_after: currentBalance,
      timestamp: new Date().toISOString()
    });
    
    // Mark as completed
    await supabase
      .from('pending_payments')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('reference', payment.reference);
    
    console.log('✓ Updated balance to:', currentBalance, 'kobo');
  }
  
  console.log('\n=== FINAL BALANCE ===');
  console.log(currentBalance, 'kobo =', (currentBalance / 100).toFixed(2), 'NGN');
}

fixPendingPayments().catch(console.error);
