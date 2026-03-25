import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateStudentQRCode } from '@/lib/qr';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const studentId = params.id;
  
  if (!studentId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  // Auth Protection
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify student belongs to this admin
  const { data } = await supabase.from('students').select('id').eq('id', studentId).eq('user_id', user.id).single();
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const dataUrl = await generateStudentQRCode(studentId);
    return NextResponse.json({ dataUrl });
  } catch (err: any) {
    return NextResponse.json({ error: 'QR Generation failed' }, { status: 500 });
  }
}
