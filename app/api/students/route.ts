import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) { /* Ignore for API */ }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, roll_number, exam_name } = body;

    if (!full_name || !roll_number || !exam_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert student
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        user_id: user.id,
        full_name,
        roll_number,
        exam_name
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint on roll_number
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A student with this roll number already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ student });
  } catch (err: any) {
    console.error('Error creating student:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check role
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
  const role = roleData?.role || 'STUDENT';

  let studentsData;
  
  if (role === 'ADMIN' || role === 'EXAMINER') {
    // Admins and Examiners need to see all students. Bypass RLS.
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() {} } }
    );
    const { data } = await supabaseAdmin.from('students').select('*').order('created_at', { ascending: false });
    studentsData = data;
  } else {
    // Normal student only sees their own profile
    const { data } = await supabase.from('students').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    studentsData = data;
  }

  return NextResponse.json({ students: studentsData });
}
