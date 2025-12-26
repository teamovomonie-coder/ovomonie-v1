import { z } from 'zod';

const clientEnvSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
});

// During server-side build there may be no client env values available.
// Only perform strict validation when running in the browser.
let clientEnvData = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

if (typeof window !== 'undefined') {
    const parsed = clientEnvSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    if (!parsed.success) {
        console.error('Environment validation failed (client):', parsed.error.flatten().fieldErrors);
        throw new Error('Missing required client environment variables. Check your configuration.');
    }

    clientEnvData = parsed.data;
}

export const clientEnv = clientEnvData;
