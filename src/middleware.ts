import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Hosts "conhecidos" do próprio TOQY — qualquer outro Host header é tratado
// como domínio próprio de cliente Agência (feature 2026-09-05, ver
// src/app/api/domains/route.ts e src/app/custom-domain/page.tsx). Preview
// deployments da Vercel (*.vercel.app) e localhost continuam servindo a
// landing/app normalmente, nunca são tratados como domínio de cliente.
const KNOWN_HOST_SUFFIXES = ['.vercel.app'];
const KNOWN_HOSTS = new Set(['toqy.com.br', 'www.toqy.com.br', 'localhost:3000', 'localhost']);

function isKnownHost(host: string) {
  return KNOWN_HOSTS.has(host) || KNOWN_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname } = request.nextUrl;

  if (!isKnownHost(host)) {
    // Domínio próprio: reescreve pra rota interna que resolve o bio site
    // pelo Host header (a lógica de lookup fica na page, não aqui — mais
    // simples e evita rodar Supabase no edge runtime do middleware).
    const url = request.nextUrl.clone();
    url.pathname = '/custom-domain';
    return NextResponse.rewrite(url);
  }

  if (!pathname.startsWith('/app')) return NextResponse.next();

  // Achado P0 de auditoria externa (2026-09-06): antes daqui, a proteção
  // de /app aceitava QUALQUER cookie chamado `toqy-session` com qualquer
  // valor — bastava rodar `document.cookie = "toqy-session=x"` no console
  // pra passar. Agora o token é decodificado e checado (formato JWT,
  // `sub` presente e `exp` no futuro), o que barra cookie forjado à mão,
  // token vencido e lixo em geral.
  //
  // LIMITE CONHECIDO E DELIBERADO: aqui NÃO se verifica a ASSINATURA do
  // JWT (exigiria o segredo do Supabase no edge runtime ou uma chamada de
  // rede ao JWKS a cada request). Portanto este middleware é um PORTÃO DE
  // UX — evita mostrar o shell do painel pra quem não está logado —, não
  // a fronteira de segurança. A fronteira real continua sendo o RLS do
  // Postgres + a validação por dono em cada rota de API (ver
  // verify-owner/verify-key). A migração completa pra sessão SSR com
  // cookie HttpOnly (recomendação da auditoria) segue pendente: mexe no
  // login inteiro de um produto com cliente pagando, então precisa de
  // rollout testado em staging, não de um deploy às cegas.
  const cookies = request.cookies.getAll();
  const sessionCookie =
    cookies.find((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && c.value) ??
    cookies.find((c) => (c.name === 'toqy-session' || c.name === 'sb-access-token') && c.value);

  if (!sessionCookie || !isPlausibleSession(sessionCookie.value)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Decodifica o payload do JWT sem verificar assinatura (ver comentário
// acima sobre o limite disso) e confere o mínimo: tem 3 partes, tem
// `sub`, e `exp` ainda não passou. Os cookies do próprio Supabase
// (`sb-*-auth-token`) podem vir como JSON ou base64 com o token dentro,
// então tenta extrair o access_token antes de decodificar.
function isPlausibleSession(rawValue: string): boolean {
  try {
    const token = extractAccessToken(rawValue);
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    ) as { sub?: string; exp?: number };

    if (!payload.sub) return false;
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function extractAccessToken(rawValue: string): string | null {
  const value = rawValue.startsWith('base64-')
    ? (() => { try { return atob(rawValue.slice(7)); } catch { return rawValue; } })()
    : rawValue;

  // Formato do cookie do Supabase: JSON com access_token dentro
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      const obj = Array.isArray(parsed) ? parsed[0] : parsed;
      return typeof obj === 'string' ? obj : (obj?.access_token ?? null);
    } catch {
      return null;
    }
  }

  // Formato do `toqy-session`: o access_token cru
  return value;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
