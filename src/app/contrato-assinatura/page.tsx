import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata = { title: "Contrato de Assinatura — TOQY" };

export default function ContratoAssinaturaPage() {
  return (
    <LegalPageShell title="Contrato de Assinatura" updatedAt="16/07/2026">
      <p>
        Este Contrato regula a contratação de planos pagos do <strong>TOQY</strong> (toqy.com.br), oferecido
        por Leonardo Marusso (CPF 473.503.798-54), atuando sob a marca <strong>Marusso Produções</strong>.
        Complementa os <a href="/termos">Termos de Uso</a> — em caso de conflito específico sobre cobrança e
        assinatura, este contrato prevalece.
      </p>

      <h2>1. Planos disponíveis</h2>
      <table>
        <thead><tr><th>Plano</th><th>Preço</th><th>Cobrança</th><th>Limite de bio sites</th></tr></thead>
        <tbody>
          <tr><td>Gratuito</td><td>R$0</td><td>—</td><td>1</td></tr>
          <tr><td>Essencial</td><td>R$29,90/mês</td><td>Recorrente mensal</td><td>20 (site extra: R$5,00)</td></tr>
          <tr><td>Freelancer</td><td>R$39,90/mês</td><td>Recorrente mensal</td><td>20</td></tr>
          <tr><td>Agência</td><td>Grátis</td><td>Comissão sobre vendas (30% Toqy / 70% revendedor)</td><td>100</td></tr>
        </tbody>
      </table>
      <p>
        <strong>Atenção:</strong> os planos Essencial e Freelancer são assinaturas com cobrança recorrente
        mensal — as seções 3, 5, 6 e 8 abaixo (cobrança recorrente, cancelamento de renovação, reajuste,
        inadimplência) se aplicam a eles. O plano Agência não tem cobrança nenhuma — o acesso é gratuito,
        e o Toqy recebe 30% de comissão sobre as vendas que o próprio revendedor fizer para os clientes
        dele (pagos automaticamente via programa de Afiliados da Kiwify), não do revendedor para o Toqy.
        As disposições de cobrança, cancelamento, reajuste e reembolso deste contrato não se aplicam ao
        plano Agência, por não haver pagamento do revendedor ao Toqy.
      </p>
      <p>
        <strong>Acesso vitalício de quem já era assinante Freelancer:</strong> se você contratou o plano
        Freelancer como pagamento único antes de 16/07/2026, seu acesso aos recursos do plano contratado
        continua vitalício, nas mesmas condições da compra original — você não será cobrado novamente nem
        precisa migrar para o novo modelo de assinatura mensal para manter o acesso.
      </p>

      <h2>2. Processamento de pagamento</h2>
      <p>
        Os pagamentos são processados por <strong>Kiwify</strong>, plataforma de pagamentos terceirizada.
        Não armazenamos dados de cartão de crédito — isso é feito inteiramente pela Kiwify, conforme a
        política de segurança dela.
      </p>

      <h2>3. Cobrança recorrente (planos Essencial e Freelancer)</h2>
      <p>
        Os planos Essencial e Freelancer são cobrados de forma recorrente mensal. A cobrança é renovada
        automaticamente a cada mês, no mesmo valor vigente, até que você cancele.
      </p>

      <h2>4. Direito de arrependimento (compra online)</h2>
      <p>
        Conforme o art. 49 do Código de Defesa do Consumidor, você tem o direito de <strong>desistir da
        contratação em até 7 (sete) dias corridos</strong> a partir da data de adesão a qualquer plano pago
        (Essencial ou Freelancer), com <strong>reembolso integral</strong> do valor pago, sem
        necessidade de justificativa. Para exercer esse direito, entre em contato em
        leonardomarusso1@gmail.com dentro desse prazo. O plano Agência é gratuito — não há valor pago pelo
        revendedor ao Toqy, logo nenhuma hipótese de reembolso se aplica a ele.
      </p>

      <h2>5. Cancelamento (planos Essencial e Freelancer)</h2>
      <p>
        Você pode cancelar sua assinatura Essencial ou Freelancer a qualquer momento, solicitando por
        leonardomarusso1@gmail.com. O cancelamento interrompe a renovação futura — o acesso ao plano
        permanece até o fim do ciclo mensal já pago. Não há reembolso proporcional de dias não utilizados
        dentro de um ciclo já cobrado, exceto no caso do direito de arrependimento (seção 4).
      </p>

      <h2>6. Reajuste de preço (planos Essencial e Freelancer)</h2>
      <p>
        Podemos reajustar o valor das assinaturas Essencial e Freelancer mediante aviso prévio de pelo
        menos 30 (trinta) dias por e-mail. O novo valor só se aplica a partir do próximo ciclo de cobrança
        após o aviso; você pode cancelar antes disso sem ônus caso não concorde com o novo valor.
      </p>

      <h2>7. Mudança de plano (upgrade)</h2>
      <p>
        Você pode fazer upgrade de plano a qualquer momento pelo painel. O limite de bio sites é atualizado
        imediatamente conforme o novo plano contratado.
      </p>

      <h2>8. Inadimplência (planos Essencial e Freelancer)</h2>
      <p>
        Em caso de falha na cobrança recorrente das assinaturas Essencial ou Freelancer, poderemos
        suspender o acesso aos recursos do plano até a regularização, mantendo o acesso equivalente ao
        plano gratuito. Notificaremos por e-mail antes da suspensão.
      </p>

      <h2>9. Disponibilidade do serviço</h2>
      <p>
        Envidamos esforços para manter alta disponibilidade, mas não garantimos percentual específico de
        uptime. Manutenções programadas serão comunicadas com antecedência razoável quando possível.
      </p>

      <h2>10. Contato</h2>
      <p>Dúvidas sobre cobrança, cancelamento ou este contrato: leonardomarusso1@gmail.com · (19) 99705-1919.</p>
    </LegalPageShell>
  );
}
