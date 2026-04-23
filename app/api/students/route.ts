import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/server';
import { verifyAdminSession } from '@/lib/auth/admin_secure';

export async function POST(req: Request) {
  try {
    // Auth: check Firebase session cookie
    const cookieStore = await cookies();
    const sessionUid = cookieStore.get('aageis_session')?.value;
    if (!sessionUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, roll_number, exam_name } = body;

    if (!full_name || !roll_number || !exam_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if roll_number already exists
    const existing = await adminDb.collection('students')
      .where('roll_number', '==', roll_number)
      .limit(1)
      .get();
    
    if (!existing.empty) {
      return NextResponse.json({ error: 'A student with this roll number already exists' }, { status: 409 });
    }

    // Insert student
    const studentRef = adminDb.collection('students').doc();
    const student = {
      id: studentRef.id,
      user_id: sessionUid,
      full_name,
      roll_number,
      exam_name,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    await studentRef.set(student);

    return NextResponse.json({ student });
  } catch (err: any) {
    console.error('Error creating student:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

  export async function GET(req: Request) {
    try {
      const cookieStore = await cookies();
      const isAdmin = cookieStore.get('aageis_admin_session')?.value === process.env.ADMIN_SESSION_SECRET;
      const sessionUid = cookieStore.get('aageis_session')?.value;
      const { searchParams } = new URL(req.url);
      const queryAll = searchParams.get('query') === 'all';
  
      if (!sessionUid && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
      let studentsData: any[] = [];
  
      if (isAdmin && queryAll) {
      // Admin: fetch all students
      const snapshot = await adminDb.collection('students').orderBy('created_at', 'desc').get();
      studentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } else if (sessionUid) {
      // Check role
      const roleDoc = await adminDb.collection('user_roles').doc(sessionUid).get();
      const role = roleDoc.exists ? roleDoc.data()?.role : 'STUDENT';

      if ((role === 'ADMIN' || role === 'EXAMINER') && queryAll) {
        const snapshot = await adminDb.collection('students').orderBy('created_at', 'desc').get();
        studentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        const snapshot = await adminDb.collection('students')
          .where('user_id', '==', sessionUid)
          .get();
        studentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        studentsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    }

    return NextResponse.json({ students: studentsData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
