import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata = { title: "Política de Cookies — TOQY" };

export default function CookiesPage() {
  return (
    <LegalPageShell title="Política de Cookies" updatedAt="03/07/2026">
      <p>
        Esta página explica quais cookies e tecnologias similares (como <code>localStorage</code> do
        navegador) o <strong>TOQY</strong> (toqy.com.br) utiliza. Não usamos cookies de publicidade ou
        rastreamento de terceiros.
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
        </tbody>
      </table>

      <h2>Por que não pedimos consentimento com banner</h2>
      <p>
        Os itens acima são estritamente necessários para o funcionamento do serviço (manter login) ou de
        desempenho/diagnóstico interno, sem finalidade publicitária — categorias que, segundo boas práticas
        de LGPD para cookies, normalmente dispensam banner de consentimento explícito (diferente de cookies
        de rastreamento publicitário, que não usamos). Se isso mudar, esta página e a prática do produto
        serão atualizadas para incluir consentimento explícito.
      </p>

      <h2>Como gerenciar</h2>
      <p>
        Você pode limpar os dados de sessão (<code>localStorage</code>) a qualquer momento pelas
        configurações do seu navegador — isso vai te desconectar da conta na próxima visita, exigindo novo
        login.
      </p>

      <h2>Contato</h2>
      <p>Dúvidas sobre esta política: leonardomarusso1@gmail.com.</p>
    </LegalPageShell>
  );
}
