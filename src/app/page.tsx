import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingBioSiteCard } from "@/components/LandingBioSiteCard";
import { ReferralCapture } from "@/components/ReferralCapture";
import { APP_VERSION, BUILD_ID } from "@/lib/appInfo";
import { getShowcaseSummaries } from "@/lib/realTemplates";
import {
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  MessageCircle,
  // PlayCircle removido (2026-09-06, auditoria externa): só existia no
  // placeholder "Espaço para vídeo" da hero, que saiu.
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Users,
  Wifi,
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

// Reescrito (2026-09-06, pedido do Leonardo): a seção não deve mais falar
// de "plaquinha" como enquadramento principal — o uso real e mais comum é
// no link da bio do Instagram (pessoal ou de negócio). QR/NFC continua
// existindo, só vira um extra dentro da lista, não o motivo da seção.
const features = [
  ["WhatsApp", "Atendimento direto com mensagem pronta.", MessageCircle],
  ["Pix", "Chave, QR Code e comprovante pelo WhatsApp.", CreditCard],
  ["Wi-Fi", "QR Code para conectar e copiar senha.", Wifi],
  ["Catálogo", "Produtos e serviços com foto, preço e CTA.", ShoppingBag],
  ["Localização", "Google Maps e rota em um toque.", MapPin],
  ["Agendamento", "Link de agenda ou sistema externo.", CalendarCheck],
  ["Também funciona em QR Code e NFC", "Além do link, dá pra usar numa plaquinha física se quiser.", QrCode],
  ["Chave do cliente", "Edita a própria página quando quiser, sem acessar o painel admin.", ShieldCheck],
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
// Reescrito neutro (2026-09-06, pedido do Leonardo): a copy antiga falava
// "biosite pronto pra vender" — tom de revenda solto na home, que serve os
// 2 públicos. Sem imagem (prints soltos removidos, ver skill
// premium-design-standards: texto+ícone > screenshot decorativo).
const steps = [
  { n: "1", title: "Escolha um modelo", text: "Comece de um modelo pronto pro seu segmento e personalize em segundos." },
  { n: "2", title: "Deixe com a sua cara", text: "Editor visual: cores, fotos, botões, catálogo, Pix e Wi-Fi — sem código." },
  { n: "3", title: "Compartilhe onde quiser", text: "No link da bio do Instagram, por QR Code ou NFC. Edite quando quiser." },
] as const;

export default async function LandingPage() {
  const showcaseSummaries = await getShowcaseSummaries();

  // Prova visual da hero (2026-09-06, auditoria externa): 3 bio sites reais
  // no lugar do antigo placeholder de vídeo. Prioriza segmentos diferentes
  // pra hero não abrir com três exemplos do mesmo nicho — se sobrar vaga
  // (menos de 3 segmentos distintos disponíveis), completa com o que houver.
  const heroShowcase = (() => {
    const seen = new Set<string>();
    const distinctSegments = showcaseSummaries.filter((s) => {
      if (seen.has(s.segment)) return false;
      seen.add(s.segment);
      return true;
    });
    const chosen = [...distinctSegments];
    for (const summary of showcaseSummaries) {
      if (chosen.length >= 3) break;
      if (!chosen.includes(summary)) chosen.push(summary);
    }
    return chosen.slice(0, 3);
  })();

  // CTA secundário da hero ("Ver exemplo de negócio local"): usa o
  // primeiro bio site real da vitrine, não um link fixo — se o site de
  // exemplo sair do ar, o botão some sozinho em vez de virar link morto.
  const heroExample = heroShowcase[0] ?? null;

  return (
    <main className="min-h-screen bg-bg text-ink">
      <ReferralCapture />
      {/* Barra de anúncio (estática) */}
      <div className="bg-ink text-white">
        <div className="flex items-center justify-center px-4 py-2.5 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
            {/* A barra falava com o revendedor ("o negócio do CLIENTE"),
                logo acima de uma hero que agora fala com o dono do
                negócio — duas promessas diferentes na mesma dobra.
                Alinhada ao novo posicionamento (2026-09-06). */}
            <Sparkles className="h-3.5 w-3.5 text-accent" /> WhatsApp, catálogo, Pix e mapa em um link só. No ar em menos de 10 minutos.
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/toqy-logo.svg" alt="TOQY" className="h-14 w-auto object-contain md:h-16" />
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
            {/* Reposicionamento da primeira dobra (2026-09-06, auditoria
                externa, seção 5): antes a hero abria com "Mais clientes.
                Menos trabalho." e um subtítulo que mandava a pessoa
                ESCOLHER entre dois funis — ou seja, a primeira coisa que
                o visitante via era uma decisão, não uma resposta. A dobra
                agora responde em cinco segundos pra quem é (negócio
                local), o que entrega (atendimento, catálogo e Pix num
                link) e qual o próximo toque (um CTA primário só). Quem
                quer revender continua tendo caminho — mas como link
                discreto pra landing própria (/para-vender), não
                disputando espaço com o público principal. */}
            <span className="pill inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-accent-dim shadow-sm fade-up">
              <Sparkles className="h-4 w-4 text-accent" /> Feito para negócios locais no Brasil
            </span>
            <h1 className="fade-up mt-6 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink md:text-4xl lg:text-5xl" style={{ animationDelay: "0.05s" }}>
              Seu link da bio virou <span className="gradient-text">atendimento, catálogo e Pix.</span>
            </h1>
            <p className="fade-up mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg" style={{ animationDelay: "0.1s" }}>
              Uma mini página feita pro celular onde seu cliente chama no WhatsApp, vê o cardápio, acha o endereço e paga no Pix. Pronta em minutos, sem código e sem designer.
            </p>
            <div className="fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.14s" }}>
              <Link href="/onboarding" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-4 text-base font-black text-white shadow-sm transition hover:bg-accent-dim sm:w-auto">
                Criar grátis <ArrowRight className="h-5 w-5" />
              </Link>
              {heroExample ? (
                <a href={`https://www.toqy.com.br/b/${heroExample.slug}`} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-7 py-4 text-base font-bold text-ink transition hover:border-accent sm:w-auto">
                  Ver exemplo de negócio local
                </a>
              ) : null}
            </div>
            <p className="fade-up mt-4 text-sm font-semibold text-muted" style={{ animationDelay: "0.16s" }}>
              Quer ganhar dinheiro criando bio sites para outros negócios?{" "}
              <Link href="/para-vender" className="font-black text-accent-dim underline underline-offset-4 transition hover:text-accent">Veja o plano de revenda</Link>.
            </p>
          </div>

          {/* Espaço de vídeo explicativo (2026-09-05, pedido do Leonardo) —
              ver HERO_VIDEO_EMBED_URL no topo do arquivo. Vídeo curto e
              pessoal costuma converter mais que texto sozinho (ver skill
              premium-design-standards, princípio 29).

              Fallback trocado (2026-09-06, auditoria externa): enquanto a env
              do vídeo está vazia (o caso em produção hoje), a primeira dobra
              mostrava um retângulo tracejado com "Espaço para vídeo..." —
              área nobre ocupada por um vazio que denuncia produto inacabado.
              No lugar dele entram bio sites REAIS em produção, reaproveitando
              o LandingBioSiteCard (PhoneMockup + PublicBioSite) já usado na
              seção "Modelos por segmento" mais abaixo: prova visual do
              produto funcionando em vez de promessa de vídeo. Se um dia a
              env for preenchida, o iframe volta a ter prioridade e nada aqui
              muda. Se não houver showcase (ex.: build sem env do Supabase),
              não renderiza nada — melhor ausência que placeholder vazio. */}
          {HERO_VIDEO_EMBED_URL ? (
            <div className="fade-up mx-auto mt-10 max-w-3xl" style={{ animationDelay: "0.15s" }}>
              <div className="aspect-video overflow-hidden rounded-3xl border border-border shadow-lg">
                <iframe src={HERO_VIDEO_EMBED_URL} title="Como o Toqy funciona" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            </div>
          ) : heroShowcase.length ? (
            <div className="fade-up mt-12" style={{ animationDelay: "0.15s" }}>
              <div className="flex items-start justify-center gap-5">
                {heroShowcase.map((summary, i) => (
                  // O card tem largura fixa (240px), então a quantidade
                  // visível cresce com a tela em vez de espremer os três.
                  <div key={summary.slug} className={i === 0 ? "" : i === 1 ? "hidden sm:block" : "hidden lg:block"}>
                    <LandingBioSiteCard slug={summary.slug} publicUrl={`https://www.toqy.com.br/b/${summary.slug}`} />
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-sm font-semibold text-muted">
                Bio sites de verdade, no ar agora — feitos no Toqy. Toque para abrir.
              </p>
            </div>
          ) : null}

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
                  "Domínio próprio e gestão de equipe",
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

      {/* COMO FUNCIONA — bloco escuro de propósito (2026-09-06, polimento
          visual pedido pelo Leonardo): quebra o padrão "card branco
          arredondado" repetido em toda seção — contraste de fundo entre
          seções é uma das formas mais simples de parar de parecer
          template (ver skill frontend-design: "evite layout previsível").
          Números gigantes fora do card, texto alinhado à esquerda numa
          linha vertical conectada, em vez de 3 cards centralizados iguais. */}
      <section id="como-funciona" className="bg-ink py-24 text-white">
        <div className="mx-auto max-w-4xl px-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Como funciona</p>
          <h2 className="mt-3 max-w-md text-4xl font-extrabold tracking-tight md:text-5xl">Do zero ao ar em poucos minutos.</h2>
          <div className="mt-16 space-y-0">
            {steps.map((s, i) => (
              <div key={s.n} className={`flex gap-6 border-white/10 py-8 md:gap-10 ${i > 0 ? "border-t" : ""}`}>
                <span className="shrink-0 font-display text-6xl font-extrabold text-white/15 md:text-7xl">{s.n}</span>
                <div className="pt-2">
                  <h3 className="text-2xl font-bold md:text-3xl">{s.title}</h3>
                  <p className="mt-2 max-w-md text-white/60">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECURSOS — reescrito (2026-09-06, pedido do Leonardo): fala do uso
          real (link da bio do Instagram, pessoal ou de negócio), não mais
          de "plaquinha" como enquadramento principal. Imagem solta removida. */}
      <section id="recursos" className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Recursos</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Tudo que seu link da bio pode fazer</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">Coloque no link da bio do seu Instagram — pessoal ou de negócio — e concentre atendimento, pagamento, localização, catálogo e avaliação numa página só.</p>
        </div>
        {/* Bento assimétrico (2026-09-06, polimento visual) — o primeiro
            card (WhatsApp, o canal mais usado de longe) ganha destaque
            de tamanho e cor cheia; o resto segue em grid menor. Quebra a
            grade uniforme de 4 colunas iguais que lia como template. */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, text, Icon], i) => (
            <article
              key={title}
              className={
                i === 0
                  ? "card-glow rounded-[1.75rem] bg-ink p-7 text-white shadow-sm sm:col-span-2 sm:row-span-2 sm:p-9"
                  : "card-glow rounded-2xl border border-border bg-card p-6 shadow-sm"
              }
            >
              <div className={i === 0 ? "flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-accent" : "flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent"}>
                <Icon className={i === 0 ? "h-7 w-7" : "h-6 w-6"} />
              </div>
              <h3 className={i === 0 ? "mt-6 text-2xl font-extrabold" : "mt-5 text-lg font-bold text-ink"}>{title}</h3>
              <p className={i === 0 ? "mt-2 max-w-xs text-sm leading-relaxed text-white/60" : "mt-2 text-sm leading-relaxed text-muted"}>{text}</p>
            </article>
          ))}
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
            <a href="https://www.instagram.com/toqycontact/" target="_blank" rel="noreferrer noopener" className="btn-glow inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold text-white">
              <MessageCircle className="h-5 w-5" /> Falar com o suporte
            </a>
            <Link href="/faq" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10">
              Ver dúvidas frequentes
            </Link>
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

      {/* RODAPÉ */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <img src="/brand/toqy-icon.svg" alt="TOQY" className="h-8 w-8 rounded-lg" />
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
                <li><Link href="/faq" className="hover:text-accent">FAQ</Link></li>
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
            <p className="mt-1">leonardomarusso1@gmail.com</p>
            <p className="mt-1">
              Instagram: <a href="https://www.instagram.com/toqycontact/" target="_blank" rel="noopener noreferrer" className="hover:text-accent">@toqycontact</a>
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
