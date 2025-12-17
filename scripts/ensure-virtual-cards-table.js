/**
 * Script to ensure the users_virtual_cards table exists in Supabase
 * Run with: node scripts/ensure-virtual-cards-table.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CREATE_TABLE_SQL = `
-- Virtual Cards Table
CREATE TABLE IF NOT EXISTS users_virtual_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_number VARCHAR(255) NOT NULL,
  expiry_date VARCHAR(10) NOT NULL,
  cvv VARCHAR(10) NOT NULL,
  card_pin VARCHAR(255),
  balance BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  card_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON users_virtual_cards(user_id);

-- Enable Row Level Security
ALTER TABLE users_virtual_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own cards
CREATE POLICY IF NOT EXISTS "Users can view their own virtual cards" 
  ON users_virtual_cards 
  FOR SELECT 
  USING (auth.uid()::text = user_id::text OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Policy: Users can insert their own cards
CREATE POLICY IF NOT EXISTS "Users can insert their own virtual cards" 
  ON users_virtual_cards 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Policy: Users can update their own cards
CREATE POLICY IF NOT EXISTS "Users can update their own virtual cards" 
  ON users_virtual_cards 
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Policy: Users can delete their own cards
CREATE POLICY IF NOT EXISTS "Users can delete their own virtual cards" 
  ON users_virtual_cards 
  FOR DELETE 
  USING (auth.uid()::text = user_id::text OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
`;

async function ensureVirtualCardsTable() {
  console.log('Checking if users_virtual_cards table exists...');

  // Check if table exists by trying to query it
  const { data, error } = await supabase
    .from('users_virtual_cards')
    .select('id')
    .limit(1);

  if (error) {
    if (error.message.includes("Could not find the table") || error.code === '42P01') {
      console.log('Table does not exist.');
      console.log('\n=== PLEASE RUN THE FOLLOWING SQL IN SUPABASE SQL EDITOR ===\n');
      console.log(CREATE_TABLE_SQL);
      console.log('\n============================================================\n');
      console.log('Steps:');
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Paste and run the SQL above');
      console.log('5. Re-run this script to verify');
      return false;
    } else {
      console.error('Error checking table:', error.message);
      return false;
    }
  } else {
    console.log('✓ Table users_virtual_cards exists');
    console.log(`  Found ${data?.length || 0} records`);
    return true;
  }
}

// Test basic connection
async function testConnection() {
  console.log('Testing Supabase connection...');
  const { data, error } = await supabase.from('users').select('id').limit(1);
  
  if (error) {
    console.error('Connection failed:', error.message);
    return false;
  }
  
  console.log('✓ Supabase connection successful');
  return true;
}

async function main() {
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  const tableExists = await ensureVirtualCardsTable();
  if (tableExists) {
    console.log('\n✓ Virtual cards system is ready!');
  }
}

main().catch(console.error);
