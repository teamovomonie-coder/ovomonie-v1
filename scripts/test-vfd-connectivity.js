#!/usr/bin/env node

/**
 * VFD Connectivity Test Script
 * Run this to verify your VFD API configuration is working
 * Usage: node scripts/test-vfd-connectivity.js
 */

const { getVFDAccessToken } = require('../src/lib/vfd-auth');
const { logger } = require('../src/lib/logger');

async function testVFDConnectivity() {
  console.log('🔍 Testing VFD API connectivity...\n');

  try {
    // Test 1: Check environment variables
    console.log('1. Checking environment variables...');
    const hasStaticToken = !!process.env.VFD_ACCESS_TOKEN;
    const hasOAuthCreds = !!(process.env.VFD_CONSUMER_KEY && process.env.VFD_CONSUMER_SECRET);
    
    if (hasStaticToken) {
      console.log('   ✅ VFD_ACCESS_TOKEN found');
    } else if (hasOAuthCreds) {
      console.log('   ✅ VFD_CONSUMER_KEY and VFD_CONSUMER_SECRET found');
    } else {
      console.log('   ❌ No VFD credentials found in environment');
      console.log('   💡 Set either VFD_ACCESS_TOKEN or VFD_CONSUMER_KEY + VFD_CONSUMER_SECRET');
      return false;
    }

    // Test 2: Get access token
    console.log('\n2. Testing token acquisition...');
    const token = await getVFDAccessToken();
    console.log('   ✅ Successfully obtained VFD access token');
    console.log(`   📝 Token length: ${token.length} characters`);

    // Test 3: Validate token format
    console.log('\n3. Validating token format...');
    if (token.length > 50) {
      console.log('   ✅ Token appears to be valid format');
    } else {
      console.log('   ⚠️  Token seems unusually short');
    }

    console.log('\n🎉 VFD API connectivity test PASSED!');
    console.log('✨ Your external transfers should work in live mode.');
    return true;

  } catch (error) {
    console.log('\n❌ VFD API connectivity test FAILED!');
    console.log(`💥 Error: ${error.message}`);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Check your .env.local file has VFD credentials');
    console.log('   2. Verify VFD_CONSUMER_KEY and VFD_CONSUMER_SECRET are correct');
    console.log('   3. Ensure you have internet connectivity');
    console.log('   4. Check VFD API status at https://vbaas-docs.vfdtech.ng/');
    return false;
  }
}

// Run the test
if (require.main === module) {
  testVFDConnectivity()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testVFDConnectivity };