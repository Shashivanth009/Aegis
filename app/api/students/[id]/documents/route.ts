import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase/server';
import { validateFile } from '@/lib/crypto/validation';
import { generateHash } from '@/lib/crypto/hashing';
import { signHash } from '@/lib/crypto/signing';
import { validateDocumentWithVision, DocumentType } from '@/lib/ai/vision';
import crypto from 'crypto';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    
    // Auth Check
    const cookieStore = await cookies();
    const sessionUid = cookieStore.get('aageis_session')?.value;
    if (!sessionUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const docType = formData.get('document_type') as DocumentType;

    if (!file || !docType) {
      return NextResponse.json({ error: 'Missing file or document_type' }, { status: 400 });
    }

    // 1. Basic Validation (Magic Bytes & Size)
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const v = validateFile(buffer, file.type, file.size);
      if (!v.valid) throw new Error(v.error);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Fetch student profile to get registered name for cross-verification
    const studentDoc = await adminDb.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }
    const studentData = studentDoc.data();
    const studentName = studentData?.full_name as string | undefined;

    // 2. Multimodal AI Vision Authenticity + Name Cross-Verification
    const aiResult = await validateDocumentWithVision(buffer, file.type, docType, studentName);
    
    if (!aiResult.success) {
      const isNameMismatch = aiResult.reason.toUpperCase().includes('NAME_MISMATCH');
      // Log suspicious activity
      await adminDb.collection('audit_logs').add({
        student_id: studentId,
        action: isNameMismatch ? 'NAME_MISMATCH_REJECTED' : 'AI_REJECTED',
        actor_user_id: sessionUid,
        details: { type: docType, reason: aiResult.reason, filename: file.name },
        created_at: new Date().toISOString(),
      });
      
      const errorMsg = isNameMismatch
        ? `Identity Mismatch: The name on the uploaded ${docType} does not match your registered profile name. ${aiResult.reason}`
        : `AI Verification Failed: The document structure appears invalid or tampered. AI Details: ${aiResult.reason}`;
      
      return NextResponse.json(
        { error: errorMsg, aiReason: aiResult.reason }, 
        { status: 422 }
      );
    }

    // 3. Cryptographic Hashing
    const hash = generateHash(buffer);

    // 4. Duplicate Hash Check
    const existingDocs = await adminDb.collection('student_documents').where('hash', '==', hash).limit(1).get();
    if (!existingDocs.empty) return NextResponse.json({ error: 'This mathematically identical file has already been secured.' }, { status: 409 });

    // 5. Check if student already has this document type
    const existingType = await adminDb.collection('student_documents')
      .where('student_id', '==', studentId)
      .where('document_type', '==', docType)
      .limit(1)
      .get();
    if (!existingType.empty) {
      return NextResponse.json({ error: `Student already has a ${docType} document uploaded.` }, { status: 409 });
    }

    // 6. RSA-PSS Signing
    const signature = signHash(hash);
    const documentId = crypto.randomUUID();

    // 7. Store Document in Firestore (no file storage needed - we store the cryptographic proof)
    const docData = {
      id: documentId,
      student_id: studentId,
      document_type: docType,
      file_name: file.name,
      file_url: '', // No file storage - proof-based verification
      hash,
      signature,
      ai_validation_log: aiResult.reason,
      created_at: new Date().toISOString(),
    };
    
    await adminDb.collection('student_documents').doc(documentId).set(docData);

    // Audit Success
    await adminDb.collection('audit_logs').add({
      student_id: studentId,
      action: 'DOCUMENT_MATHEMATICALLY_SECURED',
      actor_user_id: sessionUid,
      details: { document_id: documentId, type: docType },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Document secured', document: docData });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionUid = cookieStore.get('aageis_session')?.value;
    const isAdmin = cookieStore.get('aageis_admin_session')?.value === process.env.ADMIN_SESSION_SECRET;
    
    if (!sessionUid && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await adminDb.collection('student_documents')
      .where('student_id', '==', id)
      .get();

    const documents = snapshot.docs.map(d => d.data());
    return NextResponse.json({ documents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
