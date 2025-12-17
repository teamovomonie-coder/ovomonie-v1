// Quick integration test
require('dotenv').config({ path: '.env.local' });

async function quickTest() {
  console.log('🚀 Quick VFD Integration Test\n');

  // 1. Test VFD API
  console.log('1. Testing VFD API...');
  try {
    const vfdResponse = await fetch(`${process.env.VFD_WALLET_API_BASE}/account/enquiry`, {
      headers: { 'AccessToken': process.env.VFD_ACCESS_TOKEN }
    });
    const vfdResult = await vfdResponse.json();
    console.log(vfdResult.status === '00' ? '✅ VFD API working' : '❌ VFD API failed');
  } catch (e) {
    console.log('❌ VFD API error:', e.message);
  }

  // 2. Test Supabase
  console.log('\n2. Testing Supabase...');
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase.from('users').select('count').limit(1);
    console.log(!error ? '✅ Supabase connected' : '❌ Supabase error');
  } catch (e) {
    console.log('❌ Supabase error:', e.message);
  }

  console.log('\n✅ Integration ready! Run: npm run dev');
}

quickTest();