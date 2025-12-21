const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://agzdjkhifsqsiowllnqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemRqa2hpZnNxc2lvd2xsbnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU1MTc4MywiZXhwIjoyMDgxMTI3NzgzfQ.5s_K0kaT-kBfh_ljI28hySA0-ozcCI1qUIx9OAoWkvA'
);

async function checkDatabase() {
  const userId = '2e8c6054-12f5-49df-aa73-4fcf032cf3a2';
  
  console.log('\n=== USER BALANCE ===');
  const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
  console.log('Balance:', user?.balance, 'kobo =', (user?.balance / 100).toFixed(2), 'NGN');
  
  console.log('\n=== PENDING PAYMENTS ===');
  const { data: pending } = await supabase.from('pending_payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
  console.log(pending);
  
  console.log('\n=== RECENT TRANSACTIONS ===');
  const { data: txns } = await supabase.from('financial_transactions').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(5);
  console.log(txns);
}

checkDatabase().catch(console.error);
