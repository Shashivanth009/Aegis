import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, adminDb } from '@/lib/firebase/server';
import { validateUUID } from '@/lib/crypto/validation';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decoded = await verifyAuthToken(req.headers.get('Authorization'));
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!validateUUID(id)) {
    return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
  }

  const certRef = adminDb.collection('certificates').doc(id);
  const certDoc = await certRef.get();

  if (!certDoc.exists || certDoc.data()?.user_id !== decoded.uid) {
    return NextResponse.json({ error: 'Certificate not found or not yours' }, { status: 404 });
  }

  if (certDoc.data()?.status === 'REVOKED') {
    return NextResponse.json({ error: 'Already revoked' }, { status: 409 });
  }

  await certRef.update({ status: 'REVOKED' });

  // Audit log
  await adminDb.collection('audit_logs').add({
    certificate_id: id,
    action: 'REVOKED',
    actor_user_id: decoded.uid,
    actor_ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: 'Certificate revoked' });
}
