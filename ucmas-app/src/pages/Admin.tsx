import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { LEVELS } from '../data/levelConfig';
import { getStudent } from '../utils/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function Admin() {
  const student = getStudent();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState(LEVELS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  if (!isSupabaseConfigured || !student.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Your session expired — please sign in again.');

      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email, password, level }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Could not create the account.');

      setCreated(result.email);
      setName('');
      setEmail('');
      setPassword('');
      setLevel(LEVELS[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
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
          <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl p-3.5 mb-4 text-sm">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>
              Account created for <span className="font-semibold">{created}</span>. Share the email and password with them directly.
            </span>
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
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
    </div>
  );
}
