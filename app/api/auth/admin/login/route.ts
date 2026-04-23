import { NextResponse } from 'next/server';
import { verifyTOTP } from '@/lib/auth/admin_secure';
import { serialize } from 'cookie';

export async function POST(req: Request) {
  try {
    const { password, token } = await req.json();

    if (!password || !token) {
      return NextResponse.json({ error: 'Password and Authenticator code are required' }, { status: 400 });
    }

    const isPasswordValid = password === process.env.ADMIN_PASSWORD;
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    const isValidToken = verifyTOTP(token);
    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 401 });
    }

    // Set a secure, httpOnly cookie for the admin session
    const cookie = serialize('aageis_admin_session', process.env.ADMIN_SESSION_SECRET!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    const uiCookie = serialize('aageis_admin_ui', 'verified', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    const response = NextResponse.json({ message: 'Authenticated successfully' });
    response.headers.append('Set-Cookie', cookie);
    response.headers.append('Set-Cookie', uiCookie);

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
