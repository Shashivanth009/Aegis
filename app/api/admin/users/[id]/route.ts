import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/server';
import { verifyAdminSession } from '@/lib/auth/admin_secure';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    // Delete from Firebase Auth
    await adminAuth.deleteUser(id);
    
    // Delete role from Firestore
    await adminDb.collection('user_roles').doc(id).delete();

    // Cascade delete: remove all student profiles owned by this user
    const studentSnapshot = await adminDb.collection('students')
      .where('user_id', '==', id)
      .get();
    
    const batch = adminDb.batch();
    
    for (const studentDoc of studentSnapshot.docs) {
      const studentId = studentDoc.id;
      
      // Delete associated documents
      const docsSnapshot = await adminDb.collection('student_documents')
        .where('student_id', '==', studentId)
        .get();
      docsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete associated audit logs
      const auditSnapshot = await adminDb.collection('audit_logs')
        .where('student_id', '==', studentId)
        .get();
      auditSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete the student profile itself
      batch.delete(studentDoc.ref);
    }
    
    await batch.commit();

    return NextResponse.json({ message: 'Personnel and all associated records deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { role } = await req.json();

    if (!role || !['EXAMINER', 'STUDENT', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await adminDb.collection('user_roles').doc(id).set({ role }, { merge: true });

    return NextResponse.json({ message: 'Personnel role updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
