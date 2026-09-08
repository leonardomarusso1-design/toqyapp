import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata = { title: "Política de Cookies — TOQY" };

export default function CookiesPage() {
  return (
    <LegalPageShell title="Política de Cookies" updatedAt="01/09/2026">
      <p>
        Esta página explica quais cookies e tecnologias similares (como <code>localStorage</code> do
        navegador) o <strong>TOQY</strong> (toqy.com.br) utiliza. O próprio TOQY não usa cookies de
        publicidade ou rastreamento de terceiros. A exceção é a página pública de um bio site (<code>/b/[slug]</code>)
        quando o dono dela ativa, por conta própria, um Meta Pixel e/ou Google Analytics — nesse caso, quem
        visita aquele bio site específico é rastreado por esses provedores, para a campanha do dono do bio
        site, com o mesmo consentimento de cookies desta página.
      </p>

      <h2>O que usamos</h2>
      <table>
        <thead><tr><th>Tecnologia</th><th>Tipo</th><th>Finalidade</th><th>Duração</th></tr></thead>
        <tbody>
          <tr>
            <td>Sessão de autenticação (<code>localStorage</code>, chave <code>toqy-auth</code>)</td>
            <td>Necessário</td>
            <td>Manter você conectado à sua conta entre visitas</td>
            <td>Até logout ou expiração da sessão</td>
          </tr>
          <tr>
            <td>Sentry</td>
            <td>Diagnóstico</td>
            <td>Identificar e corrigir erros técnicos da aplicação</td>
            <td>Conforme política do Sentry</td>
          </tr>
          <tr>
            <td>Vercel Speed Insights</td>
            <td>Desempenho</td>
            <td>Medir tempo de carregamento e performance das páginas</td>
            <td>Conforme política da Vercel</td>
          </tr>
          <tr>
            <td>Google Analytics (<code>_ga</code>, <code>_gid</code>)</td>
            <td>Análise (opcional)</td>
            <td>Entender como os visitantes usam o site, com IP anonimizado</td>
            <td>Até 2 anos (padrão do Google Analytics)</td>
          </tr>
          <tr>
            <td>Meta Pixel e/ou Google Analytics de um bio site específico</td>
            <td>Publicidade/análise (opcional, configurado pelo dono do bio site)</td>
            <td>Medir campanhas (Meta Ads, Google Ads) daquele negócio na própria página dele</td>
            <td>Conforme política da Meta/Google</td>
          </tr>
        </tbody>
      </table>

      <h2>Consentimento</h2>
      <p>
        Os itens de &quot;Necessário&quot; e &quot;Diagnóstico&quot; acima são estritamente necessários para o funcionamento do
        serviço, sem finalidade publicitária. O Google Analytics não é necessário e só é carregado depois
        que você clica em &quot;Aceitar&quot; no banner de cookies — se você clicar em &quot;Recusar&quot; ou não interagir, ele
        nunca carrega. Você pode mudar de ideia a qualquer momento limpando os dados do site nas
        configurações do navegador, o que faz o banner aparecer de novo na próxima visita.
      </p>

      <h2>Como gerenciar</h2>
      <p>
        Você pode limpar os dados de sessão (<code>localStorage</code>) a qualquer momento pelas
        configurações do seu navegador — isso vai te desconectar da conta e resetar sua escolha de cookies
        na próxima visita, exigindo novo login e nova escolha no banner.
      </p>

      <h2>Contato</h2>
      <p>Dúvidas sobre esta política: leonardomarusso1@gmail.com.</p>
    </LegalPageShell>
  );
}
