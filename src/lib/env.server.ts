import { z } from 'zod';

const serverEnvSchema = z.object({
    AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
    VFD_ACCESS_TOKEN: z.string().min(1, 'VFD_ACCESS_TOKEN is required'),
    VFD_CONSUMER_KEY: z.string().min(1, 'VFD_CONSUMER_KEY is required'),
    VFD_CONSUMER_SECRET: z.string().min(1, 'VFD_CONSUMER_SECRET is required'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Environment validation failed (server):', parsed.error.flatten().fieldErrors);
    throw new Error('Missing required server environment variables. Check your configuration.');
}

export const serverEnv = parsed.data;
