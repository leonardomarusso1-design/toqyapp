import { NextRequest } from "next/server";

// "Link vira multi-plataforma automático" (2026-09-08, pedido ao vivo:
// "Conectar conta do Spotify via OAuth" — perguntado o que isso deveria
// fazer de verdade, resposta: gerar os links equivalentes em outras
// plataformas a partir de 1 link do Spotify, SEM OAuth/login de conta).
// Usa a API pública do Odesli/song.link (sem chave, sem autenticação) —
// mesmo serviço por trás do "share" do próprio Spotify/Apple Music.
// Proxy pelo servidor (não client direto) pra não expor o comportamento
// de terceiro no bundle e poder normalizar erro/timeout num só lugar.
const ODESLI_URL = "https://api.song.link/v1-alpha.1/links";
const TIMEOUT_MS = 6000;

type OdesliEntity = { url: string };
type OdesliResponse = { linksByPlatform?: Record<string, OdesliEntity> };

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return Response.json({ error: "Faltou o link" }, { status: 400 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ODESLI_URL}?url=${encodeURIComponent(url)}&userCountry=BR`, { signal: controller.signal });
    if (!res.ok) return Response.json({ error: "Link não encontrado nas outras plataformas" }, { status: 404 });

    const data = (await res.json()) as OdesliResponse;
    const byPlatform = data.linksByPlatform ?? {};
    return Response.json({
      appleMusic: byPlatform.appleMusic?.url,
      youtubeMusic: byPlatform.youtubeMusic?.url ?? byPlatform.youtube?.url,
      deezer: byPlatform.deezer?.url,
      amazonMusic: byPlatform.amazonMusic?.url,
    });
  } catch {
    return Response.json({ error: "Não foi possível buscar as outras plataformas agora" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
