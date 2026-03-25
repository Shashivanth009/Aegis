import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the Service Role key.
 * ONLY used in server-side code (API routes, server components).
 * Never expose this key to the browser.
 */
export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Verify a user's JWT token from the Authorization header.
 * Returns the user if valid, null if not.
 */
export async function verifyAuthToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const supabase = createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}
