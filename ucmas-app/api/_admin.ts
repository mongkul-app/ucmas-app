// Shared by every /api/*.ts admin endpoint: verifies the caller is signed in
// AND is an admin (via the service_role key, never exposed to the browser),
// then hands back an admin Supabase client to use for the actual work.
import { createClient } from '@supabase/supabase-js';

export async function requireAdmin(req: any) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return { status: 500, error: 'Server is not configured for admin actions.' };
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { status: 401, error: 'Missing Authorization header.' };
  }

  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return { status: 401, error: 'Invalid session.' };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !callerProfile?.is_admin) {
    return { status: 403, error: 'Only admins can do this.' };
  }

  return { adminClient, callerId: userData.user.id as string };
}

/**
 * Members don't need a real email — admins only set a name + password.
 * We still need *some* unique email for Supabase Auth internally, so we
 * generate one from the name plus a short random suffix. It's never shown
 * to the member; they sign in with the "Login ID" the admin gives them,
 * which is this same generated value.
 */
export function generatePlaceholderEmail(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'member';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slug}-${suffix}@members.ucmas.local`;
}
