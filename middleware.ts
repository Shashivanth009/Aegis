import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/certificates') || 
    pathname.startsWith('/verify') || 
    pathname.startsWith('/scanner') || 
    pathname.startsWith('/student');
  const isAuthPage = pathname.startsWith('/auth');

  // Block unauthenticated access to protected pages
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    // Pass the intended redirect
    loginUrl.pathname = '/auth';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth page
  if (isAuthPage && user) {
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/dashboard';
    const parsedRedirectUrl = request.nextUrl.clone();
    parsedRedirectUrl.pathname = redirectUrl;
    return NextResponse.redirect(parsedRedirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/certificates/:path*', '/verify/:path*', '/scanner/:path*', '/student/:path*', '/auth'],
};
