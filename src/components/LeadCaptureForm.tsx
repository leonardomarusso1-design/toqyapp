"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import type { ToqySite } from "@/lib/types";

// Formulário de contato do bio site público (2026-09-07, referência
// Coonexta — vídeo do Leonardo: "Suas ferramentas de captura de
// público"). Renderizado por PublicBioSite quando o bloco "leadForm"
// está ligado (ver bodyBlocks.ts). Consentimento não é opcional: sem
// marcar o checkbox, o botão de enviar fica desabilitado — mesma régua
// de EbookLeadForm.tsx, adaptada pra um formulário de negócio local em
// vez de isca de marketing.
export function LeadCaptureForm({ site }: { site: ToqySite }) {
  const config = site.leadForm;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (!config?.enabled) return null;

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
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Não foi possível enviar.");
    }
  }

  if (status === "done") {
    return (
      <section className="mt-5 rounded-3xl border p-5 text-center" style={{ borderColor: "rgba(255,255,255,0.14)", background: site.theme.card }}>
        <Check className="mx-auto h-8 w-8 text-emerald-500" />
        <p className="mt-2 text-sm font-black" style={{ color: site.theme.text }}>Recebemos seu contato!</p>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-3xl border p-5" style={{ borderColor: "rgba(255,255,255,0.14)", background: site.theme.card, color: site.theme.text }}>
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
        <button
          type="submit"
          disabled={!consent || status === "sending" || !name || (!email && !phone)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: site.theme.primary }}
        >
          {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {config.buttonLabel || "Enviar"}
        </button>
      </form>
    </section>
  );
}
