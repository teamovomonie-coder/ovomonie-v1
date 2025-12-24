# Ovo Thrive App

Next.js + Firebase demo for financial workflows (payments, lending, commerce, mobility). Authentication now standardizes on `getUserIdFromToken(headers())`, validated env variables, and structured JSON logging for APIs.

## Quickstart
- Node 20+ and npm installed.
- Copy `.env.example` to `.env.local` (or Firebase hosting env) and fill in your Firebase keys plus a strong `AUTH_SECRET`.
- Install deps: `npm install`
- Dev server: `npm run dev`
- Lint/typecheck: `npm run lint` / `npm run typecheck`

## Authentication Hardening
- A codemod is available to normalize routes: `npm run fix:auth`
- Routes now call `getUserIdFromToken(headers())` from `src/lib/firestore-helpers.ts`, which validates signed tokens (and falls back to legacy demo tokens).
- Token signing/verifications live in `src/lib/auth.ts` and use `AUTH_SECRET` from validated env variables.

## Environment Validation
- Server env is validated in `src/lib/env.server.ts` (currently `AUTH_SECRET`).
- Client env is validated in `src/lib/env.client.ts` for Firebase config.
- Missing/invalid envs throw during startup with field-specific errors to prevent silent misconfiguration.

## Structured Logging
- `src/lib/logger.ts` emits JSON logs with timestamp/level/message/meta.
- API routes use `logger.info/error/warn` instead of `console.*` to keep logs parseable (works in local dev and serverless logs).

## Project Layout
- `src/app/api` and `src/api`: API routes (Next.js app router + legacy).
- `src/components`: UI components.
- `src/lib`: shared utilities (auth, Firebase, env validation, logger).
- `scripts/fix-auth.js`: one-off helper to migrate legacy token parsing.

## Deployment Notes
- Ensure all env vars from `.env.example` are set in your deployment environment.
- Run `npm run build` before deploying to Firebase Hosting/Cloud Functions.
- Review Firebase indexes referenced by API routes (auth/login mentions index creation when needed).
