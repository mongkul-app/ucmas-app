// Vercel serverless function (Node runtime), admin-only.
import { requireAdmin } from './_admin';

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

  const { id, name, level, password } = req.body || {};
  if (!id) {
    res.status(400).json({ error: 'id is required.' });
    return;
  }

  if (password) {
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const { error: pwError } = await adminClient.auth.admin.updateUserById(id, { password });
    if (pwError) {
      res.status(400).json({ error: pwError.message });
      return;
    }
  }

  if (name || level) {
    const update = {};
    if (name) update.name = name;
    if (level) update.current_level = level;
    const { error: profileError } = await adminClient.from('profiles').update(update).eq('id', id);
    if (profileError) {
      res.status(500).json({ error: 'Could not update the profile.' });
      return;
    }
  }

  res.status(200).json({ ok: true });
}
