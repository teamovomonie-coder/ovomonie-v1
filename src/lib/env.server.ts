import { z } from 'zod';

const serverEnvSchema = z.object({
    AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Environment validation failed (server):', parsed.error.flatten().fieldErrors);
    throw new Error('Missing required server environment variables. Check your configuration.');
}

export const serverEnv = parsed.data;
