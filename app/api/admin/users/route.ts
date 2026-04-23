import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/server';
import { verifyAdminSession } from '@/lib/auth/admin_secure';

export async function GET(req: Request) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    // Fetch all user roles
    const rolesSnapshot = await adminDb.collection('user_roles').get();
    const roles = rolesSnapshot.docs.map(d => ({ user_id: d.id, role: d.data().role }));

    // Fetch all users from Firebase Auth
    const listResult = await adminAuth.listUsers();
    
    const personnel = listResult.users.map(user => {
      const roleRecord = roles.find(r => r.user_id === user.uid);
      return {
        id: user.uid,
        email: user.email,
        role: roleRecord?.role || 'STUDENT',
        created_at: user.metadata.creationTime,
      };
    });

    return NextResponse.json({ personnel });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    return NextResponse.json({ message: 'Personnel created successfully', user: { uid: userRecord.uid, email: userRecord.email } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
