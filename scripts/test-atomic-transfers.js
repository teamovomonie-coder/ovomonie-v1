const fetch = require('node-fetch');

require('dotenv').config({ path: '.env.local' });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  senderToken: '', // Add your test user token here
  recipientAccount: '', // Add test recipient account number
  transferAmount: 100, // 100 Naira
  concurrentRequests: 5
};

async function testConcurrentTransfers() {
  console.log('🧪 Testing Concurrent Transfer Protection\n');
  
  if (!TEST_CONFIG.senderToken || !TEST_CONFIG.recipientAccount) {
    console.error('❌ Please configure TEST_CONFIG with valid token and recipient account');
    console.log('\nTo get a token:');
    console.log('1. Login via the app');
    console.log('2. Check localStorage for "ovo-auth-token"');
    console.log('3. Add it to TEST_CONFIG.senderToken in this script');
    return;
  }

  console.log(`📊 Configuration:`);
  console.log(`   - Concurrent requests: ${TEST_CONFIG.concurrentRequests}`);
  console.log(`   - Amount per transfer: ₦${TEST_CONFIG.transferAmount}`);
  console.log(`   - Recipient: ${TEST_CONFIG.recipientAccount}\n`);

  // Get initial balance
  console.log('📍 Fetching initial balance...');
  const initialBalanceRes = await fetch(`${API_BASE}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${TEST_CONFIG.senderToken}` }
  });
  
  if (!initialBalanceRes.ok) {
    console.error('❌ Failed to fetch initial balance');
    return;
  }
  
  const initialData = await initialBalanceRes.json();
  const initialBalance = initialData.balanceInKobo / 100;
  console.log(`   Initial balance: ₦${initialBalance.toFixed(2)}\n`);

  // Create concurrent transfer requests with same reference (should fail for duplicates)
  console.log('🚀 Sending concurrent transfer requests...');
  const reference = `TEST_${Date.now()}`;
  
  const promises = Array(TEST_CONFIG.concurrentRequests).fill(null).map((_, i) => 
    fetch(`${API_BASE}/api/transfers/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.senderToken}`
      },
      body: JSON.stringify({
        recipientAccountNumber: TEST_CONFIG.recipientAccount,
        amount: TEST_CONFIG.transferAmount,
        narration: `Concurrent test ${i + 1}`,
        clientReference: `${reference}-${i}`
      })
    }).then(res => res.json())
  );

  const results = await Promise.all(promises);
  
  console.log('\n📊 Results:');
  const successful = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  results.forEach((result, i) => {
    const status = result.ok ? '✅' : '❌';
    console.log(`   ${status} Request ${i + 1}: ${result.message || result.error || 'Unknown'}`);
  });

  // Get final balance
  console.log('\n📍 Fetching final balance...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for balance update
  
  const finalBalanceRes = await fetch(`${API_BASE}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${TEST_CONFIG.senderToken}` }
  });
  
  if (finalBalanceRes.ok) {
    const finalData = await finalBalanceRes.json();
    const finalBalance = finalData.balanceInKobo / 100;
    const expectedBalance = initialBalance - (successful * TEST_CONFIG.transferAmount);
    
    console.log(`   Final balance: ₦${finalBalance.toFixed(2)}`);
    console.log(`   Expected balance: ₦${expectedBalance.toFixed(2)}`);
    
    if (Math.abs(finalBalance - expectedBalance) < 0.01) {
      console.log('\n✅ Balance is correct! No race condition detected.');
    } else {
      console.log('\n⚠️  Balance mismatch! Possible race condition.');
    }
  }

  console.log('\n✨ Test complete!');
}

// Test duplicate transaction prevention
async function testDuplicatePrevention() {
  console.log('\n🧪 Testing Duplicate Transaction Prevention\n');
  
  if (!TEST_CONFIG.senderToken || !TEST_CONFIG.recipientAccount) {
    console.error('❌ Please configure TEST_CONFIG');
    return;
  }

  const reference = `DUP_TEST_${Date.now()}`;
  
  console.log('🚀 Sending same transaction twice...');
  
  const request = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.senderToken}`
    },
    body: JSON.stringify({
      recipientAccountNumber: TEST_CONFIG.recipientAccount,
      amount: TEST_CONFIG.transferAmount,
      narration: 'Duplicate test',
      clientReference: reference
    })
  };

  const [result1, result2] = await Promise.all([
    fetch(`${API_BASE}/api/transfers/internal`, request).then(r => r.json()),
    fetch(`${API_BASE}/api/transfers/internal`, request).then(r => r.json())
  ]);

  console.log('\n📊 Results:');
  console.log(`   First request: ${result1.ok ? '✅ Success' : '❌ Failed'} - ${result1.message || result1.error}`);
  console.log(`   Second request: ${result2.ok ? '✅ Success' : '❌ Failed'} - ${result2.message || result2.error}`);

  if (result1.ok && !result2.ok && result2.message?.includes('Duplicate')) {
    console.log('\n✅ Duplicate prevention working correctly!');
  } else if (!result1.ok && result2.ok && result1.message?.includes('Duplicate')) {
    console.log('\n✅ Duplicate prevention working correctly!');
  } else if (result1.ok && result2.ok) {
    console.log('\n⚠️  WARNING: Both requests succeeded! Duplicate prevention may not be working.');
  } else {
    console.log('\n⚠️  Unexpected result. Check logs.');
  }
}

// Run tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ATOMIC TRANSFER TESTS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  await testConcurrentTransfers();
  await testDuplicatePrevention();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TESTS COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
}

runAllTests().catch(console.error);
