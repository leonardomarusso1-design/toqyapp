import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ['/app/:path*'],
};
