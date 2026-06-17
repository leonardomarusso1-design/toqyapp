"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = "https://a092f2dbabc2f9d203d88a26e8c8b2cb@o4511526054264833.ingest.de.sentry.io/4511579227226192";

export function SentryInit() {
  useEffect(() => {
    // Inicializa o Sentry garantindo que está no cliente
    if (typeof window !== "undefined") {
      Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.01,
        environment: process.env.NODE_ENV ?? "production",
        integrations: [Sentry.replayIntegration()],
      });
    }
  }, []);

  return null;
}
