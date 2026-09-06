import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Governança de consentimento (2026-09-06, auditoria externa de LGPD).
// Achado: o formulário do ebook coletava nome + e-mail sem registrar
// NENHUMA prova de consentimento. A copy "não enviamos spam" é promessa
// de marketing, não base legal — sob LGPD é preciso guardar a finalidade,
// a versão do texto aceito e o momento do aceite, senão não há como
// demonstrar consentimento depois (art. 8º, §1º).
//
// Ao mudar o TEXTO do consentimento no formulário, incremente
// CONSENT_VERSION aqui e no componente, para não misturar leads que
// aceitaram textos diferentes sob a mesma versão.
const CONSENT_VERSION = "1.0";
const LEAD_PURPOSE = "ebook_7_formas_ganhar_dinheiro_biosites";

// Limites de tamanho: o endpoint é público e sem autenticação, então um
// corpo gigante seria parseado (e possivelmente gravado) de graça. Cortamos
// antes do JSON.parse.
const MAX_BODY_BYTES = 4 * 1024;
const MAX_NAME_LENGTH = 120;
// 254 é o limite prático de um endereço de e-mail (RFC 5321).
const MAX_EMAIL_LENGTH = 254;

// Regex propositalmente conservadora: não tenta implementar a RFC inteira
// (impossível na prática), só rejeita o lixo óbvio que o `.includes("@")`
// anterior deixava passar — sem "@", sem domínio, com espaço, com dois "@",
// domínio sem ponto etc. A validação de verdade é o e-mail chegar.
const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

// Escapa HTML antes de interpolar dados do usuário no corpo do e-mail
// (2026-09-06, auditoria externa). O nome vinha CRU dentro do template
// HTML enviado pelo Resend: qualquer pessoa podia cadastrar um "nome"
// com <a>/<img>/<style> e o destinatário receberia esse HTML renderizado,
// assinado pelo nosso domínio.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    // Lê como texto primeiro para poder recusar corpo excessivo sem gastar
    // o parser de JSON com megabytes de entrada.
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Requisição muito grande." },
        { status: 413 }
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }

    if (typeof payload !== "object" || payload === null) {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }

    const body = payload as Record<string, unknown>;

    const rawName = typeof body.name === "string" ? body.name : "";
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const consent = body.consent === true;

    // Normalização: o mesmo endereço digitado como "  Fulano@Email.com "
    // e "fulano@email.com" precisa virar UM lead só — sem trim/lowercase
    // a base enche de duplicatas e o descadastro por e-mail não bate.
    const name = rawName.trim();
    const email = rawEmail.trim().toLowerCase();

    if (!name || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: "Informe um nome com até 120 caracteres." },
        { status: 400 }
      );
    }

    if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    // Sem aceite explícito não existe base legal para gravar o lead nem
    // para enviar comunicação — recusa antes de qualquer escrita.
    if (!consent) {
      return NextResponse.json(
        { error: "É necessário aceitar os termos para receber o ebook." },
        { status: 400 }
      );
    }

    const allowed = await checkRateLimit(supabaseAdmin, `lead:${getClientIp(request)}`, 5, 60);
    if (!allowed) return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

    // 1. Registrar o lead COM a prova de consentimento.
    const consentedAt = new Date().toISOString();
    const { error: dbError } = await supabaseAdmin.from("leads").insert([
      {
        name,
        email,
        purpose: LEAD_PURPOSE,
        consent_version: CONSENT_VERSION,
        consented_at: consentedAt,
      },
    ]);

    // Antes (2026-09-06, auditoria externa): a falha de gravação só era
    // logada e o e-mail seguia sendo enviado — o lead recebia o ebook e
    // jamais existia na base, então não havia registro de consentimento
    // nem como atender um pedido de exclusão/descadastro depois. Agora a
    // falha de persistência aborta o fluxo.
    if (dbError) {
      console.error("[api/lead] falha ao REGISTRAR lead:", dbError.message);
      return NextResponse.json(
        {
          error: "Não conseguimos registrar seu cadastro. Tente novamente em instantes.",
          stage: "persist",
        },
        { status: 500 }
      );
    }

    // 2. Enviar o ebook por e-mail (Resend). Requer RESEND_API_KEY e o
    // domínio verificado no Resend.
    const safeName = escapeHtml(name);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Toqy <noreply@toqy.com.br>",
        to: [email],
        subject: "Aqui está seu ebook grátis: 7 Formas de Ganhar Dinheiro com Bio Sites",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #FF4D6D;">Olá ${safeName}! Obrigado pelo interesse!</h1>
            <p style="font-size: 16px; line-height: 1.6;">
              Clique no link abaixo para baixar o seu ebook gratuito:
            </p>
            <div style="margin: 30px 0;">
              <a href="https://toqy.com.br/ebooks/7-formas-ganhar-dinheiro-biosites.pdf"
                 style="display: inline-block; padding: 15px 30px; background-color: #FF4D6D; color: white; text-decoration: none; border-radius: 9999px; font-weight: bold;">
                Baixar Ebook Grátis
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              Qualquer dúvida, é só responder esse email! 😊
            </p>
            <p style="font-size: 12px; color: #999; line-height: 1.6;">
              Você recebeu este e-mail porque pediu o ebook no site do Toqy
              e aceitou receber nossas comunicações. Para sair da lista,
              responda este e-mail com "descadastrar" ou escreva para
              <a href="mailto:contato@toqy.com.br" style="color: #999;">contato@toqy.com.br</a>.
              Saiba mais na nossa
              <a href="https://toqy.com.br/privacidade" style="color: #999;">Política de Privacidade</a>.
            </p>
          </div>
        `,
      }),
    });

    // Falha de envio é diferente de falha de registro: o lead JÁ está
    // gravado (com consentimento), então não pedimos novo cadastro — só
    // avisamos que o e-mail não saiu.
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[api/lead] lead registrado, mas falha ao ENVIAR e-mail:", res.status, detail);
      return NextResponse.json(
        {
          error: "Seu cadastro foi registrado, mas não conseguimos enviar o e-mail agora. Fale com contato@toqy.com.br.",
          stage: "email",
          registered: true,
          emailSent: false,
        },
        { status: 502 }
      );
    }

    // Não logamos o corpo da resposta do Resend: ele ecoa o destinatário,
    // e endereço de e-mail é dado pessoal — não deve ir pro log.
    return NextResponse.json({ success: true, registered: true, emailSent: true });
  } catch (e) {
    console.error("[api/lead] erro inesperado:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
