import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper to ensure refreshed auth session cookies are preserved during redirects
  const createRedirectWithCookies = (url: URL | string) => {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  const pathname = request.nextUrl.pathname;

  // 1. Redirect already authenticated users from login/register to dashboard
  if ((pathname === '/login' || pathname === '/register') && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return createRedirectWithCookies(url);
  }

  // 2. Protect student dashboard & exam routes
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/exam')) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return createRedirectWithCookies(url);
  }

  // 3. Protect admin routes (authentication check)
  // Role authorization is verified authoritatively in src/app/admin/layout.tsx
  if (pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return createRedirectWithCookies(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
