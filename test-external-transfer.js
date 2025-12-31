/**
 * E2E Test Script for External Transfer Flow
 * Run this in browser console after logging in
 */

async function testExternalTransfer() {
  console.log('🚀 Starting External Transfer E2E Test...');
  
  // Test data
  const testData = {
    bankCode: '058', // GTBank
    accountNumber: '0123456789',
    amount: 1000,
    narration: 'Test transfer',
    recipientName: 'Test Recipient'
  };
  
  try {
    // Step 1: Clear any existing receipt data
    console.log('📝 Step 1: Clearing existing receipt data...');
    localStorage.removeItem('ovo-pending-receipt');
    sessionStorage.removeItem('ovo-receipt-fallback');
    
    // Step 2: Verify account (simulate)
    console.log('🔍 Step 2: Verifying account...');
    const token = localStorage.getItem('ovo-auth-token');
    if (!token) {
      throw new Error('No auth token found. Please log in first.');
    }
    
    // Step 3: Simulate external transfer API call
    console.log('💸 Step 3: Initiating transfer...');
    const clientReference = `test-external-transfer-${Date.now()}`;
    
    const transferResponse = await fetch('/api/transfers/external', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        clientReference,
        recipientName: testData.recipientName,
        bankCode: testData.bankCode,
        accountNumber: testData.accountNumber,
        amount: testData.amount,
        narration: testData.narration,
      }),
    });
    
    const transferResult = await transferResponse.json();
    console.log('Transfer API Response:', transferResult);
    
    if (!transferResponse.ok || !transferResult.ok) {
      throw new Error(`Transfer failed: ${transferResult.message}`);
    }
    
    // Step 4: Create receipt data (simulate what the form does)
    console.log('🧾 Step 4: Creating receipt data...');
    const receiptData = {
      type: 'external-transfer',
      data: {
        bankCode: testData.bankCode,
        accountNumber: testData.accountNumber,
        amount: testData.amount,
        narration: testData.narration,
      },
      recipientName: testData.recipientName,
      bankName: 'Guaranty Trust Bank',
      reference: clientReference,
      amount: testData.amount,
      transactionId: transferResult.data.transactionId || clientReference,
      completedAt: new Date().toLocaleString(),
    };
    
    // Step 5: Save receipt to localStorage
    console.log('💾 Step 5: Saving receipt to localStorage...');
    localStorage.setItem('ovo-pending-receipt', JSON.stringify(receiptData));
    
    // Step 6: Verify receipt was saved
    console.log('✅ Step 6: Verifying receipt data...');
    const savedReceipt = localStorage.getItem('ovo-pending-receipt');
    const parsedReceipt = JSON.parse(savedReceipt);
    console.log('Saved receipt:', parsedReceipt);
    
    // Step 7: Navigate to success page
    console.log('🎯 Step 7: Navigating to success page...');
    const successUrl = `/success?ref=${encodeURIComponent(clientReference)}`;
    window.location.href = successUrl;
    
    console.log('✅ Test completed successfully!');
    console.log('Expected: Receipt should load on success page');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('Error details:', error.message);
  }
}

// Auto-run test
console.log('External Transfer E2E Test Script Loaded');
console.log('Run testExternalTransfer() to start the test');

// Uncomment to auto-run
// testExternalTransfer();