/**
 * Test VFD Bills API with proper polling for 202 responses
 * Run with: node scripts/test-vfd-bills.js
 */

require('dotenv').config({ path: '.env.local' });

const VFD_BILLS_API_BASE = process.env.VFD_BILLS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';
const VFD_ACCESS_TOKEN = process.env.VFD_ACCESS_TOKEN;

async function pollForResult(url, headers, maxAttempts = 5) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(url, { headers });
    const status = response.status;
    const text = await response.text();
    
    console.log(`  Poll attempt ${i + 1}: Status ${status}`);
    
    if (status === 200) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    }
    
    // Wait before next poll
    await new Promise(r => setTimeout(r, 1000));
  }
  return null;
}

async function testBillsCategories() {
  console.log('=== VFD Bills API Test ===');
  console.log(`API Base: ${VFD_BILLS_API_BASE}`);
  console.log(`Access Token: ${VFD_ACCESS_TOKEN ? VFD_ACCESS_TOKEN.substring(0, 40) + '...' : 'NOT SET'}`);
  console.log('');

  if (!VFD_ACCESS_TOKEN) {
    console.error('ERROR: VFD_ACCESS_TOKEN is not set in .env.local');
    return;
  }

  const headers = {
    'AccessToken': VFD_ACCESS_TOKEN,
    'Content-Type': 'application/json',
  };

  // Test 1: Get all bills categories
  console.log('1. Testing getallbillscategory...');
  try {
    const url = `${VFD_BILLS_API_BASE}/getallbillscategory`;
    console.log(`   GET ${url}`);
    
    const response = await fetch(url, { method: 'GET', headers });
    const status = response.status;
    const text = await response.text();
    
    console.log(`   Status: ${status}`);
    
    if (status === 202) {
      console.log('   Received 202, polling for result...');
      const result = await pollForResult(url, headers);
      if (result) {
        console.log('   Categories:', JSON.stringify(result, null, 2).substring(0, 500));
      }
    } else if (status === 200) {
      try {
        const json = JSON.parse(text);
        console.log('   ✓ Success!');
        if (json.data && Array.isArray(json.data)) {
          console.log('   Categories:');
          json.data.forEach(cat => {
            console.log(`     - ${cat.categoryName || cat.name} (ID: ${cat.categoryId || cat.id})`);
          });
        } else {
          console.log('   Response:', JSON.stringify(json, null, 2).substring(0, 500));
        }
      } catch (e) {
        console.log('   Response:', text.substring(0, 500));
      }
    } else {
      console.log(`   ✗ Failed with status ${status}`);
      console.log('   Response:', text.substring(0, 300));
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Test 2: Get billers for a category
  console.log('\n2. Testing getbillerbycategoryid...');
  try {
    const categoryId = '1'; // Typically 1 = Electricity
    const url = `${VFD_BILLS_API_BASE}/getbillerbycategoryid?categoryId=${categoryId}`;
    console.log(`   GET ${url}`);
    
    const response = await fetch(url, { method: 'GET', headers });
    const status = response.status;
    const text = await response.text();
    
    console.log(`   Status: ${status}`);
    
    if (status === 200) {
      try {
        const json = JSON.parse(text);
        console.log('   ✓ Success!');
        if (json.data && Array.isArray(json.data)) {
          console.log('   Billers:');
          json.data.slice(0, 5).forEach(b => {
            console.log(`     - ${b.billerName || b.name} (ID: ${b.billerId || b.id})`);
          });
          if (json.data.length > 5) {
            console.log(`     ... and ${json.data.length - 5} more`);
          }
        } else {
          console.log('   Response:', JSON.stringify(json, null, 2).substring(0, 500));
        }
      } catch (e) {
        console.log('   Response:', text.substring(0, 500));
      }
    } else {
      console.log(`   Status: ${status}`);
      console.log('   Response:', text.substring(0, 300));
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }
}

testBillsCategories();
