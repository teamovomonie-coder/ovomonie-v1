/**
 * Test script for VFD Virtual Account Integration
 * Tests the complete flow: create virtual account -> simulate funding -> check balance
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVirtualAccountFlow() {
  console.log('🧪 Testing VFD Virtual Account Integration...\n');

  try {
    // Test 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const testUserId = `test_${Date.now()}`;
    const testUser = {
      id: testUserId,
      phone: `+234801${Math.floor(Math.random() * 10000000)}`,
      full_name: 'Test User',
      account_number: `90${Math.floor(Math.random() * 100000000)}`,
      balance: 0,
      login_pin_hash: 'test_hash',
      kyc_tier: 1,
      is_agent: false,
      status: 'active'
    };

    const { error: userError } = await supabase
      .from('users')
      .insert(testUser);

    if (userError) {
      console.error('❌ Failed to create test user:', userError);
      return;
    }
    console.log('✅ Test user created:', testUserId);

    // Test 2: Create virtual account via API
    console.log('\n2️⃣ Testing virtual account creation...');
    const vfdResponse = await fetch(`${process.env.VFD_WALLET_API_BASE}/virtualaccount`, {
      method: 'POST',
      headers: {
        'AccessToken': process.env.VFD_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: '1000',
        merchantName: 'Ovomonie',
        merchantId: testUserId,
        reference: `TEST_${testUserId}_${Date.now()}`,
        validityTime: '4320',
        amountValidation: 'A4'
      })
    });

    const vfdResult = await vfdResponse.json();
    console.log('VFD Response:', vfdResult);

    if (vfdResult.status === '00' && vfdResult.accountNumber) {
      console.log('✅ Virtual account created:', vfdResult.accountNumber);

      // Test 3: Store in database
      console.log('\n3️⃣ Storing virtual account in database...');
      const { error: vaError } = await supabase
        .from('virtual_accounts')
        .insert({
          user_id: testUserId,
          vfd_account_number: vfdResult.accountNumber,
          reference: `TEST_${testUserId}_${Date.now()}`,
          amount: '1000',
          status: 'active',
          validity_time: '4320',
          merchant_name: 'Ovomonie',
          merchant_id: testUserId
        });

      if (vaError) {
        console.error('❌ Failed to store virtual account:', vaError);
        return;
      }
      console.log('✅ Virtual account stored in database');

      // Test 4: Simulate inbound credit
      console.log('\n4️⃣ Simulating inbound credit...');
      const creditResponse = await fetch(`${process.env.VFD_WALLET_API_BASE}/credit`, {
        method: 'POST',
        headers: {
          'AccessToken': process.env.VFD_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: '1000',
          accountNo: vfdResult.accountNumber,
          senderAccountNo: '1234567890',
          senderBank: 'Test Bank',
          senderNarration: 'Test funding'
        })
      });

      const creditResult = await creditResponse.json();
      console.log('Credit simulation result:', creditResult);

      if (creditResult.status === '00') {
        console.log('✅ Inbound credit simulated successfully');

        // Test 5: Process webhook (simulate)
        console.log('\n5️⃣ Processing webhook simulation...');
        const webhookData = {
          accountNumber: vfdResult.accountNumber,
          amount: '1000',
          senderName: 'Test Sender',
          senderAccount: '1234567890',
          senderBank: 'Test Bank',
          reference: `CREDIT_${Date.now()}`,
          sessionId: `SESSION_${Date.now()}`,
          transactionType: 'CREDIT'
        };

        // Process using our function
        const { processInboundTransfer } = require('../src/lib/virtual-accounts');
        const processResult = await processInboundTransfer(webhookData);

        if (processResult.success) {
          console.log('✅ Webhook processed successfully');

          // Test 6: Check updated balance
          console.log('\n6️⃣ Checking updated balance...');
          const { data: updatedUser } = await supabase
            .from('users')
            .select('balance')
            .eq('id', testUserId)
            .single();

          if (updatedUser && updatedUser.balance === 100000) { // 1000 * 100 kobo
            console.log('✅ Balance updated correctly:', updatedUser.balance, 'kobo');
          } else {
            console.log('❌ Balance not updated correctly:', updatedUser?.balance);
          }
        } else {
          console.log('❌ Webhook processing failed:', processResult.error);
        }
      } else {
        console.log('❌ Credit simulation failed:', creditResult.message);
      }
    } else {
      console.log('❌ Virtual account creation failed:', vfdResult.message);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('wallet_transactions').delete().eq('user_id', testUserId);
    await supabase.from('virtual_accounts').delete().eq('user_id', testUserId);
    await supabase.from('users').delete().eq('id', testUserId);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testVirtualAccountFlow();