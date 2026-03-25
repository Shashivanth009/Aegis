import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { analyzeAndLog } from '@/lib/crypto/agent';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('id');
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!studentId) return NextResponse.json({ error: 'Missing student ID' }, { status: 400 });

    // 1. Authenticate caller
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized Access. Please login as Examiner.' }, { status: 401 });

    // Initialize Service Role Client (for Examiner access or full verification)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() {} } }
    );

    // Fetch Student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ status: 'INVALID', reason: 'Student profile not found or forged.' }, { status: 404 });
    }

    // Fetch Documents
    const { data: documents } = await supabase
      .from('student_documents')
      .select('*')
      .eq('student_id', studentId);

    if (!documents || documents.length === 0) {
      return NextResponse.json({ status: 'INVALID', reason: 'Student has no secured documents.' });
    }

    // Instead of doing full signature re-validation locally (which is slow),
    // we verified it mathematically on upload. We verify DB state here.
    // To make it cryptographically solid, we verify the RSA-PSS signature over the hash dynamically right now.
    
    let allValid = true;
    let failingDocument = '';

    const { verifySignature } = await import('@/lib/crypto/signing');

    const checklist = documents.map(doc => {
      // Live cryptographic check
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
      await analyzeAndLog({
        ip,
        studentId,
        action: 'FAILED_VERIFY',
        details: { reason: `Cryptographic failure on ${failingDocument}` }
      });
      return NextResponse.json({
        status: 'INVALID',
        reason: `${failingDocument} digital signature failed verification. TAMPERING DETECTED.`,
        student: { full_name: student.full_name, roll_number: student.roll_number },
        checklist
      });
    }

    // Determine final status
    const status = student.status === 'REJECTED' ? 'REVOKED' : 'VALID';

    // Log the successful verification scan
    await supabase.from('audit_logs').insert({
      student_id: studentId,
      action: 'VERIFIED_SCAN',
      actor_ip: ip,
      details: { checklist_length: checklist.length }
    });

    return NextResponse.json({
      status,
      student: {
        id: student.id,
        full_name: student.full_name,
        roll_number: student.roll_number,
        exam_name: student.exam_name,
        created_at: student.created_at
      },
      checklist
    });
  } catch (err: any) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
