import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, adminDb } from '@/lib/firebase/server';
import { validateUUID } from '@/lib/crypto/validation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decoded = await verifyAuthToken(req.headers.get('Authorization'));
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!validateUUID(id)) {
    return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
  }

  const certDoc = await adminDb.collection('certificates').doc(id).get();
  if (!certDoc.exists || certDoc.data()?.user_id !== decoded.uid) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  return NextResponse.json({ certificate: { id: certDoc.id, ...certDoc.data() } });
}
