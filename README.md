# Ovo Thrive App

Next.js + Supabase fintech application for comprehensive financial workflows (payments, lending, commerce, mobility). Features secure token-based authentication, validated environment variables, and structured JSON logging.

## Quickstart
- Node 20+ and npm installed.
- Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials plus a strong `AUTH_SECRET`.
- Install deps: `npm install`
- Dev server: `npm run dev`
- Lint/typecheck: `npm run lint` / `npm run typecheck`

## Authentication
- Token-based authentication with HMAC-SHA256 signing
- Routes call `getUserIdFromToken(headers())` from `src/lib/auth-helpers.ts`
- Token signing/verification in `src/lib/auth.ts` using `AUTH_SECRET`
- PIN rate limiting to prevent brute force attacks
- Biometric authentication support

## Environment Validation
- Server env validated in `src/lib/env.server.ts` (AUTH_SECRET, Supabase keys, VFD credentials)
- Client env validated in `src/lib/env.client.ts` (Supabase public config)
- Missing/invalid envs throw during startup with field-specific errors

## Structured Logging
- `src/lib/logger.ts` emits JSON logs with timestamp/level/message/meta
- API routes use `logger.info/error/warn` for parseable logs

## Project Layout
- `src/app/api`: API routes (Next.js 15 app router)
- `src/components`: UI components (React + Tailwind + shadcn/ui)
- `src/lib`: Shared utilities (auth, Supabase, validation, logger)
- `src/context`: React contexts (auth, notifications)
- `supabase/migrations`: Database schema migrations

## Deployment Notes
- Ensure all env vars from `.env.local.example` are set in deployment environment
- Run `npm run build` to verify production build
- Configure Supabase connection pooling for production
- Set up proper CORS origins (remove wildcard in middleware)
- Enable database backups and monitoring
