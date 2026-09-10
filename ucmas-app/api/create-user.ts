// Vercel serverless function (Node runtime). Deployed automatically because
// it lives in /api at the project root — Vite/vercel.json config is not
// needed for this to work.
//
// This is the ONLY place the Supabase service_role key is ever used. It
// must be set as a Vercel env var named SUPABASE_SERVICE_ROLE_KEY — NOT
// prefixed with VITE_, so it is never bundled into client-side code.
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    res.status(500).json({ error: 'Server is not configured for admin actions.' });
    return;
  }

  // Step 1: identify the caller from their access token, using the
  // low-privilege anon client (never the service role for this check).
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header.' });
    return;
  }

  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: 'Invalid session.' });
    return;
  }

  // Step 2: only the service-role client can be trusted to check is_admin
  // (RLS would otherwise only let the caller see their own row anyway, but
  // being explicit here keeps this check independent of RLS policy changes).
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !callerProfile?.is_admin) {
    res.status(403).json({ error: 'Only admins can create accounts.' });
    return;
  }

  // Step 3: create the new account.
  const { name, email, password, level } = req.body || {};
  if (!name || !email || !password || !level) {
    res.status(400).json({ error: 'name, email, password, and level are all required.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // the account is admin-vouched-for, so skip the confirmation email
    user_metadata: { full_name: name },
  });

  if (createError || !created?.user) {
    res.status(400).json({ error: createError?.message || 'Could not create the account.' });
    return;
  }

  const { error: upsertError } = await adminClient
    .from('profiles')
    .upsert({ id: created.user.id, name, current_level: level });

  if (upsertError) {
    res.status(500).json({ error: 'Account created, but the profile could not be saved.' });
    return;
  }

  res.status(200).json({ id: created.user.id, email: created.user.email });
}
