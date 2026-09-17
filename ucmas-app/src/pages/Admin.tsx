import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { UserPlus, Loader2, CheckCircle2, Copy, Pencil, Trash2, X, Check } from 'lucide-react';
import { LEVELS, getLevelConfig } from '../data/levelConfig';
import { getStudent } from '../utils/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface MemberRow {
  id: string;
  name: string;
  level: string;
  isAdmin: boolean;
  createdAt: string;
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const { data } = await supabase!.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session expired — please sign in again.');
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Something went wrong.');
  return result;
}

export default function Admin() {
  const student = getStudent();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState(LEVELS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ loginId: string; password: string } | null>(null);

  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const loadMembers = async () => {
    try {
      setListError(null);
      const result = await authedFetch('/api/list-users');
      setMembers(result.members);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not load accounts.');
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured && student.isAdmin) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isSupabaseConfigured || !student.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setSubmitting(true);
    try {
      const result = await authedFetch('/api/create-user', {
        method: 'POST',
        body: JSON.stringify({ name, password, level }),
      });
      setCreated({ loginId: result.loginId, password });
      setName('');
      setPassword('');
      setLevel(LEVELS[0].id);
      loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (m: MemberRow) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditLevel(m.level);
    setEditPassword('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPassword('');
  };

  const saveEdit = async (id: string) => {
    setRowBusy(id);
    try {
      await authedFetch('/api/update-user', {
        method: 'POST',
        body: JSON.stringify({
          id,
          name: editName,
          level: editLevel,
          password: editPassword || undefined,
        }),
      });
      setEditingId(null);
      setEditPassword('');
      loadMembers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not update this account.');
    } finally {
      setRowBusy(null);
    }
  };

  const deleteMember = async (id: string, memberName: string) => {
    if (!window.confirm(`Delete ${memberName}'s account? This cannot be undone.`)) return;
    setRowBusy(id);
    try {
      await authedFetch('/api/delete-user', { method: 'POST', body: JSON.stringify({ id }) });
      loadMembers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not delete this account.');
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center">
          <UserPlus size={20} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Create Account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Set up a member's login and starting level.</p>
        </div>
      </div>

      <div className="card p-6">
        {created && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl p-3.5 mb-4 text-sm space-y-1.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>Account created! Share these login details with the member — they won't see them again.</span>
            </div>
            <div className="flex items-center justify-between bg-white/60 dark:bg-navy-900/40 rounded-lg px-3 py-2 font-mono text-xs">
              <span>Login ID: {created.loginId}</span>
              <button type="button" onClick={() => navigator.clipboard.writeText(created.loginId)} className="text-emerald-700 dark:text-emerald-400">
                <Copy size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between bg-white/60 dark:bg-navy-900/40 rounded-lg px-3 py-2 font-mono text-xs">
              <span>Password: {created.password}</span>
              <button type="button" onClick={() => navigator.clipboard.writeText(created.password)} className="text-emerald-700 dark:text-emerald-400">
                <Copy size={14} />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Password</label>
            <input
              type="text"
              required
              minLength={6}
              placeholder="Give them a temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Starting level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2.5 text-sm"
            >
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-bold text-slate-900 dark:text-white mb-3">All Accounts</h2>
        {listError && <p className="text-xs text-rose-600 font-medium mb-2">{listError}</p>}
        {members === null && !listError && (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-brand-600" />
          </div>
        )}
        {members && members.length === 0 && <p className="text-sm text-slate-400">No accounts yet.</p>}
        <div className="space-y-2.5">
          {members?.map((m) => {
            const isEditing = editingId === m.id;
            const busy = rowBusy === m.id;
            return (
              <div key={m.id} className="card p-4">
                {isEditing ? (
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2 text-sm"
                      placeholder="Full name"
                    />
                    <select
                      value={editLevel}
                      onChange={(e) => setEditLevel(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2 text-sm"
                    >
                      {LEVELS.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="New password (leave blank to keep current)"
                      className="w-full rounded-lg border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(m.id)} disabled={busy} className="btn-primary text-xs px-3 py-2 flex-1">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Save
                      </button>
                      <button onClick={cancelEdit} disabled={busy} className="btn-secondary text-xs px-3 py-2">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {m.name} {m.isAdmin && <span className="text-[10px] font-bold text-brand-600 ml-1">ADMIN</span>}
                      </p>
                      <p className="text-xs text-slate-400">{getLevelConfig(m.level)?.name ?? m.level}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => startEdit(m)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700" aria-label="Edit">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => deleteMember(m.id, m.name)}
                        disabled={busy || m.id === student.id}
                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-30"
                        aria-label="Delete"
                      >
                        {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
