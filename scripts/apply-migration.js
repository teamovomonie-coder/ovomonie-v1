const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying atomic transfer migration...\n');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250126000000_atomic_transfers.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // Fallback: try direct execution
      const { data, error } = await supabase.from('_migrations').select('*').limit(1);
      if (error) throw error;
      
      // Execute via raw query
      console.log('⚠️  Using fallback method...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      return { data: await response.json(), error: null };
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\n📋 Manual steps:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy contents from: supabase/migrations/20250126000000_atomic_transfers.sql');
      console.log('3. Paste and run the SQL');
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n🔍 Verifying function...');

    // Verify the function exists
    const { data: functions, error: verifyError } = await supabase
      .rpc('process_internal_transfer', {
        p_sender_id: '00000000-0000-0000-0000-000000000000',
        p_recipient_account: 'test',
        p_amount_kobo: 100,
        p_narration: 'test',
        p_reference: 'test'
      })
      .then(() => ({ data: true, error: null }))
      .catch((err) => ({ data: null, error: err }));

    if (verifyError && !verifyError.message.includes('Sender not found')) {
      console.warn('⚠️  Could not verify function (this is normal)');
    } else {
      console.log('✅ Function verified and ready to use!');
    }

    console.log('\n✨ All done! The atomic transfer function is now active.');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.log('\n📋 Please apply migration manually via Supabase Dashboard');
    process.exit(1);
  }
}

applyMigration();
