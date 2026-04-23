import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const email = 'admin@aegis.com';
    const password = 'admin'; // You can change this here

    // 1. Delete existing user if any
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);
    
    if (existingUser) {
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }

    // 2. Create the user correctly via Admin API (handles hashing)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'ADMIN' }
    });

    if (authError) throw authError;

    // 3. Ensure role is assigned
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: 'ADMIN'
      });

    if (roleError) throw roleError;

    return NextResponse.json({ 
      message: 'Admin account initialized successfully.',
      email,
      password,
      info: 'YOU CAN NOW LOGIN. PLEASE DELETE THIS FILE (app/api/auth/setup-admin/route.ts) FOR SECURITY.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
