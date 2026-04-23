import { NextRequest, NextResponse } from 'next/server';
import { validateVerifyToken } from '@/lib/crypto/tokens';
import { verifySignature } from '@/lib/crypto/signing';
import { adminDb } from '@/lib/firebase/server';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
  }

  // 1. Validate HMAC token → extract cert ID
  const certId = validateVerifyToken(token);
  if (!certId) {
    return NextResponse.json({ status: 'INVALID', reason: 'Invalid or tampered verification link' }, { status: 400 });
  }

  // 2. Fetch certificate record
  const certDoc = await adminDb.collection('certificates').doc(certId).get();

  if (!certDoc.exists) {
    return NextResponse.json({ status: 'INVALID', reason: 'Certificate not found' }, { status: 404 });
  }

  const cert = certDoc.data()!;

  // 3. Revocation check
  if (cert.status === 'REVOKED') {
    return NextResponse.json({
      status: 'REVOKED',
      certificate: {
        recipient_name: cert.recipient_name,
        issued_by: cert.issued_by,
        created_at: cert.created_at,
        file_name: cert.file_name,
      },
    });
  }

  // 4. Signature verification (proof-based: verify stored hash against stored signature)
  const sigValid = verifySignature(cert.hash, cert.signature);
  if (!sigValid) {
    return NextResponse.json({ status: 'INVALID', reason: 'Cryptographic signature is invalid' });
  }

  // 5. All checks passed
  return NextResponse.json({
    status: 'VALID',
    certificate: {
      recipient_name: cert.recipient_name,
      issued_by: cert.issued_by,
      created_at: cert.created_at,
      file_name: cert.file_name,
      hash: cert.hash,
    },
  });
}
