#!/usr/bin/env node

/**
 * VFD Withdrawal Debug Script
 * Test VFD withdrawal endpoint to debug transfer issues
 * Usage: node scripts/debug-vfd-withdrawal.js
 */

const { getVFDHeaders } = require('../src/lib/vfd-auth');
const { logger } = require('../src/lib/logger');

const BASE_URL = process.env.VFD_WALLET_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2';

async function debugVFDWithdrawal() {
  console.log('🔍 Debugging VFD withdrawal endpoint...\n');

  try {
    // Test 1: Get headers
    console.log('1. Getting VFD headers...');
    const headers = await getVFDHeaders();
    console.log('   ✅ Headers obtained successfully');

    // Test 2: Test withdrawal endpoint with mock data
    console.log('\n2. Testing withdrawal endpoint...');
    const testRequest = {
      walletId: 'test-wallet-123',
      accountNumber: '0123456789',
      bankCode: '058',
      amount: '100.00',
      reference: `test-withdrawal-${Date.now()}`,
      narration: 'Test withdrawal'
    };

    console.log('   📤 Request:', JSON.stringify(testRequest, null, 2));
    console.log('   🌐 URL:', `${BASE_URL}/withdraw`);

    const response = await fetch(`${BASE_URL}/withdraw`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testRequest),
    });

    console.log('\n3. Response analysis:');
    console.log('   📊 Status:', response.status, response.statusText);
    console.log('   📋 Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    const responseText = await response.text();
    console.log('   📄 Raw response length:', responseText.length);
    console.log('   📄 Raw response:', responseText);

    if (!response.ok) {
      console.log('   ❌ HTTP Error:', response.status, response.statusText);
      
      // Check for common error patterns
      if (response.status === 401) {
        console.log('   🔐 Authentication issue - check VFD credentials');
      } else if (response.status === 404) {
        console.log('   🔍 Endpoint not found - check VFD_WALLET_API_BASE URL');
      } else if (response.status >= 500) {
        console.log('   🔥 Server error on VFD side');
      }
      return;
    }

    if (!responseText.trim()) {
      console.log('   ❌ Empty response from withdrawal API');
      console.log('   💡 This is likely the cause of "Unexpected end of JSON input"');
      return;
    }

    // Test 3: Try to parse JSON
    console.log('\n4. JSON parsing test:');
    try {
      const parsed = JSON.parse(responseText);
      console.log('   ✅ JSON parsing successful');
      console.log('   📋 Parsed response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.status) {
        console.log('   📊 VFD Status:', parsed.status);
        console.log('   📝 VFD Message:', parsed.message);
        
        if (parsed.status === '00') {
          console.log('   ✅ VFD withdrawal would succeed');
        } else {
          console.log('   ⚠️  VFD withdrawal would fail with status:', parsed.status);
        }
      }
    } catch (parseError) {
      console.log('   ❌ JSON parsing failed:', parseError.message);
      console.log('   💥 This is the "Unexpected end of JSON input" error!');
      
      // Analyze the response
      if (responseText.toLowerCase().includes('<html>')) {
        console.log('   🌐 Response is HTML (likely error page)');
      } else if (responseText.toLowerCase().includes('error')) {
        console.log('   💥 Response contains error text');
      } else {
        console.log('   🤔 Response format unknown');
      }
    }

    console.log('\n🎯 Withdrawal debug complete!');

  } catch (error) {
    console.log('\n❌ Withdrawal debug failed!');
    console.log(`💥 Error: ${error.message}`);
    
    if (error.message.includes('Failed to get VFD access token')) {
      console.log('🔧 Fix: Check your VFD credentials in .env.local');
    } else if (error.message.includes('fetch')) {
      console.log('🔧 Fix: Check your internet connection and VFD API URL');
    }
  }
}

// Run the debug
if (require.main === module) {
  debugVFDWithdrawal()
    .then(() => {
      console.log('\n✨ Withdrawal debug session completed');
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { debugVFDWithdrawal };