import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingBioSiteCard } from "@/components/LandingBioSiteCard";
import { ReferralCapture } from "@/components/ReferralCapture";
import { APP_VERSION, BUILD_ID } from "@/lib/appInfo";
import { getShowcaseSummaries } from "@/lib/realTemplates";
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
  HelpCircle,
  Heart,
  Wallet,
} from "lucide-react";

// Espaço de vídeo explicativo na hero (2026-09-05, pedido do Leonardo) —
// cole aqui a URL de embed (YouTube: https://www.youtube.com/embed/ID,
// Vimeo: https://player.vimeo.com/video/ID). Enquanto vazio, mostra um
// placeholder — mesmo padrão já usado pros espaços de imagem desta página
// (ver seção "3 PASSOS" abaixo).
const HERO_VIDEO_EMBED_URL = "";

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
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Deixe o negócio do cliente mais profissional e venda mais em menos de 10 minutos.
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="h-14 w-auto object-contain md:h-16" />
          </Link>
          <nav className="hidden items-center gap-9 text-sm font-semibold text-muted md:flex">
            <a className="transition hover:text-accent" href="#exemplos">Resultados</a>
            <a className="transition hover:text-accent" href="#como-funciona">Como funciona</a>
            <a className="transition hover:text-accent" href="#exemplos">Exemplos</a>
            <a className="transition hover:text-accent" href="#planos">Planos</a>
          </nav>
          <LandingHeader />
        </div>
      </header>

      {/* HERO com DUAS DIREÇÕES */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="shimmer-line h-1 w-full" />
        {/* blobs animados */}
        <div className="blob float-slow -left-24 top-10 h-72 w-72 bg-accent/30" />
        <div className="blob float-slow right-0 top-32 h-80 w-80 bg-violet/30" style={{ animationDelay: "1.2s" }} />
        <div className="blob float-slow bottom-0 left-1/3 h-72 w-72 bg-[#ffc850]/30" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-7xl px-5 py-16 lg:py-20">
          <div className="text-center">
            <span className="pill inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-accent-dim shadow-sm fade-up">
              <Sparkles className="h-4 w-4 text-accent" /> Transforme a presença digital de qualquer negócio
            </span>
            <h1 className="fade-up mt-6 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink md:text-4xl lg:text-5xl" style={{ animationDelay: "0.05s" }}>
              Mais clientes. <span className="gradient-text">Menos trabalho.</span>
            </h1>
            <p className="fade-up mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg" style={{ animationDelay: "0.1s" }}>
              Duas formas de usar o Toqy: um bio site profissional pro seu próprio negócio, ou uma forma de vender bio sites pra outros negócios e ganhar todo mês. Escolha abaixo.
            </p>
          </div>

          {/* Espaço de vídeo explicativo (2026-09-05, pedido do Leonardo) —
              ver HERO_VIDEO_EMBED_URL no topo do arquivo. Vídeo curto e
              pessoal costuma converter mais que texto sozinho (ver skill
              premium-design-standards, princípio 29). */}
          <div className="fade-up mx-auto mt-10 max-w-3xl" style={{ animationDelay: "0.15s" }}>
            {HERO_VIDEO_EMBED_URL ? (
              <div className="aspect-video overflow-hidden rounded-3xl border border-border shadow-lg">
                <iframe src={HERO_VIDEO_EMBED_URL} title="Como o Toqy funciona" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-3xl border-2 border-dashed border-border bg-white/60 text-sm font-semibold text-muted">
                <span className="inline-flex items-center gap-2"><PlayCircle className="h-5 w-5" /> Espaço para vídeo explicando como o Toqy funciona</span>
              </div>
            )}
          </div>

          {/* DUAS DIREÇÕES PRINCIPAIS */}
          <div className="fade-up mt-10 grid gap-6 lg:grid-cols-2" style={{ animationDelay: "0.2s" }}>
            {/* Direção 1: Para o próprio negócio */}
            <div className="card-glow relative overflow-hidden rounded-3xl border border-border bg-white p-8 shadow-sm transition hover:-translate-y-1">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-accent/10" />
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Store className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-extrabold text-ink">Para o meu negócio</h3>
              <p className="mt-3 text-muted">
                Um bio site completo pra receber mais clientes — pronto em minutos, sem precisar de designer.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "1 bio site grátis, sem cartão de crédito",
                  "WhatsApp, localização e redes sociais",
                  "Pix, catálogo e QR a partir de R$9,90/mês",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-semibold text-ink/80">
                    <Check className="h-5 w-5 shrink-0 text-accent" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/para-mim" className="btn-glow mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white">
                Criar meu bio site <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Direção 2: Vender como serviço */}
            <div className="card-glow relative overflow-hidden rounded-3xl border-2 border-accent bg-accent/5 p-8 shadow-xl shadow-accent/10 transition hover:-translate-y-1">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-accent/20" />
              <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase text-white">
                <Star className="h-3 w-3 fill-current" /> Renda extra
              </div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white">
                <Wallet className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-extrabold text-ink">Vender bio sites</h3>
              <p className="mt-3 text-muted">
                Crie bio sites pra clientes, cobre mensalidade e ganhe comissão indicando o Toqy pra outros revendedores.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Até 100 bio sites, gerencie tudo num painel só",
                  "Gerador de arte com IA pras plaquinhas",
                  "Até 30% de comissão por indicação",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-semibold text-ink/80">
                    <Check className="h-5 w-5 shrink-0 text-accent" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/para-vender" className="btn-glow mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-bold text-white">
                Começar a vender <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="fade-up mt-10 flex flex-wrap justify-center gap-4 text-xs font-semibold text-muted" style={{ animationDelay: "0.25s" }}>
            {[
              ["+1000 biosites criados", Users],
              ["Pagamento seguro", ShieldCheck],
              ["Suporte rápido", MessageCircle],
            ].map(([t, Icon]) => (
              <span key={t as string} className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2">
                <Icon className="h-4 w-4 text-accent" /> {t as string}
              </span>
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

      {/* PLANOS — reduzido a uma ponte pras 2 páginas dedicadas (2026-09-05,
          segmentação de público). Antes havia uma tabela de 12 linhas +
          4 cards misturando os 2 públicos na mesma seção — cada preço e
          feature agora mora só na página do público certo (/para-mim,
          /para-vender), sem duplicar manutenção em 2 lugares. */}
      <section id="planos" className="mx-auto max-w-5xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Planos</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Qual dos dois é você?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">Os planos e preços certos dependem do que você quer fazer com o Toqy.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Link href="/para-mim" className="card-glow group flex flex-col rounded-3xl border border-border bg-white p-8 shadow-sm transition hover:-translate-y-1">
            <Store className="h-8 w-8 text-accent" />
            <h3 className="mt-4 text-xl font-extrabold text-ink">Pro mim mesmo</h3>
            <p className="mt-2 text-sm text-muted">Grátis pra testar, R$9,90/mês pro completo. Ver planos Gratuito e Pro →</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent group-hover:gap-3 transition-all">Ver detalhes <ArrowRight className="h-4 w-4" /></span>
          </Link>
          <Link href="/para-vender" className="card-glow group flex flex-col rounded-3xl border-2 border-accent bg-accent/5 p-8 shadow-sm transition hover:-translate-y-1">
            <Wallet className="h-8 w-8 text-accent" />
            <h3 className="mt-4 text-xl font-extrabold text-ink">Pra vender</h3>
            <p className="mt-2 text-sm text-muted">A partir de R$29,90/mês, até 100 bio sites. Ver planos Essencial, Freelancer e Agência →</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent group-hover:gap-3 transition-all">Ver detalhes <ArrowRight className="h-4 w-4" /></span>
          </Link>
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

      {/* CTA FINAL — reforça a escolha dos 2 caminhos (2026-09-05), em vez
          de um CTA genérico só pro público de revenda como era antes. */}
      <section className="bg-bg px-5 py-20 text-center border-t border-border">
        <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Seu bio site profissional está a poucos minutos de distância.</h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/para-mim" className="btn-glow inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-white">Pro meu negócio <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/para-vender" className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 font-bold text-ink transition hover:border-accent hover:text-accent">Quero vender bio sites <ArrowRight className="h-4 w-4" /></Link>
        </div>
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
                <li><Link href="/blog" className="hover:text-accent">Blog</Link></li>
                <li><a href="#faq" className="hover:text-accent">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-black text-ink">Planos</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/para-mim" className="hover:text-accent">Pro meu negócio (Grátis/Pro)</Link></li>
                <li><Link href="/para-vender" className="hover:text-accent">Pra vender (Essencial/Freelancer/Agência)</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-black text-ink">Conta</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/login" className="hover:text-accent">Entrar / Criar conta</Link></li>
                <li><Link href="/me" className="hover:text-accent">Acessar meu bio site</Link></li>
                {/* Convite direto do Discord (2026-09-05) — antes apontava
                    pro formulário/quiz de entrada (leonardomarusso.com.br
                    /comunidade), trocado porque o formulário parou de abrir.
                    Reverter se/quando ele for consertado (fora deste repo). */}
                <li><a href="https://discord.gg/CnxUbdgbNG" target="_blank" rel="noopener noreferrer" className="hover:text-accent">Comunidade TOQY</a></li>
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
