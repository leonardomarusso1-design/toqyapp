"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

// Mantenha em sincronia com CONSENT_VERSION em src/app/api/lead/route.ts:
// se o TEXTO do aceite abaixo mudar, a versão precisa mudar nos dois lados
// (2026-09-06, auditoria externa de LGPD).
export function EbookLeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Consentimento explícito e granular (2026-09-06, auditoria externa):
  // antes não havia checkbox nenhum — o envio do formulário era tratado
  // como aceite tácito, o que não serve como consentimento sob LGPD.
  // Começa desmarcado de propósito: caixa pré-marcada não é aceite livre.
  const [consent, setConsent] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        // Guarda a referência ANTES do await: depois de um await o
        // e.currentTarget do evento sintético do React já foi reciclado
        // e vira null, o que quebrava o .reset() do sucesso.
        const form = e.currentTarget;
        const formData = new FormData(form);
        const name = String(formData.get("name") || "");
        const email = String(formData.get("email") || "");

        // Barreira no cliente (a do servidor é a que vale) para não
        // enviar um cadastro sem aceite.
        if (!consent) {
          alert("Marque o aceite para receber o ebook.");
          return;
        }

        setIsSubmitting(true);

        try {
          const res = await fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, consent: true }),
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            alert("Obrigado! Verifique seu email para baixar o ebook.");
            form.reset();
            setConsent(false);
          } else {
            // Mostra a mensagem do servidor, que distingue "não
            // conseguimos registrar" de "registramos mas o e-mail não saiu".
            alert(data?.error || "Houve um erro, tente novamente.");
          }
        } catch (err) {
          console.error(err);
          alert("Houve um erro, tente novamente.");
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="mt-6 space-y-4"
    >
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide">Nome</label>
        <input name="name" type="text" required maxLength={120} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Seu nome" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide">Email</label>
        <input name="email" type="email" required maxLength={254} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="seu@email.com" />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-left text-xs leading-relaxed text-white/80">
        <input
          name="consent"
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/30 bg-white/10 accent-accent"
        />
        <span>
          Autorizo o Toqy a usar meu nome e e-mail para me enviar o ebook e
          comunicações sobre a plataforma. Posso cancelar a qualquer momento
          respondendo a um dos e-mails. Li a{" "}
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-2"
          >
            Política de Privacidade
          </a>
          .
        </span>
      </label>

      <button type="submit" disabled={isSubmitting || !consent} className="btn-glow w-full rounded-full px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Enviando..." : "Baixar ebook grátis"} {!isSubmitting && <ArrowRight className="ml-2 inline h-4 w-4" />}
      </button>
    </form>
  );
}
