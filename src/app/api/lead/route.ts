import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // 1. Salvar lead no Supabase (criaremos uma tabela leads ou podemos usar profiles temporariamente)
    // Vamos usar uma tabela `leads` (você precisará criá-la no Supabase: id, name, email, created_at)
    const { error: dbError } = await supabaseAdmin
      .from("leads")
      .insert([{ name, email }]);

    if (dbError) {
      console.error("Erro ao salvar lead:", dbError);
    }

    // 2. Enviar email via Resend com link do ebook
    // Você precisará configurar a API Key do Resend no .env: RESEND_API_KEY
    // E verificar o domínio verificado no Resend (ex: toqy.com.br)
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
            <h1 style="color: #FF4D6D;">Olá ${name}! Obrigado pelo interesse!</h1>
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
          </div>
        `,
      }),
    });

    const data = await res.json();
    console.log("Email enviado:", data);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Erro no endpoint lead:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}