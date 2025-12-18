import { z } from 'zod';

const serverEnvSchema = z.object({
    AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
    // VFD keys are optional for local development; certain features will be disabled without them
    VFD_ACCESS_TOKEN: z.string().min(1, 'VFD_ACCESS_TOKEN is required').optional(),
    VFD_CONSUMER_KEY: z.string().min(1, 'VFD_CONSUMER_KEY is required').optional(),
    VFD_CONSUMER_SECRET: z.string().min(1, 'VFD_CONSUMER_SECRET is required').optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error('Environment validation failed (server):', errors);
    const missing = Object.entries(errors)
        .filter(([, v]) => Array.isArray(v) && v.length > 0)
        .map(([k]) => k);
    const hint = `Missing env vars: ${missing.join(', ')}. Create a .env.local with these values for local development. Example keys: ${missing.join(', ')}`;
    throw new Error(`Missing required server environment variables. ${hint}`);
}

export const serverEnv = parsed.data;
