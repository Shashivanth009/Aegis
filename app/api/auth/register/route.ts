import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['ADMIN', 'EXAMINER', 'STUDENT'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Use Service Role to bypass RLS and create user with auto-confirm
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    });

    if (authError) throw authError;

    // Immediately assign role in user_roles
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role
      });

    if (roleError) throw roleError;

    return NextResponse.json({ message: 'User created successfully', user: authData.user });
  } catch (err: any) {
    console.error('Registration Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
