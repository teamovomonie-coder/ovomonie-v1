const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://agzdjkhifsqsiowllnqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemRqa2hpZnNxc2lvd2xsbnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU1MTc4MywiZXhwIjoyMDgxMTI3NzgzfQ.5s_K0kaT-kBfh_ljI28hySA0-ozcCI1qUIx9OAoWkvA'
);

async function checkDeposits() {
  const userId = '2e8c6054-12f5-49df-aa73-4fcf032cf3a2';
  
  const { data: deposits } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('category', 'deposit')
    .order('timestamp', { ascending: false });
  
  console.log('=== DEPOSIT TRANSACTIONS ===');
  console.log('Total:', deposits?.length);
  deposits?.forEach(d => {
    console.log(`${d.timestamp} | ${d.reference} | ₦${(d.amount / 100).toFixed(2)} | Balance after: ₦${(d.balance_after / 100).toFixed(2)}`);
  });
  
  const { data: pending } = await supabase
    .from('pending_payments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed');
  
  console.log('\n=== COMPLETED PAYMENTS ===');
  console.log('Total:', pending?.length);
}

checkDeposits().catch(console.error);
