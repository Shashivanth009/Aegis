import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/server';

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['EXAMINER', 'STUDENT'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Only EXAMINER and STUDENT can self-register.' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
    });

    // Assign role in Firestore
    await adminDb.collection('user_roles').doc(userRecord.uid).set({
      role: role,
    });

    return NextResponse.json({ message: 'User created successfully', user: { uid: userRecord.uid, email: userRecord.email } });
  } catch (err: any) {
    console.error('Registration Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
