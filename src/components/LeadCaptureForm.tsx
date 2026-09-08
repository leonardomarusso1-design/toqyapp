"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import type { ToqySite } from "@/lib/types";

// Formulário de contato do bio site público (2026-09-07, referência
// Coonexta — vídeo do Leonardo: "Suas ferramentas de captura de
// público"). Virou MODAL sobreposto em 2026-09-08 (pedido real: "deveria
// aparecer sobreposto, com pouca opacidade em cima do biosite, quando
// aberto pela primeira vez... se não quiser, clica em recusar, e não
// aparece mais pra pessoa... não ficar jogado no meio do biosite") —
// antes era um bloco fixo dentro do corpo, competindo espaço com
// catálogo/botões/etc (ver PublicBioSite.tsx, o loop de blocos agora
// pula "leadForm" de propósito).
//
// "Não aparece mais pra pessoa" — rastreado no localStorage do PRÓPRIO
// navegador de quem visita (chave por bio site, nunca por servidor: não
// tem conta nem cookie de sessão do lado do visitante). Preso ao
// navegador/aparelho, não à pessoa — reinstalar o navegador ou visitar
// de outro aparelho mostra de novo. Suficiente pro pedido real (não
// insistir MAIS DE UMA VEZ pro MESMO visitante que já disse não) sem
// precisar de conta/cookie de rastreamento novo.
function dismissKey(siteId: string) {
  return `toqy-lead-dismissed-${siteId}`;
}

export function LeadCaptureModal({ site, isPublicInstance }: { site: ToqySite; isPublicInstance: boolean }) {
  const config = site.leadForm;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    // Só na página pública de verdade (nunca no preview do editor, ver
    // mesmo raciocínio de `enableBackgroundMusic`/analytics acima em
    // PublicBioSite.tsx) e só se ainda não foi recusado/preenchido
    // neste navegador.
    if (!isPublicInstance || !config?.enabled) return;
    try {
      if (localStorage.getItem(dismissKey(site.id))) return;
    } catch { /* localStorage indisponível (aba anônima restrita, etc.) — mostra normalmente */ }

    // Pequeno atraso pra não competir com o primeiro instante de carga
    // da página (a pessoa vê o bio site antes do formulário aparecer
    // por cima).
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [isPublicInstance, config?.enabled, site.id]);

  function dismissForever() {
    try { localStorage.setItem(dismissKey(site.id), "1"); } catch { /* ok ignorar */ }
    setOpen(false);
  }

  if (!config?.enabled || !open) return null;

  const askEmail = config.askEmail !== false; // padrão: pergunta e-mail
  const askPhone = config.askPhone === true;
  const askMessage = config.askMessage === true;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/biosite-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bioSiteId: site.id, name, email, phone, message, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível enviar.");
      setStatus("done");
      try { localStorage.setItem(dismissKey(site.id), "1"); } catch { /* ok ignorar */ }
      setTimeout(() => setOpen(false), 1800);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Não foi possível enviar.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-[2px] sm:items-center">
      <div className="w-full max-w-sm rounded-3xl border p-5 shadow-2xl" style={{ borderColor: "rgba(255,255,255,0.14)", background: site.theme.card, color: site.theme.text }}>
        {status === "done" ? (
          <div className="py-4 text-center">
            <Check className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-sm font-black">Recebemos seu contato!</p>
          </div>
        ) : (
          <>
            <p className="text-base font-black">{config.title || "Deixe seu contato"}</p>
            {config.subtitle ? <p className="mt-1 text-sm opacity-80">{config.subtitle}</p> : null}
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full rounded-2xl border border-white/15 bg-black/10 px-4 py-3 text-sm outline-none placeholder:opacity-60" />
              {askEmail ? <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" className="w-full rounded-2xl border border-white/15 bg-black/10 px-4 py-3 text-sm outline-none placeholder:opacity-60" /> : null}
              {askPhone ? <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Seu telefone" className="w-full rounded-2xl border border-white/15 bg-black/10 px-4 py-3 text-sm outline-none placeholder:opacity-60" /> : null}
              {askMessage ? <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensagem (opcional)" rows={3} className="w-full rounded-2xl border border-white/15 bg-black/10 px-4 py-3 text-sm outline-none placeholder:opacity-60" /> : null}
              <label className="flex items-start gap-2 text-xs opacity-80">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                Autorizo o uso destes dados para que este negócio entre em contato comigo.
              </label>
              {error ? <p className="text-xs font-bold text-red-400">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={dismissForever}
                  className="flex-1 rounded-2xl border px-4 py-3 text-sm font-black opacity-80 transition hover:opacity-100"
                  style={{ borderColor: "rgba(255,255,255,0.2)" }}
                >
                  Recusar
                </button>
                <button
                  type="submit"
                  disabled={!consent || status === "sending" || !name || (!email && !phone)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: site.theme.primary }}
                >
                  {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {config.buttonLabel || "Enviar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
