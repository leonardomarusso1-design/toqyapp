import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { checkAiArtCredits } from "@/lib/planLimits";
import { generatePlaqueArt, type PlaqueType, type PlaqueSize } from "@/lib/plaqueGenerator";
import { uploadPlaqueImage } from "@/lib/plaqueStorage";

type GenerateBody = {
  plaqueType: PlaqueType;
  size: PlaqueSize;
  customWidthCm?: number;
  customHeightCm?: number;
  businessName: string;
  extraInfo?: string;
  logoDataUrl?: string; // data:image/...;base64,xxxx
  biositeId?: string;
  pixReceiverName?: string;
  pixKeyText?: string;
  wifiNetworkName?: string;
  wifiPasswordText?: string;
};

// Autenticação real do usuário (2026-07-13) — diferente de outras rotas
// deste projeto (upload-image, biosite/save) que confiam em dado enviado
// no corpo da requisição, esta rota move dinheiro de verdade (cada geração
// custa via API do Gemini) e precisa checar o limite de créditos do plano
// — então o userId TEM que vir de um token validado server-side, nunca de
// um campo que o cliente poderia forjar pra usar créditos de outra conta.
async function getAuthenticatedUserId(request: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  // Passa o client ADMIN (service role) explicitamente — ver nota completa
  // em planLimits.ts: sem isso, a RLS de profiles filtrava a linha inteira
  // dentro desta API route (client anônimo não carrega sessão server-side)
  // e todo mundo caía no plano "free" (0 créditos), mesmo quem realmente
  // era Agência.
  const credits = await checkAiArtCredits(userId, supabase);
  if (!credits.allowed) {
    return Response.json(
      { error: `Limite de artes geradas por IA do plano atingido (${credits.used}/${credits.limit}). Fale com o suporte pra saber sobre pacotes extras.` },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as GenerateBody | null;
  if (!body?.plaqueType || !body.size || !body.businessName?.trim()) {
    return Response.json({ error: "plaqueType, size e businessName são obrigatórios" }, { status: 400 });
  }

  const logoMatch = body.logoDataUrl ? /^data:(image\/\w+);base64,(.+)$/.exec(body.logoDataUrl) : null;

  let generated: Awaited<ReturnType<typeof generatePlaqueArt>>;
  try {
    generated = await generatePlaqueArt({
      plaqueType: body.plaqueType,
      size: body.size,
      customWidthCm: body.customWidthCm,
      customHeightCm: body.customHeightCm,
      businessName: body.businessName.trim(),
      extraInfo: body.extraInfo?.trim(),
      logoBase64: logoMatch?.[2],
      logoMediaType: logoMatch?.[1],
      pixReceiverName: body.pixReceiverName?.trim(),
      pixKeyText: body.pixKeyText?.trim(),
      wifiNetworkName: body.wifiNetworkName?.trim(),
      wifiPasswordText: body.wifiPasswordText?.trim(),
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Falha ao gerar a arte" }, { status: 502 });
  }

  let imageUrl: string;
  try {
    imageUrl = await uploadPlaqueImage(supabase, userId, generated.base64, generated.mediaType);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Falha ao salvar a arte gerada" }, { status: 500 });
  }

  const { data: design, error: insertError } = await supabase
    .from("toqy_plaque_designs")
    .insert({
      owner_profile_id: userId,
      biosite_id: body.biositeId || null,
      plaque_type: body.plaqueType,
      size_label: body.customWidthCm && body.customHeightCm ? `${body.customWidthCm}x${body.customHeightCm}` : body.size,
      business_name: body.businessName.trim(),
      extra_info: body.extraInfo?.trim() || null,
      logo_url: null, // logo é enviada só pra IA usar como referência — não fica persistida separada por padrão
      image_url: imageUrl,
      status: "ready",
    })
    .select()
    .single();

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  // Incrementa o crédito usado só DEPOIS de tudo ter dado certo — falha em
  // qualquer etapa anterior não consome crédito do cliente.
  await supabase.from("profiles").update({ ai_art_credits_used: credits.used + 1 }).eq("id", userId);

  return Response.json({ design, creditsUsed: credits.used + 1, creditsLimit: credits.limit });
}
