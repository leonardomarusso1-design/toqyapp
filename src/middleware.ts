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

  // Supabase salva sessão em cookies com nomes que variam — aceita qualquer um deles
  const cookies = request.cookies.getAll();
  const hasSession = cookies.some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && c.value
  ) || cookies.some(
    (c) => (c.name === 'toqy-session' || c.name === 'sb-access-token') && c.value
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
