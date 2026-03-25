import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, createSupabaseServerClient } from '@/lib/supabase/server';
import { validateUUID } from '@/lib/crypto/validation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await verifyAuthToken(req.headers.get('Authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!validateUUID(id)) {
    return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });

  return NextResponse.json({ certificate: data });
}
