/**
 * Seed a test user in Supabase for local login.
 * Run with: `npx tsx src/scripts/seed-test-user.ts`
 */
import { createClient } from '@supabase/supabase-js';
import { hashSecret } from "@/lib/auth";
import { serverEnv } from '@/lib/env.server';

import "dotenv/config";

async function main() {
  const phone = "+2349034151086";
  const loginPin = "123456";

  const supabase = createClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from('users')
    .insert({
      phone,
      full_name: "Test User",
      email: "test1@example.com",
      account_number: "1234567890",
      balance: 0,
      kyc_tier: 1,
      is_agent: false,
      login_pin_hash: hashSecret(loginPin),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log(`Seeded test user ${phone} (PIN: ${loginPin}) with id ${data.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});