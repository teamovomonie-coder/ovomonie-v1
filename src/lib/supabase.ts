import { createClient } from '@supabase/supabase-js';
import { clientEnv } from './env.client';

/**
 * Supabase Client for browser/client-side operations
 * Uses anon key which is safe to expose
 */
export const supabase = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
  
  try {
    const { serverEnv } = require('./env.server');
    if (!serverEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase admin client not configured - missing environment variables');
      return null;
    }
    return createClient(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
    return null;
  }
})();

export type SupabaseClient = typeof supabase;
