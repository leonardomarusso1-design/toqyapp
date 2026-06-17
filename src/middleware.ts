import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/app')) return NextResponse.next();

  // Aceita tanto o cookie do Supabase Auth quanto o cookie legado toqy-session
  const supabaseCookie = request.cookies.get('sb-ljsdkegxfcwrwqosbjsm-auth-token')?.value
    ?? request.cookies.get('sb-access-token')?.value
    ?? request.cookies.get('toqy-session')?.value;

  if (!supabaseCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
