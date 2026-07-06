import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingBioSiteCard } from "@/components/LandingBioSiteCard";
import { APP_VERSION, BUILD_ID } from "@/lib/appInfo";
import { getShowcaseSummaries } from "@/lib/realTemplates";
import { segmentOptions } from "@/lib/segmentTemplates";
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Globe,
  MapPin,
  MessageCircle,
  PlayCircle,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
  Wifi,
  BriefcaseBusiness,
  CalendarCheck,
  Zap,
  Clock3,
  HelpCircle,
  Heart,
} from "lucide-react";

const features = [
  ["WhatsApp", "Atendimento direto com mensagem pronta.", MessageCircle],
  ["Pix", "Chave, QR Code e comprovante pelo WhatsApp.", CreditCard],
  ["Wi-Fi", "QR Code para conectar e copiar senha.", Wifi],
  ["Catálogo", "Produtos e serviços com foto, preço e CTA.", ShoppingBag],
  ["Localização", "Google Maps e rota em um toque.", MapPin],
  ["Agendamento", "Link de agenda ou sistema externo.", CalendarCheck],
  ["QR/NFC", "URL permanente para plaquinhas e chips.", QrCode],
  ["Chave do cliente", "Cliente edita sem acessar o painel admin.", ShieldCheck],
] as const;

const plans = [
  { name: "Gratuito", price: "R$0", period: "", description: "Para conhecer a plataforma e gerar seus primeiros leads.", highlight: false, cta: "Começar grátis", items: ["1 bio site", "Domínio toqy.app/seunome", "QR Code básico", "Preview em tempo real", "Marca TOQY na página"] },
  { name: "Comunidade", price: "R$29,90", period: "/mês", description: "Acesso exclusivo para alunos. Crie páginas profissionais para seus clientes.", highlight: true, cta: "Assinar", items: ["Até 20 bio sites inclusos", "Apenas R$5,00 por site extra", "Catálogo, Pix e Wi-Fi", "QR personalizado e NFC", "Suporte direto no Discord"] },
  { name: "Freelancer", price: "R$59,90", period: "", description: "Para profissionais que criam para clientes, sem estar na comunidade. Pagamento unico.", highlight: false, cta: "Comprar acesso", items: ["Até 20 bio sites", "QR personalizado", "Pix e Wi-Fi", "Catálogo completo", "Suporte prioritário"] },
  { name: "Agência", price: "R$149,90", period: "", description: "Para equipes e agências em escala. Pagamento unico.", highlight: false, cta: "Comprar acesso", items: ["Até 100 bio sites", "White label parcial", "Domínio próprio", "Gestão de equipe", "Tudo do Freelancer"] },
] as const;

const featureShowcase = [
  { title: "Editor visual com preview ao vivo", text: "Personalize paletas, botões, fundos, logo e módulos sem mexer em código.", image: "/images/landing-feature-editor-preview.png", alt: "Editor visual do TOQY com preview ao vivo" },
  { title: "Onboarding guiado pra criar pro cliente", text: "Um passo a passo simples — negócio, localização, visual, contato — pra criar o bio site do seu cliente em minutos.", image: "/images/landing-feature-onboarding.png", alt: "Onboarding guiado para criar bio site de cliente" },
  { title: "Pix inteligente", text: "Receba pagamentos com Pix, chave copiável, QR Code e envio de comprovante pelo WhatsApp.", image: "/images/landing-feature-pix.png", alt: "Módulo Pix inteligente com QR Code" },
  { title: "Wi-Fi com check-in", text: "Gere QR Code de Wi-Fi, facilite a conexão e direcione o cliente para avaliação no Google, Instagram ou Facebook.", image: "/images/landing-feature-wifi-checkin.png", alt: "Wi-Fi com check-in e avaliação" },
  { title: "Catálogo flexível", text: "Mostre produtos e serviços em carrossel, grid, categorias ou lista vertical.", image: "/images/landing-feature-catalogo.png", alt: "Catálogo de produtos e serviços no TOQY" },
] as const;

const testimonials = [
  { name: "Marina", text: "Usei o Toqy para vender biosites como serviço e fechei meus primeiros clientes em uma semana.", image: "" },
  { name: "Caio", text: "O visual ficou mais profissional e meu catálogo começou a converter melhor no WhatsApp.", image: "" },
  { name: "Lívia", text: "Agora consigo mostrar valor antes mesmo do cliente pedir orçamento.", image: "" },
  { name: "André", text: "Entrego biosites prontos no mesmo dia. Minha agência ganhou um produto novo.", image: "" },
] as const;

const businessUseCases = [
  { title: "Empresas e serviços", icon: Building2, text: "Institucional, orçamento, atendimento e links estratégicos." },
  { title: "Lojas e restaurantes", icon: Store, text: "Catálogo, promoções, localização e pedido rápido." },
  { title: "Freelancer e agências", icon: BriefcaseBusiness, text: "Venda biosites como produto e crie renda recorrente." },
] as const;

const savings = [
  { label: "Designer + copy + editor", value: "R$ 650/mês" },
  { label: "Tempo manual por biosite", value: "4 a 8 horas" },
  { label: "Com Toqy", value: "minutos" },
] as const;

// Lista de "instagrams" que passam no marquee (duplicada pra loop perfeito)
const instagramStrip = [
  "@studio.toqy",
  "@bioempresas",
  "@vendacomtoqy",
  "@freela.bio",
  "@lojas.toqy",
  "@agencia.bio",
  "@marina.digital",
  "@caio.agencia",
  "@livia.freela",
  "@andre.lojas",
];

const steps = [
  { n: "1", title: "Escolha o segmento", text: "Comece a partir de um modelo pronto para o nicho do cliente e personalize em segundos.", image: "/images/landing-step-escolha-segmento.png" },
  { n: "2", title: "O Toqy monta tudo", text: "Editor visual gera logo, cores, botões, catálogo, Pix e Wi-Fi — sem código.", image: "/images/landing-step-toqy-monta.png" },
  { n: "3", title: "Publique e venda", text: "Compartilhe por QR Code, NFC ou link. O cliente edita quando quiser com a chave.", image: "/images/landing-step-publique-venda.png" },
] as const;

const SEGMENT_LABELS = Object.fromEntries(segmentOptions.map((item) => [item.value, item.label])) as Record<string, string>;

export default async function LandingPage() {
  const showcaseSummaries = await getShowcaseSummaries();
  const showcaseBySegment = showcaseSummaries.reduce<Record<string, typeof showcaseSummaries>>((acc, summary) => {
    const key = summary.segment || "outro";
    acc[key] = [...(acc[key] ?? []), summary];
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-bg text-ink">
      {/* Barra de anúncio (estática) */}
      <div className="bg-ink text-white">
        <div className="flex items-center justify-center px-4 py-2.5 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Toqy cria biosites premium para empresas, lojas e profissionais em minutos.
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="h-14 w-auto object-contain md:h-16" />
          </Link>
          <nav className="hidden items-center gap-9 text-sm font-semibold text-muted md:flex">
            <a className="transition hover:text-accent" href="#video">Vídeo</a>
            <a className="transition hover:text-accent" href="#verdade">Por que importa</a>
            <a className="transition hover:text-accent" href="#recursos">Recursos</a>
            <a className="transition hover:text-accent" href="#exemplos">Exemplos</a>
            <a className="transition hover:text-accent" href="#planos">Planos</a>
          </nav>
          <LandingHeader />
        </div>
      </header>

      {/* HERO + VÍDEO (no topo) */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="shimmer-line h-1 w-full" />
        {/* blobs animados */}
        <div className="blob float-slow -left-24 top-10 h-72 w-72 bg-accent/30" />
        <div className="blob float-slow right-0 top-32 h-80 w-80 bg-violet/30" style={{ animationDelay: "1.2s" }} />
        <div className="blob float-slow bottom-0 left-1/3 h-72 w-72 bg-[#ffc850]/30" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-7xl px-5 py-16 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="pill inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-accent-dim shadow-sm fade-up">
                <Sparkles className="h-4 w-4 text-accent" /> Biosites premium para empresas, lojas e renda extra
              </span>
              <h1 className="fade-up mt-6 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink md:text-4xl lg:text-5xl" style={{ animationDelay: "0.05s" }}>
                Biosites que <span className="gradient-text">vendem mais</span> e ficam prontos em minutos.
              </h1>
              <p className="fade-up mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg" style={{ animationDelay: "0.1s" }}>
                Crie páginas profissionais com WhatsApp, Pix, Wi-Fi, catálogo, localização e avaliações. Para empresas, lojas, profissionais ou para vender como renda extra.
              </p>
              <div className="fade-up mt-7 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.15s" }}>
                <Link href="/login" className="btn-glow inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white">
                  Quero criar meu Toqy <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#video" className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-7 py-3 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent">
                  <PlayCircle className="h-4 w-4 text-accent" /> Assistir vídeo
                </a>
              </div>
              <div className="fade-up mt-6 flex flex-wrap gap-3 text-xs font-semibold text-muted" style={{ animationDelay: "0.2s" }}>
                {[
                  ["Grátis para começar", Check],
                  ["Sem código", Zap],
                  ["Publica em minutos", Clock3],
                ].map(([t, Icon]) => (
                  <span key={t as string} className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5">
                    <Icon className="h-3.5 w-3.5 text-accent" /> {t as string}
                  </span>
                ))}
              </div>
            </div>

            {/* VÍDEO ao lado do título */}
            <div id="video" className="fade-up relative" style={{ animationDelay: "0.25s" }}>
              <div className="gradient-border p-2 shadow-2xl">
                <div className="aspect-video overflow-hidden rounded-[1.25rem] bg-[linear-gradient(135deg,#fff,#fbe9ee)]">
                  <div className="relative flex h-full items-center justify-center">
                    <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,77,109,0.18)_1px,transparent_0)] [background-size:22px_22px]" />
                    <div className="relative text-center">
                      <button className="group relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-xl transition hover:scale-105">
                        <PlayCircle className="h-8 w-8" />
                        <span className="absolute inset-0 rounded-full bg-accent/40 pulse-soft" />
                      </button>
                      <p className="mt-4 text-base font-extrabold text-ink">Vídeo de apresentação do Toqy</p>
                      <p className="mt-1 text-xs text-muted">Coloque aqui um vídeo curto explicando o produto.</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-muted">
                Demonstração completa · Usuário real em ação
              </p>
            </div>
          </div>

          {/* Marquee de Instagram (passando da esquerda pra direita) */}
          <div className="marquee-group relative mt-14 overflow-hidden py-2">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#f8f5ef] to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#f8f5ef] to-transparent" />
            <div className="marquee marquee-left gap-4">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex shrink-0 items-center gap-4">
                  {instagramStrip.map((handle, i) => (
                    <span
                      key={`${dup}-${i}`}
                      className="group inline-flex items-center gap-3 rounded-full border border-border bg-white px-5 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-accent"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#ff4d6d] via-[#ff8a5b] to-[#ffc850] text-white shadow-md">
                        <span className="font-display text-sm font-bold">{handle.replace("@", "").charAt(0).toUpperCase()}</span>
                      </span>
                      <span className="text-sm font-bold text-ink">{handle}</span>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-black uppercase text-accent-dim">Toqy</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* A VERDADE */}
      <section id="verdade" className="relative overflow-hidden border-y border-border bg-card py-20">
        <div className="shimmer-line absolute left-0 top-0 h-1 w-full" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">A verdade que ninguém te conta</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              Biosite não é enfeite. É a <span className="gradient-text">primeira impressão</span> do seu cliente.
            </h2>
            <p className="mt-5 text-lg text-muted">
              Quem toca numa plaquinha ou escaneia um QR Code decide em segundos se confia no negócio. Um biosite bem feito transmite profissionalismo, centraliza os contatos e acelera a venda. Sem biosite, você perde cliente todo dia — sem saber.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="btn-glow inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white">
                Quero parar de perder cliente <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#planos" className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-bold text-ink transition hover:border-accent">
                Ver planos
              </a>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              ["7 em 10", "clientes avaliam a empresa pela aparência digital antes de comprar", TrendingUp],
              ["3 segundos", "é o tempo médio pra decidir se vai continuar ou sair da página", Clock3],
              ["+R$650/mês", "é o que se gasta montando isso manualmente com designer e ferramentas", CreditCard],
            ].map(([big, small, Icon]) => (
              <div key={big as string} className="card-glow flex items-center gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-ink">{big as string}</p>
                  <p className="text-sm text-muted">{small as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 PASSOS */}
      <section id="como-funciona" className="bg-bg py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Em 3 passos</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Tão simples que parece mágica</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">3 passos. Poucos minutos. Biosite pronto pra vender.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <article key={s.n} className="card-glow relative rounded-[1.75rem] border border-border bg-card p-8 shadow-sm">
                <span className="gradient-text text-6xl font-extrabold">{s.n}</span>
                <h3 className="mt-4 text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                {s.image ? (
                  <div className="mt-5 flex h-56 w-full items-center justify-center rounded-2xl bg-bg p-3">
                    <img src={s.image} alt={s.title} className="max-h-full max-w-full rounded-lg object-contain" />
                  </div>
                ) : (
                  <div className="mt-5 flex h-56 w-full items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface text-xs font-semibold text-muted">
                    Espaço para imagem
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAÇA AS CONTAS + USOS */}
      <section className="bg-card py-20 border-y border-border">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="gradient-border card-glow p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Faça as contas</p>
              <h2 className="mt-3 text-3xl font-extrabold text-ink">Quanto você pagaria por tudo isso separado?</h2>
              <div className="mt-6 grid gap-3">
                {savings.map((item) => {
                  const isSaving = item.label === "Com Toqy";
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 ${
                        isSaving ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50/60"
                      }`}
                    >
                      <span className={`text-sm font-semibold ${isSaving ? "text-emerald-800" : "text-red-800/80"}`}>{item.label}</span>
                      <span className={`text-sm font-black ${isSaving ? "text-emerald-700" : "text-red-700"}`}>{item.value}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-2xl border-2 border-emerald-300 bg-ink px-5 py-4 text-white">
                <p className="text-sm font-semibold">No Toqy você paga pouco e entrega biosites premium no mesmo dia.</p>
              </div>
            </article>

            <article className="card-glow rounded-[1.75rem] border border-border bg-[linear-gradient(135deg,#fff,#fef2f4)] p-8 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Usos do Toqy</p>
              <h2 className="mt-3 text-3xl font-extrabold text-ink">Para empresa, loja, profissional ou renda extra</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["Empresas", Globe],
                  ["Comércio local", ShoppingBag],
                  ["Agências", Users],
                ].map(([label, Icon]) => (
                  <div key={label as string} className="rounded-2xl border border-border bg-white p-5 text-center transition hover:-translate-y-1">
                    <Icon className="mx-auto h-6 w-6 text-accent" />
                    <p className="mt-3 text-sm font-bold text-ink">{label as string}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {businessUseCases.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border bg-white p-5">
                    <item.icon className="h-6 w-6 text-accent" />
                    <h3 className="mt-3 text-base font-bold text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-accent/10 to-violet/10 px-5 py-4">
                <TrendingUp className="h-6 w-6 text-accent" />
                <p className="text-sm font-semibold text-ink">Venda biosites como serviço recorrente e gere renda extra todo mês.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Recursos</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Tudo que uma plaquinha precisa abrir</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">O Toqy concentra atendimento, pagamento, localização, catálogo e avaliação em uma página pronta para QR Code e NFC.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, text, Icon]) => (
            <article key={title} className="card-glow rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </article>
          ))}
        </div>
        <img
          src="/images/landing-recursos-infographic.png"
          alt="Por que um bio site profissional importa"
          className="card-glow mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-border shadow-sm"
        />
      </section>

      {/* SHOWCASE */}
      <section className="bg-card py-20 border-y border-border">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 lg:grid-cols-2">
            {featureShowcase.map((item) => (
              <article key={item.title} className="card-glow overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="flex h-72 items-center justify-center bg-bg p-4">
                  <img src={item.image} alt={item.alt} className="max-h-full max-w-full rounded-lg object-contain" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-20">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Depoimentos</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Quem usa sente a diferença</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-muted md:flex">
            <Star className="h-4 w-4 text-accent" /> prova social e percepção premium
          </div>
        </div>
        <div className="marquee-group relative mt-10 overflow-hidden py-2">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#f7f5f1] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#f7f5f1] to-transparent" />
          <div className="marquee marquee-left gap-6">
            {[...Array(2)].map((_, dup) => (
              <div key={dup} className="flex shrink-0 items-center gap-6">
                {testimonials.map((t) => (
                  <article key={`${dup}-${t.name}`} className="card-glow w-64 shrink-0 rounded-2xl border border-border bg-white p-4 shadow-sm">
                    {t.image ? (
                      <img src={t.image} alt={`Depoimento de ${t.name}`} className="aspect-[3/4] w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface p-4 text-center">
                        <div className="flex items-center gap-1 text-accent">
                          {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="h-3.5 w-3.5 fill-current" />)}
                        </div>
                        <p className="text-xs leading-relaxed text-muted">{t.text}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted/70">Espaço para print real</p>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#ff4d6d] via-[#ff8a5b] to-[#ffc850] text-xs font-bold text-white">
                        {t.name.charAt(0)}
                      </span>
                      <p className="text-sm font-bold text-ink">{t.name}</p>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Planos</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Escolha o plano ideal para o seu negócio</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-2xl border bg-card p-7 shadow-sm ${plan.highlight ? "border-accent shadow-xl shadow-accent/10 glow-pulse" : "border-border card-glow"}`}>
              {plan.highlight ? <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-5 py-2 text-xs font-extrabold text-white uppercase tracking-wider">Mais popular</span> : null}
              <h3 className="text-2xl font-bold text-ink">{plan.name}</h3>
              <p className="mt-2 min-h-[4rem] text-sm text-muted">{plan.description}</p>
              <p className="mt-4 text-4xl font-extrabold text-ink">{plan.price}<span className="text-base font-bold text-muted">{plan.period}</span></p>
              <div className="mt-6 grid gap-3 flex-1">
                {plan.items.map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm font-semibold text-ink/80">
                    <Check className="h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </p>
                ))}
              </div>
              <a href={plan.name === "Comunidade" ? "https://pay.kiwify.com.br/12uYE0c" : plan.name === "Freelancer" ? "https://pay.kiwify.com.br/gTIhv6I" : plan.name === "Agência" ? "https://pay.kiwify.com.br/xFdnxvE" : "/login"} target={plan.name === "Gratuito" ? undefined : "_blank"} rel={plan.name === "Gratuito" ? undefined : "noreferrer noopener"} className={`mt-7 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${plan.highlight ? "btn-glow text-white" : "border border-border text-ink hover:border-accent"}`}>
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* EXEMPLOS — biosites reais criados com o Toqy */}
      <section id="exemplos" className="bg-card py-20 border-t border-border">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Biosites criados com o Toqy</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Modelos por segmento</h2>
              <p className="mt-2 text-base text-muted">Biosites reais, em produção agora, criados por quem já usa o Toqy. Toque em qualquer celular para abrir o biosite de verdade.</p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-ink/80"><Plus className="h-4 w-4" />Novo bio site</Link>
          </div>

          {Object.keys(showcaseBySegment).length ? (
            <div className="mt-10 space-y-10">
              {Object.entries(showcaseBySegment).map(([segment, sites]) => (
                <div key={segment}>
                  <h3 className="text-lg font-black text-ink">{SEGMENT_LABELS[segment] ?? "Outros negócios"}</h3>
                  <div className="mt-5 flex gap-5 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: "none" }}>
                    {sites.map((summary) => (
                      <LandingBioSiteCard key={summary.slug} slug={summary.slug} publicUrl={`https://www.toqy.com.br/b/${summary.slug}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-muted">Cada bio site é único — você personaliza logo, cores, botões, catálogo e muito mais.</p>
        </div>
      </section>

      {/* PRECISA DE AJUDA? */}
      <section className="bg-ink py-20 text-white">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-accent">
            <HelpCircle className="h-8 w-8" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Precisa de ajuda?</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Nossa equipe está aqui para você</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">Fale com a nossa central de suporte pelo canal que preferir. Respondemos rápido e estamos sempre prontos para ajudar.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="https://wa.me/5519997051919" target="_blank" rel="noreferrer noopener" className="btn-glow inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold text-white">
              <MessageCircle className="h-5 w-5" /> Falar com o suporte
            </a>
            <a href="#faq" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10">
              Ver dúvidas frequentes
            </a>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-bg px-5 py-20 text-center border-t border-border">
        <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Crie uma página profissional para seu cliente em poucos minutos.</h2>
        <Link href="/login" className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-white">Começar agora <ArrowRight className="h-4 w-4" /></Link>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Dúvidas</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">Perguntas frequentes</h2>
        </div>
        <div className="mt-10 space-y-4">
          {[
            ["O que é um bio site TOQY?", "É uma página digital profissional que concentra todos os links, contatos, catálogo, Pix e Wi-Fi do seu negócio em um único lugar, acessível por QR Code ou NFC."],
            ["Preciso saber programar?", "Não. O TOQY tem um editor visual completo — você personaliza logo, cores, botões e catálogo sem tocar em código."],
            ["O que é a plaquinha física?", "É uma placa acrílica com QR Code e/ou chip NFC que o cliente toca ou escaneia com o celular para abrir o bio site."],
            ["O cliente pode editar o bio site dele?", "Sim. Cada bio site tem uma chave de acesso exclusiva para o cliente editar a própria página quando quiser."],
            ["Posso usar o TOQY para vender para outros negócios?", "Sim. Os planos Comunidade, Freelancer e Agência são feitos para isso."],
            ["Como funciona o plano Gratuito?", "Você pode criar 1 bio site gratuitamente para conhecer a plataforma. Para recursos completos, faça upgrade para um plano pago."],
            ["Os pagamentos são seguros?", "Sim. Os pagamentos são processados pela Kiwify, com certificação de segurança."],
            ["Posso cancelar quando quiser?", "Sim. Você pode cancelar a assinatura a qualquer momento pelo painel da Kiwify."],
          ].map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between font-black text-ink">
                {q}
                <span className="ml-4 shrink-0 text-muted transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <img src="/brand/favicon-toqy.png" alt="TOQY" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-black text-ink">TOQY</span>
              </Link>
              <p className="mt-3 text-sm text-muted">Bio sites profissionais para QR Code, NFC e plaquinhas.</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Heart className="h-4 w-4 text-accent" /> Feito com carinho no Brasil
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-ink">Produto</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><a href="#recursos" className="hover:text-accent">Recursos</a></li>
                <li><a href="#video" className="hover:text-accent">Vídeo</a></li>
                <li><a href="#planos" className="hover:text-accent">Planos</a></li>
                <li><a href="#exemplos" className="hover:text-accent">Exemplos</a></li>
                <li><a href="#faq" className="hover:text-accent">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-black text-ink">Planos</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/login" className="hover:text-accent">Gratuito</Link></li>
                <li><a href="https://pay.kiwify.com.br/12uYE0c" target="_blank" rel="noopener noreferrer" className="hover:text-accent">Comunidade — R$29,90/mês</a></li>
                <li><a href="https://pay.kiwify.com.br/gTIhv6I" target="_blank" rel="noopener noreferrer" className="hover:text-accent">Freelancer — R$59,90</a></li>
                <li><a href="https://pay.kiwify.com.br/xFdnxvE" target="_blank" rel="noopener noreferrer" className="hover:text-accent">Agência — R$149,90</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-black text-ink">Conta</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/login" className="hover:text-accent">Entrar / Criar conta</Link></li>
                <li><Link href="/me" className="hover:text-accent">Acessar meu bio site</Link></li>
                <li><a href="https://pay.kiwify.com.br/12uYE0c" target="_blank" rel="noopener noreferrer" className="hover:text-accent">Comunidade Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-8 text-xs text-muted">
            <p className="font-bold text-ink">TOQY</p>
            <p className="mt-1">Um produto de Marusso Produções · Leonardo Marusso · CPF 473.503.798-54 · Indaiatuba - SP</p>
            <p className="mt-1">leonardomarusso1@gmail.com · (19) 99705-1919</p>
            <p className="mt-1">
              Instagram: <a href="https://instagram.com/leomvideomaker" target="_blank" rel="noopener noreferrer" className="hover:text-accent">@leomvideomaker</a>
              {" "}· YouTube: <a href="https://youtube.com/@leomarussobr" target="_blank" rel="noopener noreferrer" className="hover:text-accent">@leomarussobr</a>
            </p>
            <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
              <Link href="/termos" className="hover:text-accent">Termos de Uso</Link> ·
              <Link href="/privacidade" className="hover:text-accent">Privacidade</Link> ·
              <Link href="/cookies" className="hover:text-accent">Cookies</Link> ·
              <Link href="/contrato-assinatura" className="hover:text-accent">Contrato de Assinatura</Link>
            </p>
            <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p>© {new Date().getFullYear()} Marusso Produções. Todos os direitos reservados. · v{APP_VERSION} · build {BUILD_ID}</p>
              <p>Pagamentos processados com segurança pela <span className="font-bold text-ink/70">Kiwify</span></p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Vitrine de biosites reais muda raramente — revalida em background a cada 5 min
export const revalidate = 300;
