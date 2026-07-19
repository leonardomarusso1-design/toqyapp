"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function EbookLeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      const formData = new FormData(e.currentTarget);
      const name = String(formData.get("name") || "");
      const email = String(formData.get("email") || "");
      
      try {
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        
        if (res.ok) {
          alert("Obrigado! Verifique seu email para baixar o ebook.");
          e.currentTarget.reset();
        } else {
          alert("Houve um erro, tente novamente.");
        }
      } catch (err) {
        console.error(err);
        alert("Houve um erro, tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    }} className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide">Nome</label>
        <input name="name" type="text" required className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Seu nome" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide">Email</label>
        <input name="email" type="email" required className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="seu@email.com" />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-glow w-full rounded-full px-6 py-3 text-sm font-bold text-white">
        {isSubmitting ? "Enviando..." : "Baixar ebook grátis"} {!isSubmitting && <ArrowRight className="ml-2 inline h-4 w-4" />}
      </button>
    </form>
  );
}
