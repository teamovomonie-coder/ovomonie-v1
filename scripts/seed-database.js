require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Seeding Supabase database...\n');

  // Sample data
  const sampleUser = {
    id: crypto.randomUUID(),
    phone: '1234567890',
    email: 'test@example.com',
    full_name: 'Test User',
    account_number: '9012345678',
    balance: 1000,
    kyc_tier: 1,
    is_agent: false,
    status: 'active',
    login_pin_hash: 'hashed-pin',
  };

  const sampleTransaction = {
    id: crypto.randomUUID(),
    user_id: sampleUser.id,
    category: 'transfer',
    type: 'credit',
    amount: 500,
    reference: 'TXN123456',
    narration: 'Test transaction',
    party: 'Test Party',
    balance_after: 1500,
  };

  const sampleNotification = {
    id: crypto.randomUUID(),
    user_id: sampleUser.id,
    title: 'Welcome',
    body: 'Welcome to Ovo Thrive',
    category: 'system',
    read: false,
  };

  try {
    // Insert user
    const { error: userError } = await supabase
      .from('users')
      .upsert([sampleUser]);
    
    if (userError) {
      console.error('Error inserting user:', userError);
    } else {
      console.log('✅ User seeded successfully');
    }

    // Insert transaction
    const { error: txError } = await supabase
      .from('financial_transactions')
      .upsert([sampleTransaction]);
    
    if (txError) {
      console.error('Error inserting transaction:', txError);
    } else {
      console.log('✅ Transaction seeded successfully');
    }

    // Insert notification
    const { error: notifError } = await supabase
      .from('notifications')
      .upsert([sampleNotification]);
    
    if (notifError) {
      console.error('Error inserting notification:', notifError);
    } else {
      console.log('✅ Notification seeded successfully');
    }

    console.log('\n🎉 Database seeding complete!');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();