import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase/server';
import { verifyAdminSession } from '@/lib/auth/admin_secure';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('id');
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!studentId) return NextResponse.json({ error: 'Missing student ID' }, { status: 400 });

    // 1. Authenticate caller
    const cookieStore = await cookies();
    const sessionUid = cookieStore.get('aageis_session')?.value;
    const isAdmin = await verifyAdminSession();
    
    if (!sessionUid && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized Access. Please login as Examiner or Admin.' }, { status: 401 });
    }

    // Fetch Student
    const studentDoc = await adminDb.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json({ status: 'INVALID', reason: 'Student profile not found or forged.' }, { status: 404 });
    }
    const student = { id: studentDoc.id, ...studentDoc.data() };

    // Fetch Documents
    const docsSnapshot = await adminDb.collection('student_documents')
      .where('student_id', '==', studentId)
      .get();
    
    const documents = docsSnapshot.docs.map(d => d.data());



    if (documents.length === 0) {
      // No documents yet — show appropriate status based on student approval
      const noDocStatus = (student as any).status === 'CLEARED' ? 'PENDING_DOCS' : 
                          (student as any).status === 'REJECTED' ? 'REVOKED' : 'PENDING';
      return NextResponse.json({ 
        status: noDocStatus, 
        reason: 'Student has no secured documents uploaded yet.',
        student: {
          id: (student as any).id,
          full_name: (student as any).full_name,
          roll_number: (student as any).roll_number,
          exam_name: (student as any).exam_name,
          status: (student as any).status
        },
        checklist: [],
        isAdmin
      });
    }

    // Cryptographic verification
    const { verifySignature } = await import('@/lib/crypto/signing');

    let allValid = true;
    let failingDocument = '';

    const checklist = documents.map(doc => {
      const sigValid = verifySignature(doc.hash, doc.signature);
      if (!sigValid) {
        allValid = false;
        failingDocument = doc.document_type;
      }

      return {
        type: doc.document_type,
        fileName: doc.file_name,
        isValid: sigValid,
        aiLog: doc.ai_validation_log,
        hashPreview: doc.hash.substring(0, 12) + '...'
      };
    });

    if (!allValid) {
      await adminDb.collection('audit_logs').add({
        student_id: studentId,
        action: 'FAILED_VERIFY',
        actor_ip: ip,
        details: { reason: `Cryptographic failure on ${failingDocument}` },
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({
        status: 'INVALID',
        reason: `${failingDocument} digital signature failed verification. TAMPERING DETECTED.`,
        student: { 
          full_name: (student as any).full_name, 
          roll_number: (student as any).roll_number,
          status: (student as any).status
        },
        checklist,
        isAdmin
      });
    }

    // Determine final status based on student approval + crypto verification
    const studentStatus = (student as any).status;
    const status = studentStatus === 'REJECTED' ? 'REVOKED' : 
                   studentStatus === 'PENDING' ? 'PENDING' : 'VALID';

    // Log the successful verification scan
    await adminDb.collection('audit_logs').add({
      student_id: studentId,
      action: 'VERIFIED_SCAN',
      actor_ip: ip,
      details: { checklist_length: checklist.length },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      status,
      student: {
        id: (student as any).id,
        full_name: (student as any).full_name,
        roll_number: (student as any).roll_number,
        exam_name: (student as any).exam_name,
        created_at: (student as any).created_at,
        status: (student as any).status
      },
      checklist,
      isAdmin
    });
  } catch (err: any) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
