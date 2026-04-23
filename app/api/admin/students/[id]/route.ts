import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyAdminSession } from '@/lib/auth/admin_secure';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { status } = await req.json();

    if (!['CLEARED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await adminDb.collection('students').doc(id).update({ status });

    return NextResponse.json({ message: `Student profile marked as ${status}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const batch = adminDb.batch();

    // Delete associated documents
    const docsSnapshot = await adminDb.collection('student_documents')
      .where('student_id', '==', id)
      .get();
    docsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete associated audit logs
    const auditSnapshot = await adminDb.collection('audit_logs')
      .where('student_id', '==', id)
      .get();
    auditSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete the student profile
    batch.delete(adminDb.collection('students').doc(id));

    await batch.commit();

    return NextResponse.json({ message: 'Student and all associated data deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
