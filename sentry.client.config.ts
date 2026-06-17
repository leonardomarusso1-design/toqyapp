import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a092f2dbabc2f9d203d88a26e8c8b2cb@o4511526054264833.ingest.de.sentry.io/4511579227226192",
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,
  environment: process.env.NODE_ENV ?? "production",
});
