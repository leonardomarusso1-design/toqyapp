import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata = { title: "Política de Privacidade — TOQY" };

export default function PrivacidadePage() {
  return (
    <LegalPageShell title="Política de Privacidade" updatedAt="03/07/2026">
      <p>
        Esta Política de Privacidade descreve como <strong>TOQY</strong> (toqy.com.br), operado por Leonardo
        Marusso (CPF 473.503.798-54), atuando sob a marca <strong>Marusso Produções</strong> (&quot;controlador&quot;,
        &quot;nós&quot;), coleta, usa, armazena e protege dados pessoais, em conformidade com a Lei Geral de
        Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Quem é o controlador</h2>
      <p>
        Leonardo Marusso (CPF 473.503.798-54), atuando sob a marca Marusso Produções, com endereço em
        Indaiatuba - SP, é o controlador dos dados pessoais tratados através do TOQY. Contato para questões
        de privacidade: leonardomarusso1@gmail.com.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <h3>Dados da sua conta</h3>
      <ul>
        <li>Nome, e-mail e senha (ou login social) para acesso ao painel;</li>
        <li>Telefone e CPF, coletados no cadastro para fins de identificação e faturamento;</li>
        <li>Dados de plano e assinatura (via Kiwify).</li>
      </ul>
      <h3>Dados do(s) bio site(s) que você cria</h3>
      <ul>
        <li>Nome do negócio, descrição, localização, logo e imagens de catálogo;</li>
        <li>Contatos de divulgação: WhatsApp, telefone, Instagram, Facebook, e-mail, site;</li>
        <li>
          <strong>Chave Pix e nome do recebedor</strong>, quando você ativa o módulo de Pix — dado
          financeiro sensível, usado apenas para exibir o QR Code de pagamento no seu bio site;
        </li>
        <li>
          <strong>Nome e senha da rede Wi-Fi</strong>, quando você ativa o módulo de Wi-Fi — usado apenas
          para gerar o QR Code de conexão exibido no seu bio site;
        </li>
        <li>&quot;Chave de acesso&quot; (edit key) do bio site, usada para permitir edição sem login.</li>
      </ul>
      <h3>Dados coletados automaticamente</h3>
      <ul>
        <li>Dados de uso e navegação, para diagnóstico técnico (via Sentry) e métricas de performance (via Vercel Speed Insights);</li>
        <li>Identificador de sessão de login, armazenado no seu navegador (ver Política de Cookies).</li>
      </ul>

      <h2>3. Para que usamos seus dados (finalidade)</h2>
      <ul>
        <li>Viabilizar o funcionamento do serviço (autenticação, geração e hospedagem do seu bio site);</li>
        <li>Processar pagamentos e gerenciar assinaturas (via Kiwify);</li>
        <li>Suporte ao cliente;</li>
        <li>Comunicações operacionais sobre a conta (confirmação de cadastro, avisos de cobrança);</li>
        <li>Melhoria do serviço (identificação de erros, métricas de performance).</li>
      </ul>
      <p>Não vendemos dados pessoais a terceiros.</p>

      <h2>4. Base legal (LGPD, art. 7º)</h2>
      <p>
        Tratamos os dados com base em: (i) execução de contrato — para prestar o serviço que você contratou;
        (ii) legítimo interesse — para segurança e melhoria do serviço, sempre respeitando seus direitos;
        (iii) cumprimento de obrigação legal, quando aplicável (ex.: dados fiscais de pagamento).
      </p>

      <h2>5. Com quem compartilhamos dados (operadores)</h2>
      <table>
        <thead><tr><th>Operador</th><th>Finalidade</th></tr></thead>
        <tbody>
          <tr><td>Supabase</td><td>Banco de dados, autenticação e armazenamento</td></tr>
          <tr><td>Kiwify</td><td>Processamento de pagamentos e gestão de assinatura</td></tr>
          <tr><td>Sentry</td><td>Monitoramento e diagnóstico de erros técnicos</td></tr>
          <tr><td>Vercel</td><td>Hospedagem e métricas de performance</td></tr>
        </tbody>
      </table>
      <p>
        Esses provedores podem armazenar dados em servidores no Brasil ou no exterior, com as salvaguardas
        contratuais exigidas pela LGPD. Não compartilhamos dados pessoais com terceiros para fins de
        marketing sem seu consentimento explícito.
      </p>
      <p>
        <strong>Importante sobre chave Pix e senha de Wi-Fi:</strong> esses dados são exibidos publicamente
        no seu bio site (é a finalidade da funcionalidade) — a decisão de ativar esses módulos e o controle
        sobre quais dados exibir são seus. Recomendamos usar uma chave Pix e senha de Wi-Fi que você já
        pretende tornar públicas para seus clientes/visitantes.
      </p>

      <h2>6. Retenção de dados</h2>
      <p>
        Mantemos seus dados enquanto sua conta estiver ativa e pelo período necessário para cumprir
        obrigações legais (ex.: dados fiscais de pagamento). Ao solicitar a exclusão da conta, os dados
        pessoais e os bio sites associados são removidos, exceto o que a lei exigir manter.
      </p>

      <h2>7. Seus direitos como titular de dados</h2>
      <p>Conforme a LGPD, você pode solicitar, a qualquer momento, por leonardomarusso1@gmail.com:</p>
      <ul>
        <li>Acesso aos seus dados pessoais;</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>Exclusão dos dados (observadas as retenções legais obrigatórias);</li>
        <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
        <li>Informação sobre com quem seus dados foram compartilhados;</li>
        <li>Revogação do consentimento, quando o tratamento se basear nele.</li>
      </ul>

      <h2>8. Segurança</h2>
      <p>
        Adotamos medidas técnicas razoáveis para proteger seus dados (autenticação segura, criptografia em
        trânsito via HTTPS, controle de acesso). Nenhum sistema é 100% imune a incidentes; em caso de
        incidente de segurança que afete dados pessoais, comunicaremos conforme exigido pela LGPD.
      </p>

      <h2>9. Dados de menores</h2>
      <p>
        O serviço não é direcionado a menores de 18 anos. Não coletamos intencionalmente dados de menores
        sem o consentimento dos responsáveis legais.
      </p>

      <h2>10. Cookies</h2>
      <p>
        O uso de cookies e tecnologias similares é detalhado na <a href="/cookies">Política de Cookies</a>,
        parte integrante desta política.
      </p>

      <h2>11. Alterações desta política</h2>
      <p>Podemos atualizar esta Política periodicamente. Alterações relevantes serão comunicadas por e-mail ou aviso no serviço.</p>

      <h2>12. Contato</h2>
      <p>Para exercer seus direitos ou tirar dúvidas: leonardomarusso1@gmail.com · (19) 99705-1919 · Indaiatuba - SP.</p>
    </LegalPageShell>
  );
}
