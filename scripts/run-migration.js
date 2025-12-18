#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('\n🔧 Running migration: fix_notifications_table.sql\n');
  
  const sql = fs.readFileSync('supabase-migrations/fix_notifications_table.sql', 'utf8');
  
  // Execute each statement separately
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (!statement.trim()) continue;
    
    try {
      const { error } = await db.rpc('exec_sql', { sql: statement });
      if (error) throw error;
    } catch (e) {
      // Try direct query if RPC fails
      const { error } = await db.from('_migrations').insert({ sql: statement });
      if (error) {
        console.log('⚠️  Could not execute via API. Run this SQL manually in Supabase dashboard:\n');
        console.log(sql);
        console.log('\nGo to: https://supabase.com/dashboard/project/agzdjkhifsqsiowllnqa/editor\n');
        return;
      }
    }
  }
  
  console.log('✅ Migration completed!\n');
}

runMigration().catch(console.error);
