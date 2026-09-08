import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Perguntas frequentes — TOQY",
  description: "Dúvidas comuns sobre o TOQY: como funciona, planos, pagamento, plaquinha física e edição do bio site.",
};

// FAQ ampliada e agrupada (2026-09-06, auditoria externa, seção 5: a
// /faq é conteúdo de busca — "toqy é seguro?", "como funciona o pix" —
// e tinha só 8 respostas curtas). Cada resposta descreve o que o
// produto FAZ HOJE; nada aqui é promessa de recurso futuro.
const faqGroups: { titulo: string; itens: [string, string][] }[] = [
  {
    titulo: "Começando",
    itens: [
      ["O que é um bio site Toqy?", "É uma mini página feita pro celular que reúne, num link só, o que o seu cliente precisa: chamar você no WhatsApp, ver o catálogo ou cardápio, achar o endereço no mapa, pagar no Pix e pegar a senha do Wi-Fi. É o link que você coloca na bio do Instagram."],
      ["Preciso saber programar ou contratar designer?", "Não. Você escolhe um modelo pronto do seu segmento e edita tudo por um editor visual: foto, cores, textos, botões e catálogo. Sem código."],
      ["Quanto tempo leva pra deixar no ar?", "O passo a passo de criação tem 7 etapas curtas e a maioria termina em menos de 10 minutos. Dá pra publicar com o básico e ir completando depois — o que você salvar já fica no ar."],
      ["Posso criar do celular?", "Sim. O editor foi refeito pra celular: os campos ficam separados em blocos (Perfil, Links, Pix e Wi-Fi, Catálogo), com o botão de salvar sempre visível."],
      ["Preciso de cartão de crédito pra testar?", "Não. O plano Gratuito permite criar 1 bio site sem cartão."],
    ],
  },
  {
    titulo: "Recursos",
    itens: [
      ["Como funciona o Pix no bio site?", "Você cadastra a sua chave Pix e o Toqy gera o QR Code (padrão do Banco Central) na sua página. O cliente aponta o app do banco e paga. Dá pra deixar valores rápidos prontos ou o valor em aberto. O Toqy não fica com o dinheiro no meio: o Pix cai direto na sua conta."],
      ["O que é o catálogo?", "É a sua vitrine dentro da página: produtos ou serviços com foto, preço, descrição e um botão de ação (por exemplo, pedir no WhatsApp). Pode ser organizado por categoria, e cada categoria escolhe como aparece — capa, carrossel, grade ou lista."],
      ["Serve como cardápio de restaurante?", "Serve. O catálogo com categorias e o botão de pedido no WhatsApp cobrem exatamente esse caso — sem PDF e sem comissão por pedido."],
      ["O QR Code está incluído?", "Sim. Cada bio site tem um QR Code pronto pra baixar e imprimir em plaquinha, cardápio, vitrine ou cartão."],
      ["Consigo ver quantas pessoas acessaram?", "Sim. O painel mostra visitas, cliques e contatos (WhatsApp e telefone) do seu bio site, com o resumo dos últimos 7 dias na tela inicial."],
      ["Posso colocar a senha do Wi-Fi na página?", "Pode. O bloco de Wi-Fi mostra a rede e a senha, e o cliente conecta sem precisar digitar — útil pra quem atende no local."],
      ["Dá pra tirar a página do ar sem apagar?", "Dá. No painel, cada bio site tem um botão de deixar offline e colocar online de novo. Isso não apaga nada."],
    ],
  },
  {
    titulo: "Planos e pagamento",
    itens: [
      ["O que o plano Gratuito inclui?", "1 bio site, com perfil, links, redes sociais e QR Code. Recursos como Pix, Wi-Fi e catálogo entram nos planos pagos."],
      ["Os pagamentos são seguros?", "Sim. A cobrança da assinatura é processada pela Kiwify — o Toqy não armazena dados do seu cartão."],
      ["Posso cancelar quando quiser?", "Pode, a qualquer momento, pelo painel da Kiwify. Não há fidelidade."],
      ["O que acontece com a minha página se eu cancelar?", "A página deixa de contar com os recursos do plano pago. Os dados continuam na sua conta — você pode reativar depois sem refazer tudo."],
    ],
  },
  {
    titulo: "Domínio e link",
    itens: [
      ["Posso usar meu próprio domínio?", "Pode, no plano com domínio próprio. Você aponta o domínio que já tem (ou compra um) para o Toqy e a página passa a abrir no seu endereço, em vez de toqy.com.br/b/seu-nome."],
      ["Preciso comprar o domínio pelo Toqy?", "Não. O domínio continua sendo seu, comprado onde você preferir — o Toqy só recebe o apontamento. Se um dia você sair, o domínio vai junto."],
      ["Posso mudar o endereço do meu bio site depois?", "Pode. O endereço (o final do link) é editável no próprio editor. Só lembre de atualizar onde ele estiver impresso, como plaquinha e QR Code."],
    ],
  },
  {
    titulo: "Revenda e agência",
    itens: [
      ["Posso criar bio sites pra outros negócios e cobrar por isso?", "Pode. É exatamente pra isso que existem os planos Essencial, Freelancer e Agência: você cria várias páginas, entrega pro cliente e cobra o que quiser (setup, mensalidade ou os dois). Veja em /para-vender."],
      ["O meu cliente consegue editar a página dele?", "Consegue. Cada bio site tem uma chave de edição própria: com ela, o cliente entra em toqy.com.br/me e altera a página dele sem acessar a sua conta nem ver os outros clientes."],
      ["Dá pra tirar a marca Toqy e colocar a minha?", "No plano Agência, sim. Você substitui o rodapé pela sua marca (nome, logo e link), e a página passa a assinar como sua agência."],
      ["Se o meu cliente parar de pagar, o que eu faço?", "Você deixa a página offline em um clique no painel e recoloca no ar quando ele acertar. Nada é apagado."],
    ],
  },
  {
    titulo: "Segurança e dados",
    itens: [
      ["Meus dados e os dos meus clientes ficam seguros?", "Cada conta só enxerga os próprios bio sites, com a checagem feita no servidor (não só na tela). Os pagamentos ficam com a Kiwify e o Toqy não guarda dados de cartão."],
      ["O que é a chave de edição e o que devo fazer com ela?", "É a senha da página: quem tem a chave pode editar aquele bio site — inclusive a chave Pix e o WhatsApp. Trate como senha, mande só pra quem edita e nunca publique. Se ela vazar, você gera uma nova pelo painel (botão \"Nova chave\") e a antiga para de funcionar na hora."],
      ["O Toqy usa cookies e rastreia visitantes?", "Só depois do seu consentimento. Cookies essenciais (login) são necessários pro site funcionar; os de análise só passam a ser usados se você aceitar no aviso. Detalhes na Política de Cookies e na Política de Privacidade."],
      ["Como excluo minha conta e meus dados?", "Você pode excluir cada bio site pelo painel. Para apagar a conta inteira e os dados associados, fale com o suporte — o pedido é atendido conforme a LGPD."],
    ],
  },
];

const faqItems = faqGroups.flatMap((g) => g.itens);

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="h-14 w-auto object-contain md:h-16" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="mt-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Dúvidas</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">Perguntas frequentes</h1>
        </div>

        {/* FAQPage estruturado (schema.org): é o que faz o Google mostrar
            as perguntas direto no resultado de busca. A /faq entrou no
            sitemap na mesma auditoria — sem a marcação, ela ranqueia como
            página comum. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map(([q, a]) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            }),
          }}
        />

        {faqGroups.map((grupo) => (
          <div key={grupo.titulo} className="mt-10">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-accent">{grupo.titulo}</h2>
            <div className="mt-4 space-y-4">
              {grupo.itens.map(([q, a]) => (
                <details key={q} className="group rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-ink">
                    {q}
                    <span className="shrink-0 text-muted transition group-open:rotate-180">▾</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center">
          <p className="font-bold text-ink">Não encontrou o que procurava?</p>
          <a href="https://www.instagram.com/toqycontact/" target="_blank" rel="noreferrer noopener" className="btn-glow mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white">
            <MessageCircle className="h-4 w-4" /> Falar com o suporte
          </a>
        </div>
      </section>
    </main>
  );
}
