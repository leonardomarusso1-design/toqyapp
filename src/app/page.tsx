import Link from "next/link";
import {
  CalendarCheck,
  Check,
  CreditCard,
  MapPin,
  MessageCircle,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wifi,
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

// Atualizado com os assets e slugs reais que você mapeou na sua pasta public
const examples = [
  ["Barbearia", "barbearia-andrian", "/templates/template-bg-barbearia.png"],
  ["Restaurante", "pastel-da-praca", "/templates/template-bg-restaurante.png"],
  ["Assistência Técnica", "my-cell", "/templates/template-bg-assistencia-tecnica.png"],
] as const;

const plans = [
  { name: "Gratuito", price: "R$0", period: "", description: "Para conhecer a plataforma e gerar seus primeiros leads.", highlight: false, items: ["1 bio site", "Domínio toqy.app/seunome", "QR Code básico", "Preview em tempo real", "Marca TOQY na página"] },
  { name: "Comunidade", price: "R$29,90", period: "/mês", description: "Acesso exclusivo para alunos. Crie páginas profissionais para seus clientes.", highlight: true, items: ["Até 20 bio sites inclusos", "Apenas R$5,00 por site extra", "Catálogo, Pix e Wi-Fi", "QR personalizado e NFC", "Suporte direto no Discord"] },
  { name: "Freelancer", price: "R$59,90", period: "/mês", description: "Para profissionais que criam para clientes, sem estar na comunidade.", highlight: false, items: ["Até 20 bio sites", "QR personalizado", "Pix e Wi-Fi", "Catálogo completo", "Suporte prioritário"] },
  { name: "Agência", price: "R$149,90", period: "/mês", description: "Para equipes e agências em escala.", highlight: false, items: ["Até 100 bio sites", "White label parcial", "Domínio próprio", "Gestão de equipe", "Tudo do Freelancer"] },
] as const;

const featureShowcase = [
  {
    title: "Editor visual com preview ao vivo",
    text: "Personalize paletas, botões, fundos, logo e módulos sem mexer em código.",
    image: "/images/landing-feature-editor-preview.png",
    alt: "Editor visual do TOQY com preview ao vivo",
  },
  {
    title: "Pix inteligente",
    text: "Receba pagamentos com Pix, chave copiável, QR Code e envio de comprovante pelo WhatsApp.",
    image: "/images/landing-feature-pix.png",
    alt: "Módulo Pix inteligente com QR Code",
  },
  {
    title: "Wi-Fi com check-in",
    text: "Gere QR Code de Wi-Fi, facilite a conexão e direcione o cliente para avaliação no Google, Instagram ou Facebook.",
    image: "/images/landing-feature-wifi-checkin.png",
    alt: "Wi-Fi com check-in e avaliação",
  },
  {
    title: "Catálogo flexível",
    text: "Mostre produtos e serviços em carrossel, grid, categorias ou lista vertical.",
    image: "/images/landing-feature-catalogo.png",
    alt: "Catálogo de produtos e serviços no TOQY",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5fbf9] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-emerald-950/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/logo-toqy-horizontal.png" alt="TOQY" className="h-12 w-auto object-contain md:h-14" />
          </Link>
          <nav className="hidden items-center gap-9 text-sm font-bold text-slate-600 md:flex">
            <a className="transition hover:text-[#20b99d]" href="#recursos">Recursos</a>
            <a className="transition hover:text-[#20b99d]" href="#como-funciona">Como funciona</a>
            <a className="transition hover:text-[#20b99d]" href="#planos">Planos</a>
            <a className="transition hover:text-[#20b99d]" href="#exemplos">Exemplos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-black text-slate-700 hover:text-[#20b99d] sm:inline-flex">Entrar</Link>
            <Link href="/login" className="rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white shadow-sm shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-[#25b69a]">Começar grátis</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/80 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_520px] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-[#1fa98f]">
              <Sparkles className="h-4 w-4" /> QR Code + NFC + Bio site
            </p>
            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
              Bio sites profissionais para QR Code, NFC e plaquinhas.
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-slate-600">
              Crie páginas editáveis com WhatsApp, Pix, Wi-Fi, catálogo, localização, avaliações e links importantes para qualquer negócio local.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-8 py-3.5 text-base font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-[#25b69a]">
                Criar meu bio site grátis <span aria-hidden="true">-&gt;</span>
              </Link>
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-base font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5">
                Como funciona
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm font-bold text-slate-600">
              {["Grátis para começar", "Sem código", "Publica em minutos"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#31c4a8]" />{item}</span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -left-14 top-16 z-20 hidden animate-[float_4s_ease-in-out_infinite] rounded-2xl bg-white px-5 py-4 shadow-xl lg:block">
              <div className="flex items-center gap-3">
                <QrCode className="h-6 w-6 text-[#31c4a8]" />
                <div><p className="text-sm font-black">QR Code</p><p className="text-xs text-slate-500">Escaneou ✓</p></div>
              </div>
            </div>
            <div className="absolute -right-10 bottom-28 z-20 hidden animate-[float_4.6s_ease-in-out_infinite] rounded-2xl bg-white px-5 py-4 shadow-xl lg:block">
              <div className="flex items-center gap-3">
                <Wifi className="h-6 w-6 text-violet-500" />
                <div><p className="text-sm font-black">NFC</p><p className="text-xs text-slate-500">Aproximou ✓</p></div>
              </div>
            </div>
            <img
              src="/images/landing-hero-toqy.png"
              alt="Bio sites profissionais com QR Code, NFC, Pix e Wi-Fi"
              className="w-full rounded-[2rem] object-cover shadow-2xl shadow-slate-300"
            />
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-16">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Recursos</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Tudo que uma plaquinha precisa abrir</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">O Toqy concentra atendimento, pagamento, localização, catálogo e avaliação em uma página pronta para QR Code e NFC.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, text, Icon]) => (
            <article key={title} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#31c4a8]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-6 lg:grid-cols-2">
            {featureShowcase.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-[#f8fbfa] shadow-sm">
                <img src={item.image} alt={item.alt} className="aspect-[16/10] w-full object-cover" />
                <div className="p-6">
                  <h3 className="text-2xl font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Como funciona</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Do QR Code ao atendimento em minutos</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {["Crie o bio site completo.", "Use o link no QR Code ou NFC.", "O cliente edita quando quiser com a chave."].map((item, index) => (
              <article key={item} className="rounded-[2rem] border border-slate-100 bg-[#f8fbfa] p-7 shadow-sm">
                <span className="text-5xl font-black text-[#31c4a8]">0{index + 1}</span>
                <p className="mt-6 text-xl font-black">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-5 py-16">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Planos</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Escolha o plano ideal para o seu negócio</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-[2rem] border bg-white p-7 shadow-sm ${plan.highlight ? "border-[#31c4a8] shadow-xl shadow-emerald-100" : "border-slate-100"}`}>
              {plan.highlight ? <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#31c4a8] px-5 py-2 text-xs font-black text-white">Mais popular</span> : null}
              <h3 className="text-2xl font-black">{plan.name}</h3>
              <p className="mt-2 min-h-16 text-sm text-slate-500">{plan.description}</p>
              <p className="mt-4 text-4xl font-black">{plan.price}<span className="text-base font-bold text-slate-500">{plan.period}</span></p>
              <div className="mt-6 grid gap-3">
                {plan.items.map((item) => <p key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700"><Check className="h-4 w-4 shrink-0 text-[#31c4a8]" />{item}</p>)}
              </div>
              <a
                href={
                  plan.name === "Comunidade"
                    ? "https://pay.kiwify.com.br/12uYE0c"
                    : plan.name === "Freelancer"
                    ? "https://pay.kiwify.com.br/Oc2YP5A"
                    : plan.name === "Agência"
                    ? "https://pay.kiwify.com.br/X71Qhtu"
                    : "/app/novo"
                }
                target={plan.name === "Gratuito" ? undefined : "_blank"}
                rel={plan.name === "Gratuito" ? undefined : "noreferrer noopener"}
                className={`mt-7 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${plan.highlight ? "bg-[#31c4a8] text-white hover:bg-[#25b69a]" : "border border-slate-200 text-slate-900 hover:border-[#31c4a8]"}`}
              >
                {plan.price === "R$0" ? "Começar grátis" : "Assinar"}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="exemplos" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Exemplos</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Modelos por segmento</h2>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Novo bio site</Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map(([name, slug, imgPath]) => (
              <Link key={slug} href={`/b/${slug}`} className="group rounded-[2rem] border border-slate-100 bg-[#f8fbfa] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="overflow-hidden rounded-[1.5rem] bg-slate-100">
                  <img src={imgPath} alt={name} className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <p className="mt-4 font-black">{name}</p>
                <p className="mt-1 text-sm font-bold text-[#31c4a8]">Ver exemplo</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 text-center">
        <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-tight md:text-5xl">Crie uma página profissional para seu cliente em poucos minutos.</h2>
        <Link href="/login" className="mt-8 inline-flex rounded-2xl bg-[#31c4a8] px-8 py-4 font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5">Começar agora</Link>
      </section>
    </main>
  );
}