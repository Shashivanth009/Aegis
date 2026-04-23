import { NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { adminAuth } from '@/lib/firebase/server';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken);
    
    // Set a session cookie with the user ID
    const cookie = serialize('aageis_session', decoded.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const response = NextResponse.json({ message: 'Session created' });
    response.headers.append('Set-Cookie', cookie);
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function DELETE() {
  const cookie1 = serialize('aageis_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  
  const cookie2 = serialize('aageis_admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  const cookie3 = serialize('aageis_admin_ui', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  const response = NextResponse.json({ message: 'Session cleared' });
  response.headers.append('Set-Cookie', cookie1);
  response.headers.append('Set-Cookie', cookie2);
  response.headers.append('Set-Cookie', cookie3);
  return response;
}
