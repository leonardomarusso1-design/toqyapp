'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function CheckoutGate({ plan, label, checkoutUrl }: { plan: string; label: string; checkoutUrl: string }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email?.trim().toLowerCase() ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="mt-7 flex w-full items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-bold text-muted"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando sua conta...</div>;
  }

  if (!email) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/checkout?plan=${plan}`)}`} className="btn-glow mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
        Criar conta para assinar <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  const url = `${checkoutUrl}${checkoutUrl.includes('?') ? '&' : '?'}toqy_email=${encodeURIComponent(email)}`;
  return (
    <div className="mt-7 space-y-3">
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 text-left text-xs text-ink">
        <p className="flex items-center gap-2 font-black"><CheckCircle2 className="h-4 w-4 text-accent" /> Conta conectada: {email}</p>
        <p className="mt-1 text-muted">No checkout, confirme que o e-mail da compra é exatamente este para ativar o plano automaticamente.</p>
      </div>
      <a href={url} target="_blank" rel="noreferrer noopener" className="btn-glow inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
        {label} <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

export function CheckoutSameEmailNotice() {
  return <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-semibold text-muted"><ShieldCheck className="h-4 w-4 text-accent" /> O plano é ativado pelo e-mail da conta. Use o mesmo e-mail no pagamento.</p>;
}
