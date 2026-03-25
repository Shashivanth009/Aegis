import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateFile } from '@/lib/crypto/validation';
import { generateHash } from '@/lib/crypto/hashing';
import { signHash } from '@/lib/crypto/signing';
import { validateDocumentWithVision, DocumentType } from '@/lib/ai/vision';
import crypto from 'crypto';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const studentId = params.id;
    
    // Auth Check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    // 2. Multimodal AI Vision Authenticity Validation
    const aiResult = await validateDocumentWithVision(buffer, file.type, docType);
    
    if (!aiResult.success) {
      // Log suspicious activity
      await supabase.from('audit_logs').insert({
        student_id: studentId,
        action: 'AI_REJECTED',
        actor_user_id: user.id,
        details: { type: docType, reason: aiResult.reason, filename: file.name }
      });
      return NextResponse.json(
        { error: 'AI Verification Failed: The document structure appears invalid or tampered.', aiReason: aiResult.reason }, 
        { status: 422 }
      );
    }

    // 3. Cryptographic Hashing
    const hash = generateHash(buffer);

    // 4. Duplicate Hash Check
    const { data: existing } = await supabase.from('student_documents').select('id').eq('hash', hash).single();
    if (existing) return NextResponse.json({ error: 'This mathematically identical file has already been secured.' }, { status: 409 });

    // 5. RSA-PSS Signing
    const signature = signHash(hash);
    const documentId = crypto.randomUUID();

    // 6. Supabase Storage Upload
    const fileExt = file.name.split('.').pop() || 'tmp';
    const storagePath = `${studentId}/${documentId}.${fileExt}`;

    const { error: storageError } = await supabase.storage
      .from('certificates')
      .upload(storagePath, buffer, { contentType: file.type });

    if (storageError) throw new Error(`Storage error: ${storageError.message}`);

    const { data: publicUrlData } = supabase.storage.from('certificates').getPublicUrl(storagePath);
    const fileUrl = publicUrlData.publicUrl;

    // 7. Store Document in Database
    const { data: doc, error: dbError } = await supabase
      .from('student_documents')
      .insert({
        id: documentId,
        student_id: studentId,
        document_type: docType,
        file_name: file.name,
        file_url: fileUrl,
        hash,
        signature,
        ai_validation_log: aiResult.reason
      })
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json({ error: `Student already has a ${docType} document uploaded.` }, { status: 409 });
      }
      throw dbError;
    }

    // Audit Success
    await supabase.from('audit_logs').insert({
      student_id: studentId,
      action: 'DOCUMENT_METHEMATICALLY_SECURED',
      actor_user_id: user.id,
      details: { document_id: documentId, type: docType }
    });

    return NextResponse.json({ message: 'Document secured', document: doc });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
