import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  environment: process.env.NODE_ENV,
  
  beforeSend(event, hint) {
    // Don't send errors from health checks
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }
    return event;
  },
});
