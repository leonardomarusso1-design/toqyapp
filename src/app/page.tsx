import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
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
  { name: "Gratuito", price: "R$0", period: "", description: "Para conhecer a plataforma e gerar seus primeiros leads.", highlight: false, cta: "Começar grátis", items: ["1 bio site", "Domínio toqy.app/seunome", "QR Code básico", "Preview em tempo real", "Marca TOQY na página"] },
  { name: "Comunidade", price: "R$29,90", period: "/mês", description: "Acesso exclusivo para alunos. Crie páginas profissionais para seus clientes.", highlight: true, cta: "Assinar", items: ["Até 20 bio sites inclusos", "Apenas R$5,00 por site extra", "Catálogo, Pix e Wi-Fi", "QR personalizado e NFC", "Suporte direto no Discord"] },
  { name: "Freelancer", price: "R$59,90", period: "", description: "Para profissionais que criam para clientes, sem estar na comunidade. Pagamento unico.", highlight: false, cta: "Comprar acesso", items: ["Até 20 bio sites", "QR personalizado", "Pix e Wi-Fi", "Catálogo completo", "Suporte prioritário"] },
  { name: "Agência", price: "R$149,90", period: "", description: "Para equipes e agências em escala. Pagamento unico.", highlight: false, cta: "Comprar acesso", items: ["Até 100 bio sites", "White label parcial", "Domínio próprio", "Gestão de equipe", "Tudo do Freelancer"] },
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="h-11 w-auto object-contain" />
          </Link>
          <nav className="hidden items-center gap-9 text-sm font-semibold text-slate-600 md:flex">
            <a className="transition hover:text-indigo-600" href="#recursos">Recursos</a>
            <a className="transition hover:text-indigo-600" href="#como-funciona">Como funciona</a>
            <a className="transition hover:text-indigo-600" href="#planos">Planos</a>
            <a className="transition hover:text-indigo-600" href="#exemplos">Exemplos</a>
          </nav>
          <LandingHeader />
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-50/50 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_520px] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-4 py-2 text-sm font-bold text-indigo-700">
              <Sparkles className="h-4 w-4 text-indigo-600" /> QR Code + NFC + Bio site
            </p>
            <h1 className="mt-8 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-7xl">
              Bio sites profissionais para QR Code, NFC e plaquinhas.
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-slate-600">
              Crie páginas editáveis com WhatsApp, Pix, Wi-Fi, catálogo, localização, avaliações e links importantes para qualquer negócio local.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-150 transition hover:-translate-y-0.5 hover:bg-indigo-700">
                Criar meu bio site grátis <span aria-hidden="true">-&gt;</span>
              </Link>
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5">
                Como funciona
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold text-slate-600">
              {["Grátis para começar", "Sem código", "Publica em minutos"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -left-14 top-16 z-20 hidden animate-[float_4s_ease-in-out_infinite] rounded-2xl bg-white px-5 py-4 shadow-xl lg:block">
              <div className="flex items-center gap-3">
                <QrCode className="h-6 w-6 text-indigo-600" />
                <div><p className="text-sm font-bold">QR Code</p><p className="text-xs text-slate-500">Escaneou ✓</p></div>
              </div>
            </div>
            <div className="absolute -right-10 bottom-28 z-20 hidden animate-[float_4.6s_ease-in-out_infinite] rounded-2xl bg-white px-5 py-4 shadow-xl lg:block">
              <div className="flex items-center gap-3">
                <Wifi className="h-6 w-6 text-indigo-500" />
                <div><p className="text-sm font-bold">NFC</p><p className="text-xs text-slate-500">Aproximou ✓</p></div>
              </div>
            </div>
            <img
              src="/images/landing-hero-toqy.png"
              alt="Bio sites profissionais com QR Code, NFC, Pix e Wi-Fi"
              className="w-full rounded-3xl object-cover shadow-2xl shadow-slate-200 border border-slate-100"
            />
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Recursos</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Tudo que uma plaquinha precisa abrir</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">O Toqy concentra atendimento, pagamento, localização, catálogo e avaliação em uma página pronta para QR Code e NFC.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, text, Icon]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 lg:grid-cols-2">
            {featureShowcase.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                <img src={item.image} alt={item.alt} className="aspect-[16/10] w-full object-cover" />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Como funciona</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Do QR Code ao atendimento em minutos</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {["Crie o bio site completo.", "Use o link no QR Code ou NFC.", "O cliente edita quando quiser com a chave."].map((item, index) => (
              <article key={item} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <span className="text-5xl font-extrabold text-indigo-600">0{index + 1}</span>
                <p className="mt-6 text-xl font-bold text-slate-950">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Planos</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Escolha o plano ideal para o seu negócio</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm ${plan.highlight ? "border-indigo-600 shadow-xl shadow-indigo-50" : "border-slate-200"}`}>
              {plan.highlight ? <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600 px-5 py-2 text-xs font-extrabold text-white uppercase tracking-wider">Mais popular</span> : null}
              <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-2 min-h-[4rem] text-sm text-slate-500">{plan.description}</p>
              <p className="mt-4 text-4xl font-extrabold text-slate-900">{plan.price}<span className="text-base font-bold text-slate-400">{plan.period}</span></p>
              <div className="mt-6 grid gap-3 flex-1">
                {plan.items.map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                    {item}
                  </p>
                ))}
              </div>
              <a
                href={
                  plan.name === "Comunidade"
                    ? "https://pay.kiwify.com.br/12uYE0c"
                    : plan.name === "Freelancer"
                    ? "https://pay.kiwify.com.br/gTIhv6I"
                    : plan.name === "Agência"
                    ? "https://pay.kiwify.com.br/xFdnxvE"
                    : "/login"
                }
                target={plan.name === "Gratuito" ? undefined : "_blank"}
                rel={plan.name === "Gratuito" ? undefined : "noreferrer noopener"}
                className={`mt-7 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${plan.highlight ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-slate-200 text-slate-900 hover:border-indigo-600"}`}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="exemplos" className="bg-white py-20 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Exemplos</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Modelos por segmento</h2>
              <p className="mt-2 text-base text-slate-500">Cada bio site é criado e personalizado para o negócio do seu cliente. Esses são alguns exemplos de layout.</p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"><Plus className="h-4 w-4" />Novo bio site</Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map(([name, , imgPath]) => (
              <div key={name} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="overflow-hidden rounded-xl bg-slate-100 relative">
                  <img src={imgPath} alt={name} className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100">
                    <p className="w-full p-4 text-center text-sm font-black text-white">Modelo {name}</p>
                  </div>
                </div>
                <p className="mt-4 font-bold text-slate-900">{name}</p>
                <p className="mt-1 text-sm text-slate-500">Layout personalizado para o segmento</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-400">Cada bio site é único — você personaliza logo, cores, botões, catálogo e muito mais.</p>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-20 text-center border-t border-slate-200">
        <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Crie uma página profissional para seu cliente em poucos minutos.</h2>
        <Link href="/login" className="mt-8 inline-flex rounded-xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-700">Começar agora</Link>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Dúvidas</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">Perguntas frequentes</h2>
        </div>
        <div className="mt-10 space-y-4">
          {[
            ["O que é um bio site TOQY?", "É uma página digital profissional que concentra todos os links, contatos, catálogo, Pix e Wi-Fi do seu negócio em um único lugar, acessível por QR Code ou NFC."],
            ["Preciso saber programar?", "Não. O TOQY tem um editor visual completo — você personaliza logo, cores, botões e catálogo sem tocar em código."],
            ["O que é a plaquinha física?", "É uma placa acrílica com QR Code e/ou chip NFC que o cliente toca ou escaneia com o celular para abrir o bio site. Você cria a plaquinha e entrega para o negócio do seu cliente."],
            ["O cliente pode editar o bio site dele?", "Sim. Cada bio site tem uma chave de acesso exclusiva. O cliente acessa toqy.com.br/me e usa a chave para editar sua própria página a qualquer momento."],
            ["Posso usar o TOQY para vender para outros negócios?", "Sim! Os planos Comunidade, Freelancer e Agência são feitos para isso. Você cria os bio sites, personaliza para cada cliente e entrega a chave de acesso."],
            ["Como funciona o plano Gratuito?", "Você pode criar 1 bio site gratuitamente para conhecer a plataforma. Para criar mais e ter acesso a recursos completos (Pix, Wi-Fi, catálogo), faça upgrade para um plano pago."],
            ["Os pagamentos são seguros?", "Sim. Os pagamentos são processados pela Kiwify, uma plataforma brasileira de pagamentos digitais com certificação de segurança."],
            ["Posso cancelar quando quiser?", "Sim. Você pode cancelar a assinatura a qualquer momento pelo painel da Kiwify."],
          ].map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between font-black text-slate-900">
                {q}
                <span className="ml-4 shrink-0 text-slate-400 transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <img src="/brand/favicon-toqy.png" alt="TOQY" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-black text-slate-900">TOQY</span>
              </Link>
              <p className="mt-3 text-sm text-slate-500">Bio sites profissionais para QR Code, NFC e plaquinhas.</p>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Produto</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><a href="#recursos" className="hover:text-indigo-600">Recursos</a></li>
                <li><a href="#como-funciona" className="hover:text-indigo-600">Como funciona</a></li>
                <li><a href="#planos" className="hover:text-indigo-600">Planos</a></li>
                <li><a href="#exemplos" className="hover:text-indigo-600">Exemplos</a></li>
                <li><a href="#faq" className="hover:text-indigo-600">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Planos</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><Link href="/login" className="hover:text-indigo-600">Gratuito</Link></li>
                <li><a href="https://pay.kiwify.com.br/12uYE0c" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">Comunidade — R$29,90/mês</a></li>
                <li><a href="https://pay.kiwify.com.br/gTIhv6I" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">Freelancer — R$59,90</a></li>
                <li><a href="https://pay.kiwify.com.br/xFdnxvE" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">Agência — R$149,90</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Conta</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><Link href="/login" className="hover:text-indigo-600">Entrar / Criar conta</Link></li>
                <li><Link href="/me" className="hover:text-indigo-600">Acessar meu bio site</Link></li>
                <li><a href="https://pay.kiwify.com.br/12uYE0c" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">Comunidade Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-8 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} TOQY. Todos os direitos reservados.</p>
            <p>Pagamentos processados com segurança pela <span className="font-bold text-slate-600">Kiwify</span></p>
          </div>
        </div>
      </footer>
    </main>
  );
}
