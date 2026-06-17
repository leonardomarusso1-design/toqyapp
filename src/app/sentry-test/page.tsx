"use client";
import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 text-white">
      <img src="/brand/logo-toqy-horizontal-white.png" alt="TOQY" className="h-8 w-auto" />
      <h1 className="text-2xl font-black">Teste do Sentry</h1>
      <div className="flex gap-4">
        <button
          className="rounded-2xl bg-red-600 px-6 py-3 font-black text-white hover:bg-red-700"
          onClick={() => { throw new Error("Teste manual Sentry TOQY — erro de cliente"); }}
        >
          Disparar erro de cliente
        </button>
        <button
          className="rounded-2xl bg-orange-600 px-6 py-3 font-black text-white hover:bg-orange-700"
          onClick={() => {
            Sentry.captureMessage("Teste Sentry TOQY — mensagem manual", "info");
            alert("Mensagem enviada ao Sentry!");
          }}
        >
          Enviar mensagem
        </button>
      </div>
      <p className="text-sm text-slate-400">Esta página é apenas para testes. Remova após confirmar que o Sentry funciona.</p>
    </main>
  );
}
