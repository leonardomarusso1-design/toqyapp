export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: string;
  image: string;
  // CTA proprio por artigo (2026-09-06, auditoria externa, secao 5:
  // "cada artigo deve apontar para template/CTA relevante, nao apenas
  // para a home"). Antes, todo post terminava mandando pra /login — o
  // mesmo destino generico pra quem procurou "cardapio digital" e pra
  // quem procurou "como vender bio sites". Opcional: post sem CTA
  // proprio cai no texto padrao.
  cta?: { label: string; href: string; text: string };
}

import { blogPostsIntencao } from "./blogPostsIntencao";

const blogPostsBase: BlogPost[] = [
  {
    id: "1",
    slug: "como-aumentar-clientes-barberia-qrcode",
    title: "Como aumentar os clientes da sua barbearia usando QR Code",
    excerpt: "Descubra como um jeito simples e eficaz de atrair mais clientes para a sua barbearia usando QR Code e bio site profissional.",
    content: `
      <h2>Por que usar QR Code na sua barbearia?</h2>
      <p>Se você é dono de barbearia, sabe o quanto é importante manter os clientes voltando e indicando outros. Um QR Code na entrada resolve isso de forma simples: leva quem passou pela porta direto pro seu bio site.</p>
      <h3>1. Coloque o QR Code na plaquinha da sua barbearia</h3>
      <p>Uma plaquinha com QR Code na entrada, direcionando pro seu bio site do Toqy. Lá os clientes podem:</p>
      <ul>
        <li>Ver os serviços</li>
        <li>Entrar em contato pelo WhatsApp</li>
        <li>Avaliar no Google</li>
        <li>Conectar ao Wi-Fi</li>
      </ul>
      <h3>2. Compartilhe o QR Code nas redes sociais</h3>
      <p>Compartilhe o seu QR Code no Instagram, Facebook e WhatsApp. Isso ajuda novos clientes a encontrar a sua barbearia.</p>
      <h3>3. Ofereça um incentivo para quem usar o QR Code</h3>
      <p>Um desconto ou um brinde pra quem escanear o QR Code e deixar uma avaliação no Google aumenta a fidelidade.</p>
    `,
    date: "2026-07-15",
    author: "Equipe Toqy",
    category: "Negócios locais",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f0?w=800&q=80",
  },
  {
    id: "2",
    slug: "pix-dinamico-para-restaurante",
    title: "Por que todo restaurante deve ter Pix dinâmico no bio site?",
    excerpt: "Saiba como o Pix dinâmico do Toqy pode agilizar os pagamentos no seu restaurante e aumentar a satisfação dos clientes.",
    content: `
      <h2>O problema dos pagamentos em restaurantes</h2>
      <p>Quanto tempo seus clientes esperam para pagar a conta? Muitas vezes é demorado e atrasa o atendimento. O Pix dinâmico resolve isso.</p>
      <h3>1. Pagamento rápido e seguro</h3>
      <p>O cliente escaneia o QR Code do Pix e paga em segundos, sem precisar esperar por maquininha.</p>
      <h3>2. Taxas mais baixas</h3>
      <p>O Pix tem taxas menores do que cartões de crédito e débito.</p>
      <h3>3. Compartilhe o link do Pix no seu bio site</h3>
      <p>Adicione o link do Pix no seu bio site do Toqy, para os clientes pagarem com facilidade.</p>
    `,
    date: "2026-07-10",
    author: "Equipe Toqy",
    category: "Restaurantes",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  },
  {
    id: "3",
    slug: "seo-para-negocio-local",
    title: "SEO para negócios locais: Como aparecer no Google Maps",
    excerpt: "Dicas simples para o seu negócio local aparecer nas primeiras páginas do Google Maps e atrair mais clientes.",
    content: `
      <h2>Como aparecer no Google Maps</h2>
      <p>O Google Maps é uma das ferramentas mais importantes para negócios locais. Aqui vão algumas dicas:</p>
      <h3>1. Crie uma página no Google Meu Negócio</h3>
      <p>É grátis, e é o primeiro passo pra aparecer nas buscas por "perto de mim".</p>
      <h3>2. Preencha todas as informações</h3>
      <p>Endereço, telefone, horário de funcionamento, site e fotos — cada campo em branco é um motivo a menos pro Google te recomendar.</p>
      <h3>3. Peça avaliações dos clientes</h3>
      <p>Avaliações positivas ajudam a aparecer nas primeiras posições.</p>
      <h3>4. Adicione um link do seu bio site do Toqy na página do Google Meu Negócio</h3>
      <p>Isso ajuda os clientes a encontrar mais informações sobre o seu negócio.</p>
    `,
    date: "2026-07-05",
    author: "Equipe Toqy",
    category: "Marketing digital",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
];

// Ordenado do mais novo pro mais antigo — os artigos por intenção de
// busca (blogPostsIntencao) são de 2026-09-06 e entram na frente.
export const blogPosts: BlogPost[] = [...blogPostsBase, ...blogPostsIntencao].sort(
  (a, b) => b.date.localeCompare(a.date)
);
