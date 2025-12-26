import { z } from 'zod';

const serverEnvSchema = z.object({
    AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
    // VFD keys are optional for local development; certain features will be disabled without them
    VFD_ACCESS_TOKEN: z.string().optional(),
    VFD_CONSUMER_KEY: z.string().optional(),
    VFD_CONSUMER_SECRET: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
});

let serverEnv: z.infer<typeof serverEnvSchema>;

try {
    const parsed = serverEnvSchema.parse(process.env);
    serverEnv = parsed;
} catch (error) {
    if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        console.error('Environment validation failed (server):', errors);
        const missing = Object.entries(errors)
            .filter(([, v]) => Array.isArray(v) && v.length > 0)
            .map(([k]) => k);
        const hint = `Missing env vars: ${missing.join(', ')}. Create a .env.local with these values for local development.`;
        throw new Error(`Missing required server environment variables. ${hint}`);
    }
    throw error;
}

export { serverEnv };
