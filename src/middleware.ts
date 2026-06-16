import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protege todas as rotas que começam com /app
  if (pathname.startsWith('/app')) {
    const sessionCookie = request.cookies.get('toqy-session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Validação segura se o Supabase real estiver configurado
      if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        
        const { data: { user }, error } = await supabase.auth.getUser(sessionCookie);
        
        if (error || !user) {
          const response = NextResponse.redirect(new URL('/login', request.url));
          response.cookies.delete('toqy-session');
          return response;
        }
      } else {
        // Se estiver em modo offline/placeholder sem credenciais, verifica apenas a existência do cookie
        if (!sessionCookie) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
