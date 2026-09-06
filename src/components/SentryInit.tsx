"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = "https://a092f2dbabc2f9d203d88a26e8c8b2cb@o4511526054264833.ingest.de.sentry.io/4511579227226192";

export function SentryInit() {
  useEffect(() => {
    // Inicializa o Sentry garantindo que está no cliente.
    //
    // `getClient()` evita init duplicado (2026-09-06): em desenvolvimento
    // o React roda o efeito duas vezes (StrictMode) e o HMR remonta o
    // componente a cada edição, então o Sentry era iniciado de novo por
    // cima de si mesmo e explodia com "Multiple Sentry Session Replay
    // instances are not supported" — um erro em tela cheia que derrubava
    // QUALQUER página local, tornando impossível conferir mudança visual
    // no navegador. Não afetava produção, mas cegava o desenvolvimento.
    if (typeof window !== "undefined" && !Sentry.getClient()) {
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
