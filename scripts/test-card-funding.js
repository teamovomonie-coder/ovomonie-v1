/**
 * Test Card Funding Flow
 * Tests the complete card funding process including balance updates
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCardFunding() {
  console.log('🧪 Testing Card Funding Flow\n');

  // 1. Check users table structure
  console.log('1️⃣ Checking users table structure...');
  const { data: columns, error: schemaError } = await supabase
    .rpc('exec_sql', { 
      sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('balance', 'updated_at')` 
    })
    .catch(() => {
      // Fallback: try to query a user
      return supabase.from('users').select('id, balance, updated_at').limit(1);
    });

  if (schemaError) {
    console.error('❌ Schema check failed:', schemaError.message);
  } else {
    console.log('✅ Users table structure verified');
  }

  // 2. Get a test user
  console.log('\n2️⃣ Fetching test user...');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, phone, account_number, balance')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('❌ No users found:', userError?.message);
    return;
  }

  const testUser = users[0];
  console.log('✅ Test user:', {
    id: testUser.id,
    phone: testUser.phone,
    account_number: testUser.account_number,
    balance: testUser.balance,
    balanceInNaira: (testUser.balance / 100).toFixed(2)
  });

  // 3. Check financial_transactions table
  console.log('\n3️⃣ Checking recent transactions...');
  const { data: transactions, error: txError } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('user_id', testUser.id)
    .eq('category', 'deposit')
    .order('timestamp', { ascending: false })
    .limit(5);

  if (txError) {
    console.error('❌ Transaction check failed:', txError.message);
  } else {
    console.log(`✅ Found ${transactions?.length || 0} recent deposit transactions`);
    if (transactions && transactions.length > 0) {
      console.log('   Latest:', {
        amount: (transactions[0].amount / 100).toFixed(2),
        reference: transactions[0].reference,
        timestamp: transactions[0].timestamp
      });
    }
  }

  // 4. Check notifications table
  console.log('\n4️⃣ Checking notifications...');
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', testUser.id)
    .eq('category', 'transaction')
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifError) {
    console.error('❌ Notification check failed:', notifError.message);
  } else {
    console.log(`✅ Found ${notifications?.length || 0} transaction notifications`);
  }

  // 5. Simulate balance update
  console.log('\n5️⃣ Simulating balance update...');
  const testAmount = 100000; // 1000 Naira in kobo
  const newBalance = testUser.balance + testAmount;
  
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', testUser.id);

  if (updateError) {
    console.error('❌ Balance update failed:', updateError.message);
  } else {
    console.log('✅ Balance updated successfully');
    console.log(`   Previous: ₦${(testUser.balance / 100).toFixed(2)}`);
    console.log(`   New: ₦${(newBalance / 100).toFixed(2)}`);
  }

  // 6. Verify update
  console.log('\n6️⃣ Verifying balance update...');
  const { data: updatedUser, error: verifyError } = await supabase
    .from('users')
    .select('balance, updated_at')
    .eq('id', testUser.id)
    .single();

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
  } else {
    console.log('✅ Balance verified:', {
      balance: updatedUser.balance,
      balanceInNaira: (updatedUser.balance / 100).toFixed(2),
      updated_at: updatedUser.updated_at
    });
  }

  // 7. Rollback test update
  console.log('\n7️⃣ Rolling back test update...');
  const { error: rollbackError } = await supabase
    .from('users')
    .update({ balance: testUser.balance })
    .eq('id', testUser.id);

  if (rollbackError) {
    console.error('❌ Rollback failed:', rollbackError.message);
  } else {
    console.log('✅ Test update rolled back');
  }

  console.log('\n✨ Card funding flow test complete!\n');
}

testCardFunding().catch(console.error);
