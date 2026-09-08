import type { BlogPost } from "./blogPosts";

// Clusters de conteúdo por INTENÇÃO de busca (2026-09-06, auditoria
// externa, seção 5). O blog tinha 3 artigos soltos; a auditoria apontou
// que faltavam os temas que negócio local realmente procura no Google —
// "link na bio para restaurante", "cardápio digital com WhatsApp", "QR
// Code para salão", "Pix no link da bio", "como vender bio sites para
// clientes" — mais um comparativo honesto com o concorrente.
//
// Arquivo separado de blogPosts.ts de propósito: junto, o arquivo
// passaria bem do limite de 350 linhas do lint. A importação de tipo é
// só de tipo (apagada na compilação), então não há ciclo em runtime.
//
// Cada artigo aponta pro seu próprio destino: os de segmento levam ao
// onboarding com o segmento já marcado (ver ?segmento= em
// /onboarding/page.tsx), o de revenda leva à landing de revenda.
export const blogPostsIntencao: BlogPost[] = [
  {
    id: "4",
    slug: "link-na-bio-para-restaurante",
    title: "Link na bio para restaurante: o que colocar (e o que tirar)",
    excerpt: "O que realmente precisa estar no link da bio de um restaurante para transformar seguidor em pedido — e o que só atrapalha.",
    content: `
      <h2>O erro mais comum: um link que só leva a outro lugar</h2>
      <p>A maioria dos restaurantes usa o link da bio para mandar a pessoa para outro app: um marketplace de delivery, um formulário, um site antigo. Cada passo a mais é gente que desiste no caminho. O link da bio deveria ser o lugar onde o pedido começa, não uma sala de espera.</p>
      <h2>O que colocar, em ordem de importância</h2>
      <h3>1. WhatsApp com mensagem pronta</h3>
      <p>É o primeiro botão. A pessoa toca e já abre a conversa com um texto do tipo "Olá, quero fazer um pedido". Quanto menos ela precisar digitar, mais pedido chega.</p>
      <h3>2. Cardápio com foto e preço</h3>
      <p>Cardápio em PDF é o segundo erro mais comum: abre fora do navegador, demora e no celular fica ilegível. Prefira um cardápio que abra na própria página, com foto, preço e um botão de pedir em cada item.</p>
      <h3>3. Endereço que abre o mapa</h3>
      <p>Não escreva o endereço só como texto. Um botão que abre direto no mapa evita que a pessoa copie errado — e reduz ligação perguntando onde fica.</p>
      <h3>4. Horário de funcionamento</h3>
      <p>Mostrar "aberto agora" ou "abre às 18h" evita a mensagem mais frustrante que um restaurante recebe: alguém perguntando se está aberto quando não está.</p>
      <h3>5. Pix para adiantar o pagamento</h3>
      <p>Para delivery próprio, receber no Pix antes de sair com a entrega reduz calote e agiliza a saída do pedido.</p>
      <h2>O que tirar</h2>
      <ul>
        <li><strong>Link para o site institucional</strong> que ninguém abre pelo celular.</li>
        <li><strong>Lista de redes sociais</strong> — quem já está no seu Instagram não precisa de um link para o seu Instagram.</li>
        <li><strong>Texto longo</strong> com a história do restaurante na primeira dobra. História vende depois do pedido, não antes.</li>
      </ul>
      <h2>Uma regra simples</h2>
      <p>Se um botão não leva a um pedido, a uma visita ou a um pagamento, ele está competindo com os que levam. Deixe no máximo cinco botões visíveis sem rolar a tela.</p>
    `,
    date: "2026-09-06",
    author: "Equipe Toqy",
    category: "Restaurantes",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    cta: {
      label: "Criar o link do meu restaurante",
      href: "/onboarding?segmento=Restaurante",
      text: "Monte em minutos um link da bio com WhatsApp, cardápio, mapa e Pix — já com o modelo de restaurante pronto.",
    },
  },
  {
    id: "5",
    slug: "cardapio-digital-com-whatsapp",
    title: "Cardápio digital com WhatsApp: como montar sem app e sem mensalidade cara",
    excerpt: "Passo a passo para ter um cardápio que abre no celular, mostra foto e preço e manda o pedido direto para o seu WhatsApp.",
    content: `
      <h2>Por que PDF não é cardápio digital</h2>
      <p>PDF foi feito para imprimir. No celular ele abre fora do navegador, exige zoom, pesa para carregar no 4G e não tem botão nenhum. Cardápio digital de verdade é uma página que abre na hora, com foto, preço e ação em cada item.</p>
      <h2>O que um bom cardápio digital precisa ter</h2>
      <ul>
        <li><strong>Foto real do prato</strong> — foto de banco de imagens diminui a confiança em vez de aumentar.</li>
        <li><strong>Preço visível</strong> — esconder preço faz a pessoa sair para comparar em outro lugar.</li>
        <li><strong>Categorias</strong> (entradas, pratos, bebidas, sobremesas) para não obrigar a rolar tudo.</li>
        <li><strong>Botão de pedir em cada item</strong>, abrindo o WhatsApp já com o nome do prato na mensagem.</li>
      </ul>
      <h2>A mensagem pronta muda o resultado</h2>
      <p>Compare as duas situações. Na primeira, a pessoa abre o WhatsApp em branco e precisa lembrar o nome do prato. Na segunda, a conversa já começa com "Quero pedir: Parmegiana individual — R$ 39,90". A segunda vira pedido com mais frequência, porque tira o trabalho de quem está comprando.</p>
      <h2>Como organizar as fotos</h2>
      <p>Fotografe com o celular na altura da mesa, com luz natural, sem flash. Use o mesmo enquadramento em todos os pratos — a repetição é o que faz o cardápio parecer profissional, não o equipamento.</p>
      <h2>Atualize o preço no mesmo dia em que ele muda</h2>
      <p>Cardápio desatualizado gera discussão no balcão e avaliação ruim. A vantagem do digital é exatamente essa: você corrige em segundos, sem reimprimir nada.</p>
      <h2>Quanto isso deveria custar</h2>
      <p>Cardápio digital não precisa de app dedicado nem de mensalidade de plataforma de delivery. Uma página própria, com o seu link e o seu WhatsApp, custa uma fração disso — e o pedido chega direto para você, sem comissão no meio.</p>
    `,
    date: "2026-09-06",
    author: "Equipe Toqy",
    category: "Restaurantes",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    cta: {
      label: "Montar meu cardápio digital",
      href: "/onboarding?segmento=Restaurante",
      text: "Cardápio com foto, preço, categorias e botão de pedido no WhatsApp — sem comissão por pedido.",
    },
  },
  {
    id: "6",
    slug: "qr-code-para-salao-de-beleza",
    title: "QR Code para salão de beleza: onde colocar para realmente funcionar",
    excerpt: "Onde posicionar o QR Code do seu salão, o que ele deve abrir e como usá-lo para conseguir mais agendamentos e avaliações.",
    content: `
      <h2>QR Code sozinho não faz nada</h2>
      <p>O código é só o atalho. O que decide o resultado é a página que ele abre e o lugar onde ele está colado. Um QR Code que abre o Instagram gera seguidor; um que abre uma página com agendamento gera cliente.</p>
      <h2>Os quatro melhores lugares no salão</h2>
      <h3>1. No espelho da cadeira</h3>
      <p>É onde a cliente passa mais tempo parada e olhando para a frente. Ali o código deve abrir o agendamento — o melhor momento para marcar o próximo horário é enquanto ela ainda está sendo atendida.</p>
      <h3>2. No caixa</h3>
      <p>No pagamento, o código pode abrir o Pix com o valor já preenchido, ou o pedido de avaliação no Google. Escolha um dos dois, não os dois: pedir duas coisas ao mesmo tempo faz a pessoa não fazer nenhuma.</p>
      <h3>3. Na vitrine, virado para a rua</h3>
      <p>Fora do horário de funcionamento, é o seu vendedor. Deve abrir a página com serviços, preços e WhatsApp.</p>
      <h3>4. No cartão que vai junto com o produto</h3>
      <p>Se você vende produtos, um cartão com QR Code dentro da sacola traz a pessoa de volta para agendar.</p>
      <h2>Cuidados práticos</h2>
      <ul>
        <li>Imprima com pelo menos 3 cm de lado — menor que isso, celular antigo não lê.</li>
        <li>Deixe uma borda branca em volta do código; sem ela a leitura falha.</li>
        <li>Escreva embaixo o que acontece ao escanear ("Agende seu horário"). Código sem legenda é escaneado muito menos.</li>
        <li>Teste com um Android e um iPhone antes de mandar imprimir cem unidades.</li>
      </ul>
      <h2>Meça o que está funcionando</h2>
      <p>Se cada lugar tiver o seu próprio código, você descobre em uma semana qual ponto do salão traz agendamento e qual só ocupa espaço.</p>
    `,
    date: "2026-09-06",
    author: "Equipe Toqy",
    category: "Beleza",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
    cta: {
      label: "Criar a página do meu salão",
      href: "/onboarding?segmento=Sal%C3%A3o%20de%20beleza",
      text: "Agendamento, serviços, avaliação no Google e QR Code prontos para imprimir — no modelo de salão de beleza.",
    },
  },
  {
    id: "7",
    slug: "pix-no-link-da-bio",
    title: "Pix no link da bio: como receber pagamento sem maquininha",
    excerpt: "Como colocar o Pix na sua página de links, quando usar valor fixo e como reduzir o vaivém de comprovante no WhatsApp.",
    content: `
      <h2>O problema do Pix por mensagem</h2>
      <p>O jeito mais comum de cobrar por Pix hoje é mandar a chave no WhatsApp e esperar o comprovante. Isso gera três atritos: a pessoa erra ao copiar, digita o valor errado, ou some no meio do caminho. Cada um deles custa venda.</p>
      <h2>QR Code de Pix já com o valor</h2>
      <p>O padrão do Banco Central permite gerar um código com o valor e o nome do recebedor já embutidos. A pessoa abre o app do banco, aponta e confirma. Nada para digitar, nada para errar.</p>
      <h2>Quando usar valor fixo e quando deixar em aberto</h2>
      <ul>
        <li><strong>Valor fixo:</strong> serviço com preço de tabela, sinal de agendamento, produto único. Reduz erro e acelera.</li>
        <li><strong>Valor em aberto:</strong> pedido montado na hora, gorjeta, doação. Deixe atalhos de valores comuns para não obrigar a digitar.</li>
      </ul>
      <h2>Cobrar sinal muda a taxa de falta</h2>
      <p>Em serviço com hora marcada, pedir um sinal pequeno no ato do agendamento reduz o número de faltas — quem pagou algo aparece. O sinal não precisa ser alto; precisa existir.</p>
      <h2>O que não fazer</h2>
      <ul>
        <li>Não publique a chave Pix como texto solto, sem contexto, em página pública: isso convida o golpe de quem tira print e se passa por você.</li>
        <li>Não use CPF como chave divulgada se puder usar chave aleatória ou e-mail.</li>
        <li>Não peça o comprovante se você já recebe a notificação do banco — pedir duas provas irrita o cliente.</li>
      </ul>
      <h2>Junte pagamento e atendimento no mesmo lugar</h2>
      <p>O ganho real aparece quando o Pix está na mesma página do catálogo e do WhatsApp: a pessoa escolhe, pergunta e paga sem trocar de aplicativo três vezes.</p>
    `,
    date: "2026-09-06",
    author: "Equipe Toqy",
    category: "Pagamentos",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    cta: {
      label: "Ativar Pix no meu link",
      href: "/onboarding",
      text: "Pix com QR Code, valor fixo ou em aberto, na mesma página do seu catálogo e do seu WhatsApp.",
    },
  },
  {
    id: "8",
    slug: "como-vender-bio-sites-para-clientes",
    title: "Como vender bio sites para clientes: preço, entrega e recorrência",
    excerpt: "Um caminho prático para quem quer criar páginas para negócios locais e cobrar mensalidade — com contas reais de margem.",
    content: `
      <h2>Por que negócio local compra isso</h2>
      <p>A maioria dos comércios de bairro não tem site, não quer gerenciar um e não sabe por onde começar. O que eles querem é simples: alguém que resolva. Esse é o serviço — não a página em si, mas o problema resolvido.</p>
      <h2>Como precificar</h2>
      <p>Dois modelos que funcionam bem juntos:</p>
      <ul>
        <li><strong>Setup:</strong> um valor único pela montagem, entre R$ 150 e R$ 500 dependendo do trabalho de conteúdo (fotos, cardápio, textos).</li>
        <li><strong>Mensalidade:</strong> um valor recorrente pela manutenção — alterar preço, trocar foto, publicar promoção. Entre R$ 39 e R$ 99 por mês é uma faixa que negócio local aceita sem estranhar.</li>
      </ul>
      <p>A conta que importa: dez clientes pagando R$ 59 por mês são R$ 590 recorrentes, com um custo de plataforma bem menor que isso. A margem vem da recorrência, não do setup.</p>
      <h2>Como entregar sem virar refém</h2>
      <p>O erro clássico é entregar a página e virar suporte vitalício de graça. Deixe combinado desde o começo:</p>
      <ul>
        <li>Quantas alterações estão incluídas por mês.</li>
        <li>Prazo de resposta (por exemplo, até dois dias úteis).</li>
        <li>Que o cliente pode editar sozinho o que for simples — com a própria chave de edição.</li>
      </ul>
      <h2>Como prospectar sem parecer spam</h2>
      <p>Monte a página antes de falar com o dono. Chegue com o link pronto, no celular, mostrando o negócio dele já bonito. É muito mais fácil vender algo que a pessoa está vendo do que algo que ela precisa imaginar.</p>
      <h2>O que dá problema</h2>
      <p>Cliente que atrasa o pagamento e continua com a página no ar. Resolva isso no primeiro dia: deixe claro no combinado que a página sai do ar enquanto a mensalidade estiver em aberto, e tenha um jeito simples de tirar e recolocar.</p>
    `,
    date: "2026-09-06",
    author: "Equipe Toqy",
    category: "Revenda",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    cta: {
      label: "Ver o plano de revenda",
      href: "/para-vender",
      text: "Painel de clientes, chave de edição por página e botão de tirar do ar — feito para quem vende bio sites.",
    },
  },
  {
    id: "9",
    slug: "toqy-ou-linktree-para-negocio-local",
    title: "Toqy ou Linktree: qual faz mais sentido para um negócio local",
    excerpt: "Comparativo honesto entre as duas ferramentas, incluindo os casos em que o Linktree é a escolha melhor.",
    content: `
      <h2>Primeiro, quando o Linktree é melhor</h2>
      <p>Não faz sentido esconder isso. Se você é criador de conteúdo, artista ou influenciador, e o seu link da bio serve para distribuir conteúdo — vídeos, músicas, newsletters, patrocinadores — o Linktree resolve muito bem, tem integração com dezenas de plataformas e é reconhecido no mundo todo.</p>
      <h2>Onde a conta muda para negócio local</h2>
      <p>Um comércio de bairro não precisa distribuir conteúdo. Precisa de quatro coisas: ser encontrado, ser chamado no WhatsApp, mostrar o que vende e receber. Uma lista de links não faz nada disso sozinha.</p>
      <table>
        <tr><th>O que o negócio precisa</th><th>Lista de links</th><th>Toqy</th></tr>
        <tr><td>Chamar no WhatsApp com mensagem pronta</td><td>Link comum</td><td>Botão com mensagem pré-escrita</td></tr>
        <tr><td>Mostrar cardápio ou catálogo</td><td>Link para PDF ou outro site</td><td>Catálogo com foto, preço e pedido</td></tr>
        <tr><td>Receber pagamento</td><td>Link externo</td><td>Pix com QR Code e valor</td></tr>
        <tr><td>Ser achado no mapa</td><td>Link comum</td><td>Botão que abre a rota</td></tr>
        <tr><td>Wi-Fi para o cliente na loja</td><td>Não tem</td><td>Senha e conexão na página</td></tr>
        <tr><td>Idioma e suporte</td><td>Principalmente em inglês</td><td>Tudo em português</td></tr>
      </table>
      <h2>Preço</h2>
      <p>Os dois têm plano gratuito. A diferença aparece no plano pago: no Toqy os recursos que um comércio usa todo dia — Pix, catálogo, QR Code — estão no plano de entrada, em real, sem conversão de moeda no cartão.</p>
      <h2>Como decidir em uma pergunta</h2>
      <p>Se a sua página existe para a pessoa <strong>clicar e ir embora</strong> para outro lugar, use uma lista de links. Se ela existe para a pessoa <strong>falar com você, ver o que você vende e pagar</strong>, você precisa de algo que faça isso na própria página.</p>
    `,
    date: "2026-09-06",
    author: "Equipe Toqy",
    category: "Comparativos",
    image: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=800&q=80",
    cta: {
      label: "Testar grátis com o meu negócio",
      href: "/onboarding",
      text: "Crie a página do seu negócio de graça e compare com o que você usa hoje — leva menos de dez minutos.",
    },
  },
  {
    id: "10",
    slug: "como-colocar-varios-links-na-bio-do-instagram",
    title: "Como colocar vários links na bio do Instagram: passo a passo",
    excerpt: "O Instagram só aceita um link no perfil. Veja como reunir WhatsApp, catálogo e Pix em uma única página — o conceito de link na bio.",
    content: `
      <h2>O problema: o Instagram só aceita um link</h2>
      <p>Se você já tentou colocar mais de um link na bio do Instagram, sabe o problema: o campo "site" do perfil só aceita <strong>um único endereço</strong>. É aí que entra o conceito de <strong>bio site</strong> (ou "link na bio"): uma página única que reúne todos os seus links — Instagram, WhatsApp, catálogo, cardápio, agenda — em um só lugar.</p>
      <h2>Passo a passo</h2>
      <h3>1. Escolha uma ferramenta de link na bio</h3>
      <p>Existem várias opções no mercado, mas vale escolher uma rápida de configurar e, de preferência, em português — evita confusão na hora de editar. O Toqy é uma dessas ferramentas: você cria sua página em poucos minutos, direto do celular, sem precisar programar.</p>
      <h3>2. Monte sua página com os links principais</h3>
      <p>Adicione seu WhatsApp (já com mensagem pronta, pra o cliente não precisar digitar nada), seu Instagram, seu catálogo de produtos ou serviços, e sua localização no mapa se você tem um ponto físico.</p>
      <h3>3. Personalize o visual</h3>
      <p>Cores, fotos e ícones de rede social devem seguir a identidade da sua marca. Um editor visual permite isso sem precisar de designer.</p>
      <h3>4. Ative o link no seu perfil do Instagram</h3>
      <p>Copie o link gerado e cole no campo "site" da bio do seu perfil.</p>
      <h3>5. Use o link em outros lugares</h3>
      <p>Coloque o QR Code do seu bio site em plaquinhas, cartões de visita ou no balcão da loja — assim ele não fica restrito só ao Instagram.</p>
      <h2>Por que não é só "juntar links"</h2>
      <p>Uma página que só agrupa links resolve a limitação do Instagram, mas para por aí. Ferramentas com Pix, WhatsApp pré-preenchido e catálogo embutido — como o Toqy — vão além: além de organizar seus links, você já consegue vender sem sair da página.</p>
    `,
    date: "2026-09-08",
    author: "Equipe Toqy",
    category: "Tutoriais",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80",
    cta: {
      label: "Criar meu link na bio grátis",
      href: "/onboarding",
      text: "Monte sua página com WhatsApp, catálogo e Pix em minutos — sem precisar programar.",
    },
  },
];
