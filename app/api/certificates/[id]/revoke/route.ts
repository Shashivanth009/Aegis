import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, createSupabaseServerClient } from '@/lib/supabase/server';
import { validateUUID } from '@/lib/crypto/validation';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await verifyAuthToken(req.headers.get('Authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!validateUUID(id)) {
    return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Ownership check — only the issuer can revoke
  const { data: cert } = await supabase
    .from('certificates')
    .select('id, status, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!cert) return NextResponse.json({ error: 'Certificate not found or not yours' }, { status: 404 });
  if (cert.status === 'REVOKED') return NextResponse.json({ error: 'Already revoked' }, { status: 409 });

  const { error } = await supabase
    .from('certificates')
    .update({ status: 'REVOKED' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to revoke' }, { status: 500 });

  // Audit log
  await supabase.from('audit_logs').insert({
    certificate_id: id,
    action: 'REVOKED',
    actor_user_id: user.id,
    actor_ip: req.headers.get('x-forwarded-for') ?? 'unknown',
  });

  return NextResponse.json({ success: true, message: 'Certificate revoked' });
}
