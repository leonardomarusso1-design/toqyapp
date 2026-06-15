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
import { PublicBioSite } from "@/components/PublicBioSite";
import { getMockSiteBySlug } from "@/lib/mockSites";

const features = [
  ["WhatsApp", "Atendimento direto com mensagem pronta.", MessageCircle],
  ["Pix", "Chave, QR Code e comprovante pelo WhatsApp.", CreditCard],
  ["Wi-Fi", "QR Code para conectar e copiar senha.", Wifi],
  ["Catalogo", "Produtos e servicos com foto, preco e CTA.", ShoppingBag],
  ["Localizacao", "Google Maps e rota em um toque.", MapPin],
  ["Agendamento", "Link de agenda ou sistema externo.", CalendarCheck],
  ["QR/NFC", "URL permanente para plaquinhas e chips.", QrCode],
  ["Chave do cliente", "Cliente edita sem acessar o painel admin.", ShieldCheck],
] as const;

const examples = [
  ["Barbearia", "barbearia-andrian"],
  ["Pastelaria", "pastel-da-praca"],
  ["Assistencia tecnica", "my-cell"],
  ["Salao", "salao-demo"],
  ["Clinica", "clinica-demo"],
] as const;

const plans = [
  ["Gratis", "R$0", "Para testar e conhecer a plataforma.", ["1 biosite ativo", "QR Code", "Preview em tempo real", "URL publica"]],
  ["Starter", "R$29,90", "Para profissionais e pequenos negocios.", ["Ate 5 biosites", "Catalogo de produtos", "Pix + Wi-Fi", "Chave de acesso"]],
  ["Pro", "R$69,90", "Para agencias e equipes que criam para clientes.", ["Ate 30 biosites", "Backgrounds personalizados", "Metricas mockadas", "Planos futuros"]],
] as const;

export default function LandingPage() {
  const demo = getMockSiteBySlug("barbearia-andrian")!;

  return (
    <main className="min-h-screen bg-[#f5fbf9] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-emerald-950/5 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#31c4a8] text-lg font-black text-white shadow-sm">T</span>
            <span className="text-xl font-black tracking-tight">TOQY</span>
          </Link>
          <nav className="hidden items-center gap-9 text-sm font-bold text-slate-600 md:flex">
            <a className="transition hover:text-[#20b99d]" href="#recursos">Recursos</a>
            <a className="transition hover:text-[#20b99d]" href="#como-funciona">Como funciona</a>
            <a className="transition hover:text-[#20b99d]" href="#planos">Planos</a>
            <a className="transition hover:text-[#20b99d]" href="#exemplos">Exemplos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/me" className="hidden text-sm font-black text-slate-700 hover:text-[#20b99d] sm:inline-flex">Entrar</Link>
            <Link href="/app/novo" className="rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white shadow-sm shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-[#25b69a]">Comecar gratis</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/80 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_430px] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-[#1fa98f]">
              <Sparkles className="h-4 w-4" /> QR Code + NFC + Biosite
            </p>
            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
              Sua placa conecta. <span className="block text-[#31c4a8]">Seu biosite converte.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-slate-600">
              Transforme qualquer placa, adesivo ou cartao com QR Code em uma pagina digital completa: catalogo, contatos, Pix, Wi-Fi e muito mais.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/app/novo" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-8 py-3.5 text-base font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-[#25b69a]">
                Criar meu biosite gratis <span aria-hidden="true">-&gt;</span>
              </Link>
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-base font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5">
                Como funciona
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm font-bold text-slate-600">
              {["Gratis para comecar", "Sem codigo", "Publica em minutos"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#31c4a8]" />{item}</span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[360px]">
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
            <div className="rounded-[2.75rem] border-[14px] border-slate-950 bg-slate-950 p-2 shadow-2xl shadow-slate-300">
              <div className="h-[650px] overflow-hidden rounded-[2rem]">
                <PublicBioSite site={demo} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-16">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Recursos</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Tudo que uma plaquinha precisa abrir</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">O Toqy concentra atendimento, pagamento, localizacao, catalogo e avaliacao em uma pagina pronta para QR Code e NFC.</p>
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

      <section id="como-funciona" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Como funciona</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Do QR Code ao atendimento em minutos</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {["Crie o biosite completo.", "Use o link no QR Code ou NFC.", "O cliente edita quando quiser com a chave."].map((item, index) => (
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
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Escolha o plano ideal para o seu negocio</h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map(([name, price, description, items], index) => (
            <article key={name} className={`relative rounded-[2rem] border bg-white p-8 shadow-sm ${index === 1 ? "border-[#31c4a8] shadow-xl shadow-emerald-100" : "border-slate-100"}`}>
              {index === 1 ? <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#31c4a8] px-5 py-2 text-xs font-black text-white">Mais popular</span> : null}
              <h3 className="text-2xl font-black">{name}</h3>
              <p className="mt-2 min-h-12 text-slate-500">{description}</p>
              <p className="mt-6 text-4xl font-black">{price}<span className="text-base font-bold text-slate-500">{price !== "R$0" ? "/mes" : ""}</span></p>
              <div className="mt-6 grid gap-4">
                {items.map((item) => <p key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700"><Check className="h-4 w-4 text-[#31c4a8]" />{item}</p>)}
              </div>
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
            <Link href="/app/novo" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Novo biosite</Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {examples.map(([name, slug]) => (
              <Link key={slug} href={`/b/${slug}`} className="group rounded-[2rem] border border-slate-100 bg-[#f8fbfa] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex aspect-[3/4] items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-emerald-100 to-cyan-100 text-5xl font-black text-[#31c4a8]">{name.slice(0, 1)}</div>
                <p className="mt-4 font-black">{name}</p>
                <p className="mt-1 text-sm font-bold text-[#31c4a8]">Ver exemplo</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 text-center">
        <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-tight md:text-5xl">Crie uma pagina profissional para seu cliente em poucos minutos.</h2>
        <Link href="/app/novo" className="mt-8 inline-flex rounded-2xl bg-[#31c4a8] px-8 py-4 font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5">Comecar agora</Link>
      </section>
    </main>
  );
}
