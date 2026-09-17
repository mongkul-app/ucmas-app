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
  const { adminClient, callerId } = auth;

  const { id } = req.body || {};
  if (!id) {
    res.status(400).json({ error: 'id is required.' });
    return;
  }
  if (id === callerId) {
    res.status(400).json({ error: "You can't delete your own account from here." });
    return;
  }

  // Deleting the auth user cascades to profiles and results automatically
  // (both reference auth.users with ON DELETE CASCADE).
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
}
