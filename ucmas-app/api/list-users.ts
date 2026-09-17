// Vercel serverless function (Node runtime), admin-only.
import { requireAdmin } from './_admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = await requireAdmin(req);
  if ('error' in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }
  const { adminClient } = auth;

  const { data: profiles, error: profilesError } = await adminClient
    .from('profiles')
    .select('id, name, current_level, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (profilesError) {
    res.status(500).json({ error: 'Could not load members.' });
    return;
  }

  const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    res.status(500).json({ error: 'Could not load login emails.' });
    return;
  }
  const emailById = new Map(usersData.users.map((u) => [u.id, u.email]));

  const members = (profiles || []).map((p) => ({
    id: p.id,
    name: p.name,
    level: p.current_level,
    isAdmin: p.is_admin,
    email: emailById.get(p.id) || null,
    createdAt: p.created_at,
  }));

  res.status(200).json({ members });
}
