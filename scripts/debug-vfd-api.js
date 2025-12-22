#!/usr/bin/env node

/**
 * VFD API Debug Script
 * Test VFD API responses to debug the "Invalid response from VFD API" error
 * Usage: node scripts/debug-vfd-api.js
 */

const { getVFDHeaders } = require('../src/lib/vfd-auth');
const { logger } = require('../src/lib/logger');

const BASE_URL = process.env.VFD_WALLET_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2';

async function debugVFDAPI() {
  console.log('🔍 Debugging VFD API responses...\n');

  try {
    // Test 1: Get headers
    console.log('1. Getting VFD headers...');
    const headers = await getVFDHeaders();
    console.log('   ✅ Headers obtained successfully');
    console.log('   📝 Headers:', JSON.stringify(headers, null, 2));

    // Test 2: Test account verification endpoint
    console.log('\n2. Testing account verification endpoint...');
    const testRequest = {
      accountNumber: '0123456789',
      bankCode: '058'
    };

    console.log('   📤 Request:', JSON.stringify(testRequest, null, 2));
    console.log('   🌐 URL:', `${BASE_URL}/transfer/verify-account`);

    const response = await fetch(`${BASE_URL}/transfer/verify-account`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testRequest),
    });

    console.log('\n3. Response analysis:');
    console.log('   📊 Status:', response.status, response.statusText);
    console.log('   📋 Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    const responseText = await response.text();
    console.log('   📄 Raw response length:', responseText.length);
    console.log('   📄 Raw response (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      console.log('   ❌ HTTP Error:', response.status, response.statusText);
      console.log('   💥 Response body:', responseText);
      return;
    }

    if (!responseText.trim()) {
      console.log('   ❌ Empty response from API');
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
          console.log('   ✅ VFD API call successful');
        } else {
          console.log('   ⚠️  VFD API returned error status');
        }
      }
    } catch (parseError) {
      console.log('   ❌ JSON parsing failed:', parseError.message);
      console.log('   🔍 Response might be HTML or plain text');
      
      // Check if it's HTML
      if (responseText.toLowerCase().includes('<html>')) {
        console.log('   🌐 Response appears to be HTML (possibly error page)');
      }
      
      // Check if it's plain text error
      if (responseText.toLowerCase().includes('error') || responseText.toLowerCase().includes('exception')) {
        console.log('   💥 Response appears to be plain text error');
      }
    }

    console.log('\n🎯 Debug complete!');

  } catch (error) {
    console.log('\n❌ Debug failed!');
    console.log(`💥 Error: ${error.message}`);
    console.log('📚 Stack:', error.stack);
  }
}

// Run the debug
if (require.main === module) {
  debugVFDAPI()
    .then(() => {
      console.log('\n✨ Debug session completed');
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { debugVFDAPI };