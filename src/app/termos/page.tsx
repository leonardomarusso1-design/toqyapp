import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata = { title: "Termos de Uso — TOQY" };

export default function TermosPage() {
  return (
    <LegalPageShell title="Termos de Uso" updatedAt="16/07/2026">
      <p>
        Estes Termos de Uso regulam o acesso e uso do serviço <strong>TOQY</strong> (toqy.com.br),
        oferecido por Leonardo Marusso (CPF 473.503.798-54), atuando sob a marca <strong>Marusso Produções</strong> (&quot;nós&quot;).
        Ao criar uma conta ou usar o serviço, você (&quot;cliente&quot; ou &quot;usuário&quot;) concorda com estes termos.
      </p>

      <h2>1. Objeto do serviço</h2>
      <p>
        TOQY é uma plataforma de criação de bio sites profissionais — páginas digitais com links, catálogo,
        Pix, Wi-Fi, QR Code e NFC — voltada a negócios locais e criadores. A funcionalidade exata disponível
        depende do plano contratado (ver seção 3 e o Contrato de Assinatura).
      </p>

      <h2>2. Cadastro e conta</h2>
      <p>
        Para usar o serviço, é necessário criar uma conta com e-mail válido. Você é responsável por manter a
        confidencialidade das suas credenciais de acesso e por todas as atividades realizadas na sua conta.
        Bio sites criados por você também recebem uma &quot;chave de acesso&quot; própria, que permite edição
        sem login — você é responsável por proteger essa chave e por repassá-la com segurança ao cliente final,
        quando aplicável. Avise-nos imediatamente (leonardomarusso1@gmail.com) em caso de uso não autorizado.
      </p>

      <h2>3. Planos, limites e pagamento</h2>
      <p>
        O serviço é oferecido nos planos Gratuito, Essencial, Freelancer e Agência, cada um com limite de
        número de bio sites e recursos específicos (detalhados na página de planos do site). Os planos
        Essencial, Freelancer e Agência são cobrados de forma recorrente mensal. Ver{" "}
        <a href="/contrato-assinatura">Contrato de Assinatura</a> para detalhes de cobrança,
        cancelamento e reembolso.
      </p>

      <h2>4. Uso aceitável</h2>
      <p>Você concorda em não usar o TOQY para:</p>
      <ul>
        <li>Atividades ilegais ou que violem direitos de terceiros;</li>
        <li>Publicar conteúdo enganoso, fraudulento ou que induza clientes finais a erro (ex.: chave Pix ou dados de contato falsos);</li>
        <li>Tentativas de acesso não autorizado a dados de outros usuários ou à infraestrutura do serviço;</li>
        <li>Engenharia reversa, cópia ou redistribuição do software (ver Licença de Uso).</li>
      </ul>
      <p>
        Reservamo-nos o direito de suspender ou encerrar contas que violem este uso aceitável, sem reembolso
        de valores já pagos, quando a violação for grave.
      </p>

      <h2>5. Conteúdo do cliente</h2>
      <p>
        Você mantém a titularidade sobre o conteúdo que insere no serviço (textos, imagens, logo, catálogo,
        dados de contato, chave Pix, credenciais de Wi-Fi). Ao usar o serviço, você nos concede uma licença
        limitada para armazenar e processar esse conteúdo unicamente para operar o bio site em seu nome. Você
        é responsável por garantir que tem os direitos necessários sobre qualquer imagem ou marca de terceiros
        que publique no seu bio site.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        O software, marca, design e código do TOQY são de propriedade exclusiva de Leonardo Marusso/Marusso
        Produções. Nada nestes Termos transfere qualquer direito de propriedade intelectual ao cliente além
        do direito de uso descrito na seção 1.
      </p>

      <h2>7. Disponibilidade e isenção de responsabilidade</h2>
      <p>
        Envidamos esforços razoáveis para manter o serviço disponível, mas não garantimos operação
        ininterrupta ou livre de erros. O serviço é fornecido &quot;como está&quot;. Na máxima extensão
        permitida por lei, não nos responsabilizamos por danos indiretos decorrentes do uso ou
        indisponibilidade do serviço, incluindo eventuais transações Pix realizadas fora da nossa
        plataforma de pagamento.
      </p>

      <h2>8. Rescisão</h2>
      <p>
        Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar contas que violem
        estes Termos, mediante aviso quando possível. Ao encerrar a conta, seus dados poderão ser excluídos
        conforme descrito na <a href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>9. Alterações destes Termos</h2>
      <p>
        Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas por e-mail ou
        aviso no próprio serviço. O uso continuado após a alteração implica concordância com os novos termos.
      </p>

      <h2>10. Foro e legislação aplicável</h2>
      <p>
        Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de Indaiatuba - SP
        para dirimir eventuais controvérsias, ressalvado o direito do consumidor de optar pelo foro de seu
        domicílio, quando aplicável.
      </p>

      <h2>11. Contato</h2>
      <p>Dúvidas sobre estes Termos: leonardomarusso1@gmail.com · (19) 99705-1919.</p>
    </LegalPageShell>
  );
}
