import Link from "next/link";
import { CalendarCheck, CreditCard, MapPin, MessageCircle, QrCode, ShieldCheck, ShoppingBag, Wifi } from "lucide-react";
import { PublicBioSite } from "@/components/PublicBioSite";
import { getMockSiteBySlug } from "@/lib/mockSites";

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

const examples = [
  ["Barbearia", "barbearia-andrian"],
  ["Pastelaria", "pastel-da-praca"],
  ["Assistência técnica", "my-cell"],
  ["Salão", "salao-demo"],
  ["Clínica", "clinica-demo"],
];

export default function LandingPage() {
  const demo = getMockSiteBySlug("barbearia-andrian")!;
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3"><img src="/brand/toqy-logo.svg" alt="TOQY" className="h-9 w-auto" /></Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-300 md:flex"><a href="#funcionalidades">Funcionalidades</a><a href="#exemplos">Exemplos</a><a href="#como-funciona">Como funciona</a><a href="#para-quem">Para quem é</a></nav>
          <div className="flex items-center gap-3"><Link href="/me" className="text-sm font-black text-slate-200 hover:text-cyan-200">Entrar</Link><Link href="/app/novo" className="hidden rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300 sm:inline-flex">Criar meu bio site</Link></div>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_430px] lg:py-24">
        <div><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">QR Code, NFC e cartão digital</p><h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">Bio sites profissionais para QR Code, NFC e plaquinhas.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">Crie páginas editáveis com WhatsApp, Pix, Wi-Fi, catálogo, localização, avaliações e links importantes para qualquer negócio local.</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/app/novo" className="rounded-2xl bg-cyan-400 px-7 py-4 font-black text-slate-950 hover:bg-cyan-300">Criar meu bio site</Link><Link href="/b/barbearia-andrian" className="rounded-2xl border border-white/15 px-7 py-4 font-black text-white hover:bg-white/10">Ver exemplo</Link></div></div>
        <div className="mx-auto w-full max-w-[360px] rounded-[2.5rem] border border-white/15 bg-white/10 p-3 shadow-2xl"><div className="max-h-[680px] overflow-hidden rounded-[2rem]"><PublicBioSite site={demo} /></div></div>
      </section>
      <section id="como-funciona" className="border-y border-white/10 bg-white/[0.03] py-16"><div className="mx-auto max-w-7xl px-5"><h2 className="text-3xl font-black md:text-5xl">Como funciona</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{["Crie o bio site completo.", "Use o link no QR Code ou NFC.", "O cliente edita quando quiser com a chave."].map((item, index) => <article key={item} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6"><span className="text-4xl font-black text-cyan-300">0{index + 1}</span><p className="mt-5 text-xl font-black">{item}</p></article>)}</div></div></section>
      <section id="funcionalidades" className="mx-auto max-w-7xl px-5 py-16"><h2 className="text-3xl font-black md:text-5xl">Funcionalidades</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(([title, text, Icon]) => <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5"><Icon className="h-6 w-6 text-cyan-300" /><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p></article>)}</div></section>
      <section className="bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 px-5 py-16 text-white"><div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[420px_1fr]"><div className="rounded-[2.5rem] border border-white/30 bg-slate-950/25 p-4 shadow-2xl"><div className="rounded-[2rem] bg-white p-4 text-slate-950"><h3 className="text-2xl font-black">Catálogo de produtos e serviços</h3><div className="mt-4 grid gap-3">{["Foto", "Descrição", "Preço", "Botão de ação"].map((item) => <div key={item} className="rounded-2xl border border-slate-200 p-3"><p className="font-black">{item}</p><p className="text-sm text-slate-500">Editável pelo cliente ou aluno.</p></div>)}</div></div></div><div><h2 className="text-3xl font-black md:text-5xl">Feito para vender plaquinhas com valor real</h2><p className="mt-4 max-w-2xl text-lg font-semibold leading-relaxed text-white/90">O Toqy conecta a arte física da plaquinha com uma página digital editável, bonita e pronta para atendimento.</p></div></div></section>
      <section id="exemplos" className="border-y border-white/10 bg-white/[0.03] py-16"><div className="mx-auto max-w-7xl px-5"><h2 className="text-3xl font-black md:text-5xl">Exemplos por segmento</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{examples.map(([name, slug]) => <Link key={slug} href={`/b/${slug}`} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 hover:border-cyan-300/60"><div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 text-5xl font-black">{name.slice(0, 1)}</div><p className="mt-4 font-black">{name}</p><p className="mt-1 text-sm text-cyan-200">Ver exemplo</p></Link>)}</div></div></section>
      <section id="para-quem" className="mx-auto max-w-7xl px-5 py-16 text-center"><h2 className="text-3xl font-black md:text-5xl">Para comércios, alunos e revendedores</h2><p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">Barbearias, salões, restaurantes, lojas, clínicas, assistência técnica, pet shops e prestadores de serviço podem ter página, QR Code, NFC e catálogo em minutos.</p><Link href="/app/novo" className="mt-8 inline-flex rounded-2xl bg-cyan-400 px-7 py-4 font-black text-slate-950">Começar agora</Link></section>
    </main>
  );
}
