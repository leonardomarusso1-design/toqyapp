'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { KIWIFY_LINKS, type PlanType } from '@/lib/subscriptions';

const PLAN_NAMES: Record<Exclude<PlanType, 'free'>, string> = {
  pro: 'Pro',
  community: 'Essencial',
  freelancer: 'Freelancer',
  agency: 'Agência',
};

function CheckoutPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get('plan') as Exclude<PlanType, 'free'> | null;
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const validPlan = plan && plan in PLAN_NAMES ? plan : null;
  const checkoutUrl = useMemo(() => validPlan ? KIWIFY_LINKS[validPlan] : null, [validPlan]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionEmail = data.session?.user.email?.trim().toLowerCase() ?? null;
      if (!sessionEmail) {
        router.replace(`/login?next=${encodeURIComponent(`/checkout?plan=${plan ?? ''}`)}`);
        return;
      }
      setEmail(sessionEmail);
      setLoading(false);
    });
  }, [plan, router]);

  if (!validPlan || !checkoutUrl) return <main className="flex min-h-screen items-center justify-center bg-bg p-6 text-center"><div><h1 className="text-2xl font-black text-ink">Plano não encontrado</h1><Link href="/" className="mt-4 inline-block font-bold text-accent">Voltar para os planos</Link></div></main>;
  if (loading) return <main className="flex min-h-screen items-center justify-center bg-bg text-muted"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verificando sua conta...</main>;

  const url = `${checkoutUrl}${checkoutUrl.includes('?') ? '&' : '?'}toqy_email=${encodeURIComponent(email ?? '')}`;
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-12 text-ink">
      <section className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 shadow-xl md:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent"><ShieldCheck className="h-7 w-7" /></div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-accent">Antes do pagamento</p>
        <h1 className="mt-2 text-3xl font-black">Assinar o plano {PLAN_NAMES[validPlan]}</h1>
        <p className="mt-4 leading-relaxed text-muted">Sua conta já está criada. Para que a ativação seja automática, faça a compra usando exatamente o mesmo e-mail abaixo.</p>
        <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 p-4"><p className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5 text-accent" /> {email}</p></div>
        <a href={url} target="_blank" rel="noreferrer noopener" className="btn-glow mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 font-black text-white">Continuar para o pagamento <ExternalLink className="h-5 w-5" /></a>
        <p className="mt-4 text-center text-xs font-semibold text-muted">O Toqy procura o pagamento pelo e-mail informado na Kiwify. Se usar outro e-mail, o plano não será vinculado a esta conta.</p>
      </section>
    </main>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-bg text-muted"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando checkout...</main>}><CheckoutPageInner /></Suspense>;
}
