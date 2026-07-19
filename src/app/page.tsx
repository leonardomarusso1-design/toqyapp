import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingBioSiteCard } from "@/components/LandingBioSiteCard";
import { ReferralCapture } from "@/components/ReferralCapture";
import { APP_VERSION, BUILD_ID } from "@/lib/appInfo";
import { getShowcaseSummaries } from "@/lib/realTemplates";
import { KIWIFY_LINKS } from "@/lib/subscriptions";
import { RESELLER_TIERS } from "@/lib/resellerTiers";
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
  Handshake,
  Wallet,
  Gift,
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

// "Comunidade" retirada do funil de venda (2026-07-13, decisão do
// Leonardo): acesso à comunidade agora é gratuito e por fora (link interno
// do Discord), não é mais um plano pago do Toqy — comprar um plano pago
// não dá acesso à comunidade, e vice-versa. Quem já assinava esse plano
// continua funcionando (webhook da Kiwify e SUBSCRIPTION_PLANS ainda
// reconhecem "community" de propósito).
//
// "Essencial" volta ao funil (2026-07-16, pedido do Leonardo) — é o mesmo
// plano de antes (mesmo preço, mesmas features, mesmo produto na Kiwify).
// Essencial é o plano de entrada recorrente mais barato, e sustenta a
// maior parte do MRR.
//
// Destaque em Essencial (2026-07-16) — pedido explícito do Leonardo (ele
// quer recorrência). Padrão de mercado usado (pesquisa Linktree/Beacons):
// destacar o plano onde a restrição "dolorida" do grátis desaparece com o
// MENOR investimento inicial. `tag` = badge curto que aparece embaixo do
// preço, pensado pra ficar "chamativo"/comparável rápido entre os planos.
//
// Freelancer migrado de pagamento único pra assinatura mensal (Fase 1 do
// roadmap, 2026-07-16 — ver .planning/ROADMAP.md e subscriptions.ts). QR
// personalizado editável e Gerador de arte com IA RESTAURADOS nele (tinham
// sido removidos em 2026-07-16, decisão revertida na mesma data ao
// planejar esta fase) — sem eles, o Freelancer (R$39,90/mês) não tinha
// diferencial real sobre o Essencial (R$29,90/mês). Diferencial agora:
// mais créditos de arte (10 vs 5) + suporte prioritário. Quem comprou o
// Freelancer como pagamento único antes desta mudança mantém acesso
// vitalício (ver `legacy_lifetime_access` em profiles).
//
// Prefixo "★ " marca um item como exclusivo pro rendering abaixo
// (ícone/cor diferente, chama mais atenção que os itens normais).
const plans = [
  { name: "Gratuito", price: "R$0", period: "", tag: "Pra testar", description: "Para conhecer a plataforma e gerar seus primeiros leads.", highlight: false, cta: "Começar grátis", items: ["1 bio site", "Domínio toqy.app/seunome", "QR Code básico", "Preview em tempo real", "Marca TOQY na página"] },
  { name: "Essencial", price: "R$29,90", period: "/mês", tag: "Comece a vender bio site pra comércio local", description: "Pra começar a criar bio sites pra clientes, mensal, cancele quando quiser.", highlight: true, cta: "Assinar agora", items: ["Até 10 bio sites", "Sem taxa por bio site", "Catálogo, Pix e Wi-Fi", "★ QR personalizado editável", "★ Gerador de arte com IA (5 créditos)", "Suporte por email", "Cancele quando quiser"] },
  { name: "Freelancer", price: "R$39,90", period: "/mês", tag: "Atenda mais clientes, ganhe indicando", description: "Para quem cria pra clientes com mais frequência — mais créditos de arte e suporte prioritário. Mensal, cancele quando quiser.", highlight: false, cta: "Assinar agora", items: ["Até 20 bio sites", "Pix e Wi-Fi", "Catálogo completo", "★ QR personalizado editável", "★ Gerador de arte com IA (10 créditos)", "Suporte prioritário", "Cancele quando quiser", "Indique e ganhe 20% de comissão"] },
  // Voltou a ser paga (2026-07-15, mesmo dia) — o desenho "Agência grátis +
  // revenda 30/70" tinha um furo real: qualquer assinante pagante viraria
  // revendedor de graça sem nunca precisar revender nada. Ver histórico
  // completo em src/lib/subscriptions.ts (comentário de SUBSCRIPTION_PLANS
  // .agency). O programa de indicação com comissão continua existindo,
  // agora como benefício de quem já é Freelancer/Agência pagante — não
  // mais como a própria razão de existir do plano.
  { name: "Agência", price: "R$99,90", period: "/mês", tag: "Monte uma operação, gerencie equipe", description: "Para equipes e agências em escala. 100 bio sites, 50 créditos de arte, tudo do Freelancer e mais.", highlight: false, cta: "Assinar agora", items: ["Até 100 bio sites", "★ QR personalizado editável", "★ Gerador de arte com IA (50 créditos)", "White label parcial", "Domínio próprio", "Gestão de equipe", "Indique e ganhe 30% de comissão"] },
  // Nota (pendência da Fase 2 quitada aqui, 2026-07-15): antes só a Agência
  // mostrava o benefício de indicação — Freelancer também ganha (20%) e
  // nunca aparecia. Uma seção dedicada explicando comissão+desconto+bônus
  // de bio site em detalhe fica pra Fase 3 (Landing Page), que já tem isso
  // como critério de sucesso explícito no roadmap — aqui é só a paridade
  // pontual entre os dois cards.
] as const;

const featureShowcase = [
  { title: "Editor visual com preview ao vivo", text: "Personalize paletas, botões, fundos, logo e módulos sem mexer em código.", image: "/images/landing-feature-editor-preview.png", alt: "Editor visual do TOQY com preview ao vivo" },
  { title: "Onboarding guiado pra criar pro cliente", text: "Um passo a passo simples — negócio, localização, visual, contato — pra criar o bio site do seu cliente em minutos.", image: "/images/landing-feature-onboarding.png", alt: "Onboarding guiado para criar bio site de cliente" },
  { title: "Pix inteligente", text: "Receba pagamentos com Pix, chave copiável, QR Code e envio de comprovante pelo WhatsApp.", image: "/images/landing-feature-pix.png", alt: "Módulo Pix inteligente com QR Code" },
  { title: "Wi-Fi com check-in", text: "Gere QR Code de Wi-Fi, facilite a conexão e direcione o cliente para avaliação no Google, Instagram ou Facebook.", image: "/images/landing-feature-wifi-checkin.png", alt: "Wi-Fi com check-in e avaliação" },
  { title: "Catálogo flexível", text: "Mostre produtos e serviços em carrossel, grid, categorias ou lista vertical.", image: "/images/landing-feature-catalogo.png", alt: "Catálogo de produtos e serviços no TOQY" },
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

export default async function LandingPage() {
  const showcaseSummaries = await getShowcaseSummaries();

  return (
    <main className="min-h-screen bg-bg text-ink">
      <ReferralCapture />
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
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="text-center lg:text-left">
              <span className="pill inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-accent-dim shadow-sm fade-up">
                <Sparkles className="h-4 w-4 text-accent" /> Biosites premium para empresas, lojas e renda extra
              </span>
              <h1 className="fade-up mt-6 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink md:text-4xl lg:text-5xl" style={{ animationDelay: "0.05s" }}>
                Biosites que <span className="gradient-text">vendem mais</span> e ficam prontos em minutos.
              </h1>
              <p className="fade-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg lg:mx-0" style={{ animationDelay: "0.1s" }}>
                Crie páginas profissionais com WhatsApp, Pix, Wi-Fi, catálogo, localização e avaliações. Para empresas, lojas, profissionais ou para vender como renda extra.
              </p>
              <div className="fade-up mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start" style={{ animationDelay: "0.15s" }}>
                <Link href="/login" className="btn-glow inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white">
                  Quero criar meu Toqy <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#video" className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-7 py-3 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent">
                  <PlayCircle className="h-4 w-4 text-accent" /> Assistir vídeo
                </a>
              </div>
              <div className="fade-up mt-6 flex flex-wrap justify-center gap-3 text-xs font-semibold text-muted lg:justify-start" style={{ animationDelay: "0.2s" }}>
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
                  <div className="mt-5 flex h-72 w-full items-center justify-center rounded-2xl bg-bg p-3">
                    <img src={s.image} alt={s.title} className="max-h-full max-w-full rounded-lg object-contain" />
                  </div>
                ) : (
                  <div className="mt-5 flex h-72 w-full items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface text-xs font-semibold text-muted">
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

      {/* PLANOS */}
      <section id="planos" className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Planos</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Escolha o plano ideal para o seu negócio</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-2xl border bg-card p-7 shadow-sm ${plan.highlight ? "border-accent shadow-xl shadow-accent/10 glow-pulse" : "border-border card-glow"}`}>
              {plan.highlight ? <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-5 py-2 text-xs font-extrabold text-white uppercase tracking-wider">Recomendado</span> : null}
              <h3 className="text-2xl font-bold text-ink">{plan.name}</h3>
              <p className="mt-2 min-h-[4rem] text-sm text-muted">{plan.description}</p>
              <p className="mt-4 text-4xl font-extrabold text-ink">{plan.price}<span className="text-base font-bold text-muted">{plan.period}</span></p>
              <span className={`mt-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-extrabold ${plan.highlight ? "bg-accent/15 text-accent" : "bg-surface text-muted"}`}>{plan.tag}</span>
              <div className="mt-6 grid gap-3 flex-1">
                {plan.items.map((item) => {
                  const isExclusive = item.startsWith("★ ");
                  const label = isExclusive ? item.slice(2) : item;
                  return isExclusive ? (
                    <p key={item} className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-accent/15 to-transparent px-2 py-1 text-sm font-black text-accent">
                      <Star className="h-4 w-4 shrink-0 fill-accent text-accent" />
                      {label}
                    </p>
                  ) : (
                    <p key={item} className="flex items-center gap-3 text-sm font-semibold text-ink/80">
                      <Check className="h-4 w-4 shrink-0 text-accent" />
                      {label}
                    </p>
                  );
                })}
              </div>
              {/* Agência volta a ter checkout Kiwify (2026-07-15, ver
                  comentário no array `plans` acima) — mesmo tratamento dos
                  outros planos pagos, nova aba pro checkout. */}
              <a href={plan.name === "Essencial" ? KIWIFY_LINKS.community : plan.name === "Freelancer" ? KIWIFY_LINKS.freelancer : plan.name === "Agência" ? KIWIFY_LINKS.agency : "/login"} target={plan.name === "Gratuito" ? undefined : "_blank"} rel={plan.name === "Gratuito" ? undefined : "noreferrer noopener"} className={`mt-7 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${plan.highlight ? "btn-glow text-white" : "border border-border text-ink hover:border-accent"}`}>
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-3xl space-y-3 text-center">
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
            <p className="text-sm font-bold text-ink">
              💡 <strong>Essencial ou Freelancer?</strong> Os dois são mensais e você pode cancelar quando quiser. O Essencial é o ponto de entrada mais barato. O Freelancer custa um pouco mais e traz mais créditos de arte com IA e suporte prioritário — vale a pena se você atende clientes com mais frequência.
            </p>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" /> QR Code personalizado editável e gerador de arte com IA são exclusivos dos planos Essencial, Freelancer e Agência.
          </p>
        </div>
      </section>

      {/* GANHE DINHEIRO — Fase 3 do roadmap (2026-07-17), critério de sucesso
          #2: seção explícita sobre o programa de indicação. Antes disso só
          existia um bullet solto em cada card de plano + a linha genérica
          "renda extra" na seção "Usos do Toqy" — nenhum lugar explicava os
          números reais. Fonte única dos números: RESELLER_TIERS
          (src/lib/resellerTiers.ts) — nada aqui é inventado. */}
      <section id="ganhe-dinheiro" className="border-t border-border bg-gradient-to-br from-ink to-ink/95 py-20 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Programa de indicação</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Ganhe dinheiro indicando o Toqy</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-white/70">
              Quem já assina Freelancer ou Agência ganha automaticamente um link de indicação — sem precisar &quot;virar revendedor&quot;, é um benefício de quem já paga.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {(["freelancer", "agency"] as const).map((tier) => {
              const config = RESELLER_TIERS[tier];
              const label = tier === "freelancer" ? "Freelancer" : "Agência";
              return (
                <div key={tier} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Plano {label}</p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    <div>
                      <Wallet className="h-6 w-6 text-accent" />
                      <p className="mt-3 text-3xl font-black">{config.commissionPct}%</p>
                      <p className="mt-1 text-sm text-white/70">de comissão por venda</p>
                    </div>
                    <div>
                      <Handshake className="h-6 w-6 text-accent" />
                      <p className="mt-3 text-3xl font-black">{config.buyerDiscountPct}%</p>
                      <p className="mt-1 text-sm text-white/70">de desconto pra quem você indicar</p>
                    </div>
                    <div>
                      <Gift className="h-6 w-6 text-accent" />
                      <p className="mt-3 text-3xl font-black">+{config.bonusSites}</p>
                      <p className="mt-1 text-sm text-white/70">bio site{config.bonusSites > 1 ? "s" : ""} de bônus por venda</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex justify-center">
            <a href="#planos" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 btn-glow">
              <ArrowRight className="h-4 w-4" /> Assinar e começar a indicar
            </a>
          </div>
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

          {showcaseSummaries.length ? (
            <div className="marquee-group relative mt-10 overflow-hidden py-2">
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-card to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-card to-transparent" />
              <div className="marquee marquee-left gap-5">
                {[...Array(2)].map((_, dup) => (
                  <div key={dup} className="flex shrink-0 items-center gap-5">
                    {showcaseSummaries.map((summary) => (
                      <LandingBioSiteCard key={`${dup}-${summary.slug}`} slug={summary.slug} publicUrl={`https://www.toqy.com.br/b/${summary.slug}`} />
                    ))}
                  </div>
                ))}
              </div>
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
            ["Posso usar o TOQY para vender para outros negócios?", "Sim. Os planos Freelancer e Agência são feitos para isso."],
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
                <li><a href="#planos" className="hover:text-accent">Planos</a></li>
                <li><a href="#exemplos" className="hover:text-accent">Exemplos</a></li>
                <li><a href="#faq" className="hover:text-accent">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-black text-ink">Planos</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/login" className="hover:text-accent">Gratuito</Link></li>
                <li><a href={KIWIFY_LINKS.community} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Essencial — R$29,90/mês</a></li>
                <li><a href={KIWIFY_LINKS.freelancer} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Freelancer — R$39,90/mês</a></li>
                <li><a href={KIWIFY_LINKS.agency} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Agência — R$99,90/mês</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-black text-ink">Conta</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/login" className="hover:text-accent">Entrar / Criar conta</Link></li>
                <li><Link href="/me" className="hover:text-accent">Acessar meu bio site</Link></li>
                {/* Não é mais o convite direto do Discord — o Leonardo tem um
                    quiz/formulário de entrada (2026-07-16) que roda ANTES do
                    convite, pra ele saber quem realmente está na comunidade e
                    poder integrar isso depois. Todo link de "comunidade" do
                    site aponta pra esse formulário, não pro discord.gg direto. */}
                <li><a href="https://www.leonardomarusso.com.br/comunidade" target="_blank" rel="noopener noreferrer" className="hover:text-accent">Comunidade TOQY</a></li>
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
