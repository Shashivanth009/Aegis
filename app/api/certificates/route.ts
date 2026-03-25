import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, createSupabaseServerClient } from '@/lib/supabase/server';
import { generateHash } from '@/lib/crypto/hashing';
import { signHash } from '@/lib/crypto/signing';
import { validateFile } from '@/lib/crypto/validation';
import { generateVerifyToken } from '@/lib/crypto/tokens';
import { generateQRCode } from '@/lib/qr';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await verifyAuthToken(req.headers.get('Authorization'));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Parse multipart form
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const recipientName = formData.get('recipient_name') as string;
    const issuedBy = formData.get('issued_by') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!recipientName?.trim()) return NextResponse.json({ error: 'Recipient name required' }, { status: 400 });
    if (!issuedBy?.trim()) return NextResponse.json({ error: 'Issuer name required' }, { status: 400 });

    // 3. Convert to buffer & validate
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const validation = validateFile(buffer, file.type, file.size);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 422 });

    // 4. Hash & sign
    const hash = generateHash(buffer);
    const supabase = createSupabaseServerClient();

    // 5. Duplicate check
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('hash', hash)
      .single();
    if (existing) return NextResponse.json({ error: 'This file has already been uploaded.' }, { status: 409 });

    const signature = signHash(hash);
    const certId = require('crypto').randomUUID();

    // 6. Upload file to Supabase Storage (Bucket: 'certificates')
    const fileExt = file.name.split('.').pop() || 'tmp';
    const storagePath = `${user.id}/${certId}.${fileExt}`;

    const { error: storageError } = await supabase.storage
      .from('certificates')
      .upload(storagePath, buffer, {
        contentType: file.type,
      });

    if (storageError) throw new Error(`Storage error: ${storageError.message}`);

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(storagePath);
      
    const fileUrl = publicUrlData.publicUrl;

    // 7. Store certificate in Supabase
    const { data: cert, error: dbError } = await supabase
      .from('certificates')
      .insert({
        id: certId,
        user_id: user.id,
        file_name: file.name,
        file_url: fileUrl,
        hash,
        signature,
        status: 'VALID',
        recipient_name: recipientName.trim(),
        issued_by: issuedBy.trim(),
      })
      .select()
      .single();

    if (dbError || !cert) throw new Error(dbError?.message ?? 'Database error');

    // 8. Generate HMAC verify token & QR
    const verifyToken = generateVerifyToken(cert.id);
    const qrDataUrl = await generateQRCode(verifyToken);

    // 9. Log action
    await supabase.from('audit_logs').insert({
      certificate_id: cert.id,
      action: 'UPLOADED',
      actor_user_id: user.id,
      actor_ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    });

    return NextResponse.json({ certificate: cert, qrDataUrl, verifyToken }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/certificates]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req.headers.get('Authorization'));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('certificates')
      .select('id, file_name, recipient_name, issued_by, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ certificates: data });
  } catch (err) {
    console.error('[GET /api/certificates]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
