import { NextRequest, NextResponse } from 'next/server';
import { validateVerifyToken } from '@/lib/crypto/tokens';
import { compareHashes } from '@/lib/crypto/hashing';
import { verifySignature } from '@/lib/crypto/signing';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { analyzeAndLog } from '@/lib/crypto/agent';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '0.0.0.0';
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
  }

  // 1. Validate HMAC token → extract cert ID (never from URL directly)
  const certId = validateVerifyToken(token);
  if (!certId) {
    return NextResponse.json({ status: 'INVALID', reason: 'Invalid or tampered verification link' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // 2. Fetch certificate record
  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', certId)
    .single();

  if (error || !cert) {
    await analyzeAndLog({ ip, certId, action: 'FAILED_VERIFY', details: { reason: 'Certificate not found' } });
    return NextResponse.json({ status: 'INVALID', reason: 'Certificate not found' }, { status: 404 });
  }

  // 3. Revocation check
  if (cert.status === 'REVOKED') {
    await analyzeAndLog({ ip, certId, action: 'VERIFIED', details: { result: 'REVOKED' } });
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

  // 4. Download the file from Cloudinary and recompute hash
  const fileRes = await fetch(cert.file_url);
  if (!fileRes.ok) {
    await analyzeAndLog({ ip, certId, action: 'FAILED_VERIFY', details: { reason: 'File fetch failed' } });
    return NextResponse.json({ status: 'INVALID', reason: 'Could not retrieve certificate file' }, { status: 502 });
  }
  const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

  // 5. Hash integrity check
  const { generateHash } = await import('@/lib/crypto/hashing');
  const recomputedHash = generateHash(fileBuffer);
  if (!compareHashes(recomputedHash, cert.hash)) {
    await analyzeAndLog({ ip, certId, action: 'FAILED_VERIFY', details: { reason: 'Hash mismatch — file tampered' } });
    return NextResponse.json({ status: 'INVALID', reason: 'Certificate file has been tampered with' });
  }

  // 6. Signature verification
  const sigValid = verifySignature(cert.hash, cert.signature);
  if (!sigValid) {
    await analyzeAndLog({ ip, certId, action: 'FAILED_VERIFY', details: { reason: 'Signature invalid' } });
    return NextResponse.json({ status: 'INVALID', reason: 'Cryptographic signature is invalid' });
  }

  // 7. All checks passed
  const { suspicious, reason } = await analyzeAndLog({ ip, certId, action: 'VERIFIED', details: { result: 'VALID' } });

  return NextResponse.json({
    status: 'VALID',
    suspicious,
    certificate: {
      recipient_name: cert.recipient_name,
      issued_by: cert.issued_by,
      created_at: cert.created_at,
      file_name: cert.file_name,
      hash: cert.hash,
    },
    ...(suspicious ? { warning: reason } : {}),
  });
}
