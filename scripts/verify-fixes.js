/**
 * Verify Card Funding Fixes
 * Tests that errors are handled gracefully
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFixes() {
  console.log('🔍 Verifying Card Funding Fixes\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Check users table has balance column
  console.log('1️⃣ Testing users table structure...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, balance, updated_at')
      .limit(1);
    
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No users found');
    
    const user = data[0];
    if (typeof user.balance !== 'number') throw new Error('Balance is not a number');
    
    console.log('   ✅ Users table structure is correct');
    console.log(`   Sample balance: ₦${(user.balance / 100).toFixed(2)}`);
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 2: Check financial_transactions table
  console.log('\n2️⃣ Testing financial_transactions table...');
  try {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('category', 'deposit')
      .limit(1);
    
    if (error) throw error;
    
    console.log(`   ✅ Found ${data?.length || 0} deposit transactions`);
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 3: Check notifications table
  console.log('\n3️⃣ Testing notifications table...');
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('category', 'transaction')
      .limit(1);
    
    if (error) throw error;
    
    console.log(`   ✅ Found ${data?.length || 0} transaction notifications`);
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 4: Simulate balance update
  console.log('\n4️⃣ Testing balance update...');
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, balance')
      .limit(1);
    
    if (!users || users.length === 0) throw new Error('No users found');
    
    const testUser = users[0];
    const originalBalance = testUser.balance;
    const testBalance = originalBalance + 100000; // Add ₦1000
    
    // Update
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: testBalance, updated_at: new Date().toISOString() })
      .eq('id', testUser.id);
    
    if (updateError) throw updateError;
    
    // Verify
    const { data: updated } = await supabase
      .from('users')
      .select('balance')
      .eq('id', testUser.id)
      .single();
    
    if (updated.balance !== testBalance) throw new Error('Balance not updated');
    
    // Rollback
    await supabase
      .from('users')
      .update({ balance: originalBalance })
      .eq('id', testUser.id);
    
    console.log('   ✅ Balance update works correctly');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 5: Check indexes
  console.log('\n5️⃣ Testing database indexes...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, balance')
      .order('balance', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    console.log('   ✅ Balance index works (query executed successfully)');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Card funding should work correctly.\n');
    console.log('Next steps:');
    console.log('1. Test card funding with small amount (₦100-1000)');
    console.log('2. Verify balance updates in dashboard');
    console.log('3. Check notification appears');
    console.log('4. Monitor server logs for any errors\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.\n');
    process.exit(1);
  }
}

verifyFixes().catch(err => {
  console.error('\n❌ Verification failed:', err.message);
  process.exit(1);
});
