import { createClient } from '@supabase/supabase-js';
import { clientEnv } from './env.client';

/**
 * Supabase Client for browser/client-side operations
 * Uses anon key which is safe to expose
 */
export const supabase = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
      }
    }
  }
);

/**
 * Supabase Admin Client for server-side operations
 * ONLY use on the server with service role key
 * Never expose service role key to client
 */
export const supabaseAdmin = (() => {
  if (typeof window !== 'undefined') {
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
      serverEnv.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          fetch: (url, options = {}) => {
            return fetch(url, {
              ...options,
              signal: AbortSignal.timeout(15000) // 15 second timeout
            });
          }
        }
      }
    );
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
    return null;
  }
})();

export type SupabaseClient = typeof supabase;
