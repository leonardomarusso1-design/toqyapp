import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingHeader } from "@/components/LandingHeader";
import { getNichePage, nichePages } from "@/data/nichePages";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export function generateStaticParams() {
  return nichePages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getNichePage(slug);
  if (!page) return {};
  return { title: page.title, description: page.metaDescription };
}

export default async function NichePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getNichePage(slug);
  if (!page) notFound();

  const onboardingHref = page.segmento ? `/onboarding?segmento=${encodeURIComponent(page.segmento)}` : "/onboarding";

  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/toqy-logo.svg" alt="TOQY" className="h-14 w-auto object-contain md:h-16" />
          </Link>
          <LandingHeader />
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-16 text-center lg:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">{page.kicker}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">{page.headline}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{page.subheadline}</p>
        <Link href={onboardingHref} className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-white">
          Criar meu bio site grátis <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-xs font-semibold text-muted">Sem cartão de crédito. Cancele quando quiser.</p>
      </section>

      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-6 md:grid-cols-3">
            {page.painPoints.map((p) => (
              <div key={p.title} className="rounded-[1.75rem] border border-border bg-bg p-7">
                <h3 className="text-lg font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.faq.map(([q, a]) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }),
        }}
      />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-2xl font-extrabold text-ink md:text-3xl">Perguntas frequentes</h2>
        <div className="mt-8 space-y-4">
          {page.faq.map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-bold text-ink">{q}</p>
              <p className="mt-1.5 text-sm text-muted">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card py-10 text-center text-xs text-muted">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <p>© {new Date().getFullYear()} Marusso Produções · <Link href="/termos" className="hover:text-accent">Termos</Link> · <Link href="/privacidade" className="hover:text-accent">Privacidade</Link></p>
        </div>
      </footer>
    </main>
  );
}
