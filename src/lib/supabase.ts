import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client for browser/client-side operations
 * Uses anon key which is safe to expose
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Supabase Admin Client for server-side operations
 * ONLY use on the server with service role key
 * Never expose service role key to client
 */
export const supabaseAdmin = (() => {
  if (typeof window !== 'undefined') {
    // Running on client - don't create admin client
    return null;
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
})();

export type SupabaseClient = typeof supabase;
