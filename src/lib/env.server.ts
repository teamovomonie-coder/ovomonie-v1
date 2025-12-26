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

// Use safeParse so the build won't fail when certain server env vars
// are intentionally absent in the build environment (e.g., Vercel).
// Export a best-effort `serverEnv` object that other modules can inspect.
let serverEnv: Partial<z.infer<typeof serverEnvSchema>> = {};

const parsed = serverEnvSchema.safeParse(process.env);
if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error('Environment validation failed (server):', errors);
    const missing = Object.entries(errors)
        .filter(([, v]) => Array.isArray(v) && v.length > 0)
        .map(([k]) => k);
    const hint = `Missing env vars: ${missing.join(', ')}. Create a .env.local with these values for local development.`;
    console.warn('Server environment is incomplete:', hint);
    // Export whatever values are present so callers can make runtime decisions.
    serverEnv = {
        AUTH_SECRET: process.env.AUTH_SECRET,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        VFD_ACCESS_TOKEN: process.env.VFD_ACCESS_TOKEN,
        VFD_CONSUMER_KEY: process.env.VFD_CONSUMER_KEY,
        VFD_CONSUMER_SECRET: process.env.VFD_CONSUMER_SECRET,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    };
} else {
    serverEnv = parsed.data;
}

export { serverEnv };
