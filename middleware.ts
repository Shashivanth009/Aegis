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
  
  // Protected routes that require login
  const isProtected = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/certificates') || 
    pathname.startsWith('/verify') || 
    pathname.startsWith('/scanner') || 
    pathname.startsWith('/student');
  
  // Auth pages (the role selection + individual role login pages)
  const isAuthPage = pathname.startsWith('/auth');

  // Block unauthenticated access to protected pages
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from the base /auth page only
  // (Allow access to /auth/admin, /auth/examiner, /auth/student for switching roles)
  if (pathname === '/auth' && user) {
    // Fetch role to redirect to correct dashboard
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
    const role = roleData?.role;
    
    const redirectUrl = request.nextUrl.clone();
    if (role === 'ADMIN') redirectUrl.pathname = '/dashboard';
    else if (role === 'EXAMINER') redirectUrl.pathname = '/scanner';
    else if (role === 'STUDENT') redirectUrl.pathname = '/student';
    else redirectUrl.pathname = '/dashboard';
    
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/certificates/:path*', '/verify/:path*', '/scanner/:path*', '/student/:path*', '/auth/:path*'],
};
