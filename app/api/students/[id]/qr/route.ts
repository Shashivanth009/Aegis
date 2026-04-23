import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase/server';
import { generateStudentQRCode } from '@/lib/qr';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;
  
  if (!studentId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  // Auth Protection
  const cookieStore = await cookies();
  const sessionUid = cookieStore.get('aageis_session')?.value;
  if (!sessionUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify student belongs to this user
  const studentDoc = await adminDb.collection('students').doc(studentId).get();
  if (!studentDoc.exists || studentDoc.data()?.user_id !== sessionUid) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const dataUrl = await generateStudentQRCode(studentId);
    return NextResponse.json({ dataUrl });
  } catch (err: any) {
    return NextResponse.json({ error: 'QR Generation failed' }, { status: 500 });
  }
}
