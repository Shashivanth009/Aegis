import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, adminDb } from '@/lib/firebase/server';
import { generateHash } from '@/lib/crypto/hashing';
import { signHash } from '@/lib/crypto/signing';
import { validateFile } from '@/lib/crypto/validation';
import { generateVerifyToken } from '@/lib/crypto/tokens';
import { generateQRCode } from '@/lib/qr';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const decoded = await verifyAuthToken(req.headers.get('Authorization'));
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    // 5. Duplicate check
    const existingCerts = await adminDb.collection('certificates').where('hash', '==', hash).limit(1).get();
    if (!existingCerts.empty) return NextResponse.json({ error: 'This file has already been uploaded.' }, { status: 409 });

    const signature = signHash(hash);
    const certId = require('crypto').randomUUID();

    // 6. Store certificate in Firestore (proof-based, no file storage)
    const cert = {
      id: certId,
      user_id: decoded.uid,
      file_name: file.name,
      file_url: '', // No file storage
      hash,
      signature,
      status: 'VALID',
      recipient_name: recipientName.trim(),
      issued_by: issuedBy.trim(),
      created_at: new Date().toISOString(),
    };

    await adminDb.collection('certificates').doc(certId).set(cert);

    // 7. Generate HMAC verify token & QR
    const verifyToken = generateVerifyToken(cert.id);
    const qrDataUrl = await generateQRCode(verifyToken);

    // 8. Log action
    await adminDb.collection('audit_logs').add({
      certificate_id: cert.id,
      action: 'UPLOADED',
      actor_user_id: decoded.uid,
      actor_ip: req.headers.get('x-forwarded-for') ?? 'unknown',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ certificate: cert, qrDataUrl, verifyToken }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/certificates]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const decoded = await verifyAuthToken(req.headers.get('Authorization'));
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snapshot = await adminDb.collection('certificates')
      .where('user_id', '==', decoded.uid)
      .get();

    const certificates = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        file_name: data.file_name,
        recipient_name: data.recipient_name,
        issued_by: data.issued_by,
        status: data.status,
        created_at: data.created_at,
      };
    });

    certificates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ certificates });
  } catch (err) {
    console.error('[GET /api/certificates]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
