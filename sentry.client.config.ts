import * as Sentry from "@sentry/nextjs";

// Único ponto de init do Sentry no navegador (2026-09-06).
//
// Antes existiam DOIS: este arquivo e um componente <SentryInit /> no
// layout, que chamava Sentry.init() dentro de um useEffect. Em
// desenvolvimento o HMR reavalia o módulo do componente e o guard
// `getClient()` volta a ser nulo na cópia nova, então o Replay era
// iniciado por cima do que já estava rodando e o app quebrava com
// "Multiple Sentry Session Replay instances are not supported" — erro em
// tela cheia que derrubava QUALQUER página local. O componente foi
// removido e a integração de replay veio pra cá: init em escopo de
// módulo roda uma vez só, sem depender do ciclo de vida do React.
Sentry.init({
  dsn: "https://a092f2dbabc2f9d203d88a26e8c8b2cb@o4511526054264833.ingest.de.sentry.io/4511579227226192",
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,
  environment: process.env.NODE_ENV ?? "production",
  integrations: [Sentry.replayIntegration()],
});
