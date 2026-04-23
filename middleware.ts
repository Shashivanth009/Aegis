import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const secret = process.env.ADMIN_SESSION_SECRET;
  const adminSession = secret ? request.cookies.get('aageis_admin_session')?.value === secret : false;
  const firebaseSession = request.cookies.get('aageis_session')?.value;

  // Protected routes that require login
  const isProtected = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/certificates') || 
    pathname.startsWith('/verify') || 
    pathname.startsWith('/scanner') || 
    pathname.startsWith('/student');
  
  // SPECIAL CASE: Admin Dashboard can be accessed via local TOTP session
  if (pathname.startsWith('/dashboard') && adminSession) {
    return NextResponse.next();
  }

  // Block unauthenticated access to protected pages
  if (isProtected && !firebaseSession && !adminSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/certificates/:path*', '/verify/:path*', '/scanner/:path*', '/student/:path*'],
};
