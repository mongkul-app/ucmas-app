// Vercel serverless function (Node runtime), admin-only.
import { requireAdmin, generatePlaceholderEmail } from './_admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = await requireAdmin(req);
  if ('error' in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }
  const { adminClient } = auth;

  const { name, password, level } = req.body || {};
  if (!name || !password || !level) {
    res.status(400).json({ error: 'name, password, and level are all required.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const email = generatePlaceholderEmail(name);

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

  res.status(200).json({ id: created.user.id, loginId: created.user.email });
}
