/**
 * Script to create the virtual cards table using Supabase's SQL execution
 * Run with: node scripts/create-virtual-cards-table.js
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS users_virtual_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON users_virtual_cards(user_id);
`;

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/rpc/exec_sql`);
    
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log(`Project: ${projectRef}`);
  console.log('Attempting to create table via RPC...');
  
  try {
    await executeSQL(CREATE_TABLE_SQL);
    console.log('✓ Table created successfully!');
  } catch (error) {
    console.log('RPC method not available (expected).');
    console.log('\nPlease create the table manually in Supabase SQL Editor:');
    console.log('URL: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('\n' + CREATE_TABLE_SQL);
  }
}

main();
